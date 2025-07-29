# Docker Deployment Verification Script for Ellie Voice Receptionist
# This script tests all deployment scenarios as specified in task 11

param(
    [switch]$SkipBuild,
    [switch]$TestSSL,
    [int]$TimeoutSeconds = 120
)

Write-Host "=== Ellie Voice Receptionist Docker Deployment Test ===" -ForegroundColor Green
Write-Host "Testing deployment functionality as per requirements 4.1, 4.2, 4.3, 4.4" -ForegroundColor Yellow
Write-Host ""

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to wait for service health
function Wait-ForServiceHealth {
    param(
        [string]$ServiceName,
        [string]$HealthUrl,
        [int]$TimeoutSeconds = 60
    )
    
    Write-Host "Waiting for $ServiceName to be healthy..." -ForegroundColor Yellow
    $elapsed = 0
    $interval = 5
    
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "$ServiceName is healthy!" -ForegroundColor Green
                return $true
            }
        } catch {
            # Service not ready yet
        }
        
        Start-Sleep $interval
        $elapsed += $interval
        Write-Host "  Waiting... ($elapsed/$TimeoutSeconds seconds)" -ForegroundColor Gray
    }
    
    Write-Host "$ServiceName failed to become healthy within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Function to test development environment
function Test-DevelopmentEnvironment {
    Write-Host "=== Testing Development Environment ===" -ForegroundColor Cyan
    Write-Host "Command: docker-compose up --build" -ForegroundColor Gray
    
    try {
        # Clean up any existing containers
        Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
        docker-compose down --remove-orphans 2>$null
        
        # Build and start development environment
        Write-Host "Building and starting development environment..." -ForegroundColor Yellow
        if ($SkipBuild) {
            $process = Start-Process -FilePath "docker-compose" -ArgumentList "up" -PassThru -NoNewWindow
        } else {
            $process = Start-Process -FilePath "docker-compose" -ArgumentList "up", "--build" -PassThru -NoNewWindow
        }
        
        # Wait for services to start
        Start-Sleep 30
        
        # Check if containers are running
        $containers = docker-compose ps --format json | ConvertFrom-Json
        $runningContainers = $containers | Where-Object { $_.State -eq "running" }
        
        Write-Host "Container Status:" -ForegroundColor Yellow
        foreach ($container in $containers) {
            $status = if ($container.State -eq "running") { "✅" } else { "❌" }
            Write-Host "  $status $($container.Service): $($container.State)" -ForegroundColor White
        }
        
        # Test service endpoints
        $testResults = @{}
        
        # Test frontend
        Write-Host "Testing frontend accessibility..." -ForegroundColor Yellow
        $testResults.Frontend = Wait-ForServiceHealth -ServiceName "Frontend" -HealthUrl "http://localhost:3000" -TimeoutSeconds 60
        
        # Test backend
        Write-Host "Testing backend health endpoint..." -ForegroundColor Yellow
        $testResults.Backend = Wait-ForServiceHealth -ServiceName "Backend" -HealthUrl "http://localhost:5000/health" -TimeoutSeconds 60
        
        # Test nginx proxy
        Write-Host "Testing nginx proxy..." -ForegroundColor Yellow
        $testResults.Nginx = Wait-ForServiceHealth -ServiceName "Nginx" -HealthUrl "http://localhost:80" -TimeoutSeconds 60
        
        # Test Redis
        Write-Host "Testing Redis connectivity..." -ForegroundColor Yellow
        try {
            $redisTest = docker exec ellie-redis-1 redis-cli ping 2>$null
            $testResults.Redis = ($redisTest -eq "PONG")
            if ($testResults.Redis) {
                Write-Host "Redis is responding!" -ForegroundColor Green
            } else {
                Write-Host "Redis is not responding" -ForegroundColor Red
            }
        } catch {
            $testResults.Redis = $false
            Write-Host "Redis test failed: $_" -ForegroundColor Red
        }
        
        # Stop development environment
        Write-Host "Stopping development environment..." -ForegroundColor Yellow
        $process.Kill()
        docker-compose down --remove-orphans
        
        return $testResults
        
    } catch {
        Write-Host "Development environment test failed: $_" -ForegroundColor Red
        docker-compose down --remove-orphans 2>$null
        return @{ Frontend = $false; Backend = $false; Nginx = $false; Redis = $false }
    }
}

