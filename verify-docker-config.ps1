# Docker Configuration Verification Script
# Verifies Docker configuration files and setup without requiring Docker to be running

Write-Host "=== Docker Configuration Verification ===" -ForegroundColor Green
Write-Host "Verifying deployment configuration for task 11" -ForegroundColor Yellow
Write-Host ""

$errors = @()
$warnings = @()

# Function to check file exists
function Test-FileExists {
    param([string]$Path, [string]$Description)
    if (Test-Path $Path) {
        Write-Host "✅ $Description exists: $Path" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description missing: $Path" -ForegroundColor Red
        $script:errors += "$Description missing: $Path"
        return $false
    }
}

# Function to check file content
function Test-FileContent {
    param([string]$Path, [string]$Pattern, [string]$Description)
    if (Test-Path $Path) {
        $content = Get-Content $Path -Raw
        if ($content -match $Pattern) {
            Write-Host "✅ $Description found in $Path" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  $Description not found in $Path" -ForegroundColor Yellow
            $script:warnings += "$Description not found in $Path"
            return $false
        }
    } else {
        Write-Host "❌ Cannot check $Description - file missing: $Path" -ForegroundColor Red
        $script:errors += "Cannot check $Description - file missing: $Path"
        return $false
    }
}

Write-Host "=== Checking Docker Compose Files ===" -ForegroundColor Cyan

# Check docker-compose.yml (development)
Test-FileExists "docker-compose.yml" "Development Docker Compose"
Test-FileContent "docker-compose.yml" "frontend:" "Frontend service definition"
Test-FileContent "docker-compose.yml" "backend:" "Backend service definition"
Test-FileContent "docker-compose.yml" "redis:" "Redis service definition"
Test-FileContent "docker-compose.yml" "nginx:" "Nginx service definition"
Test-FileContent "docker-compose.yml" "target: development" "Development build target"

# Check docker-compose.prod.yml (production)
Test-FileExists "docker-compose.prod.yml" "Production Docker Compose"
Test-FileContent "docker-compose.prod.yml" "target: production" "Production build target"
Test-FileContent "docker-compose.prod.yml" "healthcheck:" "Health check configuration"
Test-FileContent "docker-compose.prod.yml" "restart: unless-stopped" "Restart policy"
Test-FileContent "docker-compose.prod.yml" "monitoring:" "Monitoring service"

Write-Host ""
Write-Host "=== Checking Dockerfile Configurations ===" -ForegroundColor Cyan

# Check frontend Dockerfile
Test-FileExists "frontend/Dockerfile" "Frontend Dockerfile"
Test-FileContent "frontend/Dockerfile" "FROM node:18-alpine as development" "Frontend development stage"
Test-FileContent "frontend/Dockerfile" "FROM node:18-alpine as production" "Frontend production stage"
Test-FileContent "frontend/Dockerfile" "HEALTHCHECK" "Frontend health check"

# Check backend Dockerfile
Test-FileExists "backend/Dockerfile" "Backend Dockerfile"
Test-FileContent "backend/Dockerfile" "FROM node:18-alpine as development" "Backend development stage"
Test-FileContent "backend/Dockerfile" "FROM node:18-alpine as production" "Backend production stage"
Test-FileContent "backend/Dockerfile" "HEALTHCHECK" "Backend health check"

Write-Host ""
Write-Host "=== Checking Environment Configuration ===" -ForegroundColor Cyan

# Check environment files
Test-FileExists "backend/.env" "Development environment file"
Test-FileExists "backend/.env.example" "Environment example file"
Test-FileExists "backend/.env.production" "Production environment file"

# Check environment variables
Test-FileContent "backend/.env" "OPENAI_API_KEY" "OpenAI API key configuration"
Test-FileContent "backend/.env" "GROQ_API_KEY" "Groq API key configuration"
Test-FileContent "backend/.env" "REDIS_URL" "Redis URL configuration"
Test-FileContent "backend/.env.production" "NODE_ENV=production" "Production environment setting"

