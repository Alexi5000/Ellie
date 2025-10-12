# Voice Demo Verification Script
# This script verifies that all services are running and the voice demo is accessible

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ellie Voice Demo Verification Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing $Name..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " PASS" -ForegroundColor Green
            Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
            return $true
        }
        else {
            Write-Host " FAIL" -ForegroundColor Red
            Write-Host "  Expected: $ExpectedStatus, Got: $($response.StatusCode)" -ForegroundColor Red
            $script:ErrorCount++
            return $false
        }
    }
    catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
}

# Function to check Docker container
function Test-DockerContainer {
    param(
        [string]$ContainerName,
        [string]$ServiceName
    )
    
    Write-Host "Checking Docker container: $ServiceName..." -NoNewline
    
    $container = docker ps --filter "name=$ContainerName" --format "{{.Names}}`t{{.Status}}" 2>$null
    
    if ($container) {
        if ($container -match "Up") {
            Write-Host " RUNNING" -ForegroundColor Green
            Write-Host "  $container" -ForegroundColor Gray
            return $true
        }
        else {
            Write-Host " WARNING" -ForegroundColor Yellow
            Write-Host "  Container exists but not running: $container" -ForegroundColor Yellow
            $script:WarningCount++
            return $false
        }
    }
    else {
        Write-Host " NOT FOUND" -ForegroundColor Red
        Write-Host "  Container '$ContainerName' not found" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
}

# Function to check if port is listening
function Test-Port {
    param(
        [string]$HostName = "localhost",
        [int]$Port,
        [string]$ServiceName
    )
    
    Write-Host "Checking port $Port ($ServiceName)..." -NoNewline
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($HostName, $Port)
        $tcpClient.Close()
        Write-Host " OPEN" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " CLOSED" -ForegroundColor Red
        Write-Host "  Port $Port is not accessible" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
}

Write-Host "Step 1: Checking Docker Installation" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Yellow

$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host "Docker installed: $dockerVersion" -ForegroundColor Green
}
else {
    Write-Host "Docker not found. Please install Docker Desktop." -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""
Write-Host "Step 2: Checking Docker Containers" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

Test-DockerContainer -ContainerName "frontend" -ServiceName "Frontend (React)"
Test-DockerContainer -ContainerName "backend" -ServiceName "Backend (Node.js)"
Test-DockerContainer -ContainerName "redis" -ServiceName "Redis Cache"
Test-DockerContainer -ContainerName "nginx" -ServiceName "Nginx Proxy"

Write-Host ""
Write-Host "Step 3: Checking Network Ports" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

Test-Port -Port 3000 -ServiceName "Frontend"
Test-Port -Port 5000 -ServiceName "Backend API"
Test-Port -Port 6380 -ServiceName "Redis"
Test-Port -Port 80 -ServiceName "Nginx"

Write-Host ""
Write-Host "Step 4: Testing HTTP Endpoints" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

$frontendOk = Test-Endpoint -Url "http://localhost:3000" -Name "Frontend Landing Page"
$backendHealthOk = Test-Endpoint -Url "http://localhost:5000/health" -Name "Backend Health Check"
$nginxOk = Test-Endpoint -Url "http://localhost:80" -Name "Nginx Proxy"

Write-Host ""
Write-Host "Step 5: Checking Backend API Endpoints" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Yellow

Test-Endpoint -Url "http://localhost:5000/api/health" -Name "API Health Endpoint"
Test-Endpoint -Url "http://localhost:5000/services" -Name "Service Discovery"

Write-Host ""
Write-Host "Step 6: Checking Environment Configuration" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

$envFile = "backend\.env"
if (Test-Path $envFile) {
    Write-Host "Backend .env file exists: PASS" -ForegroundColor Green
    
    $envContent = Get-Content $envFile -Raw
    
    # Check for API keys
    if ($envContent -match "OPENAI_API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
        if ($apiKey -and $apiKey -ne "your_openai_api_key_here" -and $apiKey -ne "test_key_for_integration_tests") {
            Write-Host "  OpenAI API Key: Configured" -ForegroundColor Green
        }
        else {
            Write-Host "  OpenAI API Key: Not configured or using test key" -ForegroundColor Yellow
            Write-Host "    Voice features may not work without valid API key" -ForegroundColor Yellow
            $WarningCount++
        }
    }
    
    if ($envContent -match "GROQ_API_KEY=(.+)") {
        $groqKey = $matches[1].Trim()
        if ($groqKey -and $groqKey -ne "your_groq_api_key_here" -and $groqKey -ne "test_key_for_integration_tests") {
            Write-Host "  Groq API Key: Configured" -ForegroundColor Green
        }
        else {
            Write-Host "  Groq API Key: Not configured or using test key" -ForegroundColor Yellow
            Write-Host "    AI responses may not work without valid API key" -ForegroundColor Yellow
            $WarningCount++
        }
    }
}
else {
    Write-Host "Backend .env file not found: FAIL" -ForegroundColor Red
    Write-Host "  Please copy .env.example to .env and configure API keys" -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""
Write-Host "Step 7: Browser Compatibility Check" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

Write-Host "Recommended browsers for testing:" -ForegroundColor Gray
Write-Host "  - Chrome (latest) - Full support" -ForegroundColor Gray
Write-Host "  - Firefox (latest) - Full support" -ForegroundColor Gray
Write-Host "  - Edge (latest) - Full support" -ForegroundColor Gray
Write-Host "  - Safari (latest) - Full support" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Open your browser and navigate to: http://localhost:3000" -ForegroundColor White
    Write-Host "2. Click the 'Try Voice Demo' button" -ForegroundColor White
    Write-Host "3. Accept the legal disclaimer" -ForegroundColor White
    Write-Host "4. Grant microphone permissions when prompted" -ForegroundColor White
    Write-Host "5. Click the microphone button and speak to Ellie" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed testing instructions, see:" -ForegroundColor Yellow
    Write-Host "  .kiro/specs/ellie-voice-receptionist/VOICE_DEMO_TEST_PLAN.md" -ForegroundColor White
}
elseif ($ErrorCount -eq 0) {
    Write-Host "Verification completed with $WarningCount warning(s)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can proceed with testing, but some features may not work correctly." -ForegroundColor Yellow
    Write-Host "Review the warnings above and configure missing API keys if needed." -ForegroundColor Yellow
}
else {
    Write-Host "Verification failed with $ErrorCount error(s) and $WarningCount warning(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors above before testing the voice demo." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Start Docker containers:" -ForegroundColor White
    Write-Host "   cd docker" -ForegroundColor Gray
    Write-Host "   docker-compose up --build" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Configure API keys in backend/.env" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Ensure Docker Desktop is running" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Exit with error code if there are errors
if ($ErrorCount -gt 0) {
    exit 1
}
else {
    exit 0
}