# Function to test production environment
function Test-ProductionEnvironment {
    Write-Host "=== Testing Production Environment ===" -ForegroundColor Cyan
    Write-Host "Command: docker-compose -f docker-compose.prod.yml up --build" -ForegroundColor Gray
    
    try {
        # Clean up any existing containers
        Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
        docker-compose -f docker-compose.prod.yml down --remove-orphans 2>$null
        
        # Build and start production environment
        Write-Host "Building and starting production environment..." -ForegroundColor Yellow
        if ($SkipBuild) {
            $process = Start-Process -FilePath "docker-compose" -ArgumentList "-f", "docker-compose.prod.yml", "up" -PassThru -NoNewWindow
        } else {
            $process = Start-Process -FilePath "docker-compose" -ArgumentList "-f", "docker-compose.prod.yml", "up", "--build" -PassThru -NoNewWindow
        }
        
        # Wait for services to start (production takes longer due to health checks)
        Start-Sleep 60
        
        # Check if containers are running
        $containers = docker-compose -f docker-compose.prod.yml ps --format json | ConvertFrom-Json
        $runningContainers = $containers | Where-Object { $_.State -eq "running" }
        
        Write-Host "Container Status:" -ForegroundColor Yellow
        foreach ($container in $containers) {
            $status = if ($container.State -eq "running") { "✅" } else { "❌" }
            Write-Host "  $status $($container.Service): $($container.State)" -ForegroundColor White
        }
        
        # Test service endpoints
        $testResults = @{}
        
        # Test nginx proxy (production uses port 80/443)
        Write-Host "Testing production nginx proxy..." -ForegroundColor Yellow
        $testResults.Nginx = Wait-ForServiceHealth -ServiceName "Production Nginx" -HealthUrl "http://localhost:80" -TimeoutSeconds 90
        
        # Test monitoring service
        Write-Host "Testing monitoring service..." -ForegroundColor Yellow
        $testResults.Monitoring = Wait-ForServiceHealth -ServiceName "Monitoring" -HealthUrl "http://localhost:9090" -TimeoutSeconds 60
        
        # Test Redis
        Write-Host "Testing Redis connectivity..." -ForegroundColor Yellow
        try {
            $redisTest = docker exec ellie-redis-1 redis-cli ping 2>$null
            $testResults.Redis = ($redisTest -eq "PONG")
            if ($testResults.Redis) {
                Write-Host "Redis is responding!" -ForegroundColor Green
            } else {
                Write-Host "Redis is not responding" -ForegroundColor Red
            }
        } catch {
            $testResults.Redis = $false
            Write-Host "Redis test failed: $_" -ForegroundColor Red
        }
        
        # Stop production environment
        Write-Host "Stopping production environment..." -ForegroundColor Yellow
        $process.Kill()
        docker-compose -f docker-compose.prod.yml down --remove-orphans
        
        return $testResults
        
    } catch {
        Write-Host "Production environment test failed: $_" -ForegroundColor Red
        docker-compose -f docker-compose.prod.yml down --remove-orphans 2>$null
        return @{ Nginx = $false; Monitoring = $false; Redis = $false }
    }
}