Write-Host ""
Write-Host "=== Checking SSL Certificate Scripts ===" -ForegroundColor Cyan

# Check SSL setup scripts
Test-FileExists "docker/ssl-setup.ps1" "PowerShell SSL setup script"
Test-FileExists "docker/ssl-setup.sh" "Bash SSL setup script"

# Check SSL script functionality
Test-FileContent "docker/ssl-setup.ps1" "New-Item -ItemType Directory" "SSL directory creation"
Test-FileContent "docker/ssl-setup.ps1" "openssl req -x509" "Self-signed certificate generation"
Test-FileContent "docker/ssl-setup.sh" "mkdir -p" "SSL directory creation (bash)"
Test-FileContent "docker/ssl-setup.sh" "openssl req -x509" "Self-signed certificate generation (bash)"

Write-Host ""
Write-Host "=== Checking Nginx Configuration ===" -ForegroundColor Cyan

# Check nginx configuration files
Test-FileExists "docker/nginx.conf" "Development Nginx configuration"
Test-FileExists "docker/nginx-production.conf" "Production Nginx configuration"
Test-FileExists "docker/server-common.conf" "Common server configuration"

Write-Host ""
Write-Host "=== Checking Package Configurations ===" -ForegroundColor Cyan

# Check package.json files
Test-FileExists "frontend/package.json" "Frontend package.json"
Test-FileExists "backend/package.json" "Backend package.json"

# Check for required scripts
Test-FileContent "frontend/package.json" '"build":' "Frontend build script"
Test-FileContent "frontend/package.json" '"dev":' "Frontend dev script"
Test-FileContent "backend/package.json" '"build":' "Backend build script"
Test-FileContent "backend/package.json" '"dev":' "Backend dev script"
Test-FileContent "backend/package.json" '"start":' "Backend start script"

Write-Host ""
Write-Host "=== Checking Health Check Files ===" -ForegroundColor Cyan

# Check health check files
Test-FileExists "backend/healthcheck.js" "Backend health check script"

Write-Host ""
Write-Host "=== Docker Installation Check ===" -ForegroundColor Cyan

# Check if Docker is installed
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker installed: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker not found in PATH" -ForegroundColor Red
        $errors += "Docker not found in PATH"
    }
} catch {
    Write-Host "❌ Docker not installed or not accessible" -ForegroundColor Red
    $errors += "Docker not installed or not accessible"
}

# Check if Docker Compose is available
try {
    $composeVersion = docker-compose --version 2>$null
    if ($composeVersion) {
        Write-Host "✅ Docker Compose installed: $composeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Compose not found" -ForegroundColor Red
        $errors += "Docker Compose not found"
    }
} catch {
    Write-Host "❌ Docker Compose not installed or not accessible" -ForegroundColor Red
    $errors += "Docker Compose not installed or not accessible"
}

# Check if Docker daemon is running
try {
    docker ps 2>$null | Out-Null
    Write-Host "✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker daemon is not running (this is OK for configuration verification)" -ForegroundColor Yellow
    $warnings += "Docker daemon is not running"
}

Write-Host ""
Write-Host "=== VERIFICATION SUMMARY ===" -ForegroundColor Green

if ($errors.Count -eq 0) {
    Write-Host "🎉 All Docker configuration checks passed!" -ForegroundColor Green
    Write-Host "The deployment configuration is ready for testing." -ForegroundColor Green
    
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  ⚠️  $warning" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start Docker Desktop if not running" -ForegroundColor White
    Write-Host "2. Run: .\docker-deployment-test.ps1 -TestSSL" -ForegroundColor White
    Write-Host "3. Or manually test with:" -ForegroundColor White
    Write-Host "   - docker-compose up --build" -ForegroundColor Gray
    Write-Host "   - docker-compose -f docker-compose.prod.yml up --build" -ForegroundColor Gray
    
} else {
    Write-Host "❌ Configuration verification failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Errors found:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  ❌ $error" -ForegroundColor Red
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  ⚠️  $warning" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Please fix the errors above before proceeding with deployment testing." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configuration verification complete." -ForegroundColor Green