# Function to test SSL certificate generation
function Test-SSLCertificateGeneration {
    Write-Host "=== Testing SSL Certificate Generation ===" -ForegroundColor Cyan
    
    $testResults = @{}
    
    # Test PowerShell SSL setup script
    Write-Host "Testing PowerShell SSL setup script..." -ForegroundColor Yellow
    try {
        # Test with self-signed certificate generation
        & .\docker\ssl-setup.ps1 -Domain "test.local" -SelfSigned
        
        # Check if SSL directories were created
        $testResults.DirectoryCreation = (Test-Path "./ssl/certs") -and (Test-Path "./ssl/private")
        
        # Check if self-signed certificates were generated (if OpenSSL is available)
        $opensslAvailable = Get-Command openssl -ErrorAction SilentlyContinue
        if ($opensslAvailable) {
            $testResults.SelfSignedGeneration = (Test-Path "./ssl/certs/ellie.crt") -and (Test-Path "./ssl/private/ellie.key")
        } else {
            Write-Host "OpenSSL not available, skipping certificate generation test" -ForegroundColor Yellow
            $testResults.SelfSignedGeneration = $null
        }
        
        Write-Host "SSL setup script executed successfully" -ForegroundColor Green
        
    } catch {
        Write-Host "SSL setup script test failed: $_" -ForegroundColor Red
        $testResults.DirectoryCreation = $false
        $testResults.SelfSignedGeneration = $false
    }
    
    # Test bash SSL setup script (if WSL is available)
    Write-Host "Testing bash SSL setup script..." -ForegroundColor Yellow
    try {
        $wslAvailable = Get-Command wsl -ErrorAction SilentlyContinue
        if ($wslAvailable) {
            wsl bash ./docker/ssl-setup.sh test.local --self-signed
            $testResults.BashScript = $true
            Write-Host "Bash SSL setup script executed successfully" -ForegroundColor Green
        } else {
            Write-Host "WSL not available, skipping bash script test" -ForegroundColor Yellow
            $testResults.BashScript = $null
        }
    } catch {
        Write-Host "Bash SSL setup script test failed: $_" -ForegroundColor Red
        $testResults.BashScript = $false
    }
    
    return $testResults
}

# Main execution
try {
    # Check if Docker is running
    if (-not (Test-DockerRunning)) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        Write-Host "   You can start Docker Desktop from the Start menu or by running 'Docker Desktop' application." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Docker is running" -ForegroundColor Green
    Write-Host ""
    
    # Test development environment
    $devResults = Test-DevelopmentEnvironment
    
    Write-Host ""
    
    # Test production environment
    $prodResults = Test-ProductionEnvironment
    
    Write-Host ""
    
    # Test SSL certificate generation if requested
    $sslResults = @{}
    if ($TestSSL) {
        $sslResults = Test-SSLCertificateGeneration
    } else {
        Write-Host "Skipping SSL certificate generation tests (use -TestSSL to include)" -ForegroundColor Gray
    }
    
    # Summary report
    Write-Host "=== DEPLOYMENT VERIFICATION SUMMARY ===" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Development Environment:" -ForegroundColor Cyan
    Write-Host "  Frontend:    $(if ($devResults.Frontend) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
    Write-Host "  Backend:     $(if ($devResults.Backend) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
    Write-Host "  Nginx:       $(if ($devResults.Nginx) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
    Write-Host "  Redis:       $(if ($devResults.Redis) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Production Environment:" -ForegroundColor Cyan
    Write-Host "  Nginx:       $(if ($prodResults.Nginx) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
    Write-Host "  Monitoring:  $(if ($prodResults.Monitoring) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
    Write-Host "  Redis:       $(if ($prodResults.Redis) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
    
    if ($TestSSL) {
        Write-Host ""
        Write-Host "SSL Certificate Generation:" -ForegroundColor Cyan
        Write-Host "  Directory Creation: $(if ($sslResults.DirectoryCreation) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
        if ($sslResults.SelfSignedGeneration -ne $null) {
            Write-Host "  Self-Signed Certs:  $(if ($sslResults.SelfSignedGeneration) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
        }
        if ($sslResults.BashScript -ne $null) {
            Write-Host "  Bash Script:        $(if ($sslResults.BashScript) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor White
        }
    }
    
    # Overall result
    $allDevPassed = $devResults.Frontend -and $devResults.Backend -and $devResults.Nginx -and $devResults.Redis
    $allProdPassed = $prodResults.Nginx -and $prodResults.Monitoring -and $prodResults.Redis
    $allSSLPassed = if ($TestSSL) { $sslResults.DirectoryCreation } else { $true }
    
    Write-Host ""
    if ($allDevPassed -and $allProdPassed -and $allSSLPassed) {
        Write-Host "🎉 ALL DEPLOYMENT TESTS PASSED!" -ForegroundColor Green
        Write-Host "Requirements 4.1, 4.2, 4.3, 4.4 are verified successfully." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ SOME DEPLOYMENT TESTS FAILED" -ForegroundColor Red
        Write-Host "Please review the failed components and fix any issues." -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "❌ Deployment verification failed with error: $_" -ForegroundColor Red
    exit 1
}