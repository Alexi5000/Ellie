# Test Environment Setup Script for Windows
# This script sets up environment variables for testing in CI/CD pipelines

param(
    [switch]$CI = $false
)

Write-Host "Setting up test environment..." -ForegroundColor Green

function Create-BackendTestEnv {
    if (-not (Test-Path "backend\.env.test")) {
        Write-Host "Creating backend\.env.test..." -ForegroundColor Yellow
        Copy-Item "backend\.env.example" "backend\.env.test"
        
        # Override with test-specific values
        $content = Get-Content "backend\.env.test"
        $content = $content -replace "NODE_ENV=development", "NODE_ENV=test"
        $content = $content -replace "PORT=5000", "PORT=0"
        $content = $content -replace "your_openai_api_key_here", "test_openai_api_key_mock"
        $content = $content -replace "your_groq_api_key_here", "test_groq_api_key_mock"
        $content = $content -replace "LOG_LEVEL=info", "LOG_LEVEL=error"
        $content = $content -replace "REDIS_DB=0", "REDIS_DB=1"
        Set-Content "backend\.env.test" $content
    }
}

function Create-FrontendTestEnv {
    if (-not (Test-Path "frontend\.env.test")) {
        Write-Host "Creating frontend\.env.test..." -ForegroundColor Yellow
        Copy-Item "frontend\.env.example" "frontend\.env.test"
        
        # Add test-specific values
        Add-Content "frontend\.env.test" ""
        Add-Content "frontend\.env.test" "# Test-specific Configuration"
        Add-Content "frontend\.env.test" "VITE_TEST_MODE=true"
        Add-Content "frontend\.env.test" "VITE_MOCK_AUDIO=true"
        Add-Content "frontend\.env.test" "VITE_SKIP_PERMISSIONS=true"
        Add-Content "frontend\.env.test" "VITE_PWA_ENABLED=false"
    }
}

function Setup-CIEnvVars {
    Write-Host "Setting up CI/CD environment variables..." -ForegroundColor Yellow
    
    # Set environment variables
    $env:NODE_ENV = "test"
    if (-not $env:OPENAI_API_KEY) {
        $env:OPENAI_API_KEY = "test_openai_api_key_mock"
    }
    if (-not $env:GROQ_API_KEY) {
        $env:GROQ_API_KEY = "test_groq_api_key_mock"
    }
    
    if ($CI -or $env:CI -eq "true") {
        Write-Host "Running in CI environment, creating test configuration..." -ForegroundColor Cyan
        
        # Backend CI environment
        $backendEnv = @"
NODE_ENV=test
PORT=0
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=test_openai_api_key_mock
GROQ_API_KEY=test_groq_api_key_mock
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
MAX_AUDIO_FILE_SIZE=10485760
ALLOWED_AUDIO_FORMATS=audio/wav,audio/mp3,audio/m4a,audio/webm
SESSION_TIMEOUT_MS=1800000
LOG_LEVEL=error
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=1
CDN_ENABLED=false
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ellie_test_db
DB_USER=postgres
DB_PASSWORD=
DB_SSL=false
DB_POOL_SIZE=5
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=60000
"@
        Set-Content "backend\.env.test" $backendEnv
        
        # Frontend CI environment
        $frontendEnv = @"
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
VITE_APP_NAME=Ellie Voice Receptionist (Test)
VITE_APP_VERSION=1.0.0-test
VITE_MAX_RECORDING_TIME=30000
VITE_AUDIO_SAMPLE_RATE=16000
VITE_PWA_ENABLED=false
VITE_TEST_MODE=true
VITE_MOCK_AUDIO=true
VITE_SKIP_PERMISSIONS=true
"@
        Set-Content "frontend\.env.test" $frontendEnv
    }
}

function Test-Environment {
    Write-Host "Validating test environment..." -ForegroundColor Yellow
    
    # Check required files exist
    if (-not (Test-Path "backend\.env.test")) {
        Write-Error "backend\.env.test not found"
        exit 1
    }
    
    if (-not (Test-Path "frontend\.env.test")) {
        Write-Error "frontend\.env.test not found"
        exit 1
    }
    
    # Check required environment variables
    if (-not $env:OPENAI_API_KEY) {
        Write-Warning "OPENAI_API_KEY not set, using mock value"
    }
    
    if (-not $env:GROQ_API_KEY) {
        Write-Warning "GROQ_API_KEY not set, using mock value"
    }
    
    Write-Host "Test environment validation completed" -ForegroundColor Green
}

# Main execution
try {
    Write-Host "Starting test environment setup..." -ForegroundColor Cyan
    
    Create-BackendTestEnv
    Create-FrontendTestEnv
    Setup-CIEnvVars
    Test-Environment
    
    Write-Host "Test environment setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Environment files created:" -ForegroundColor Cyan
    Write-Host "  - backend\.env.test" -ForegroundColor White
    Write-Host "  - frontend\.env.test" -ForegroundColor White
    Write-Host ""
    Write-Host "To run tests:" -ForegroundColor Cyan
    Write-Host "  npm test                    # Run all tests" -ForegroundColor White
    Write-Host "  npm run test:integration    # Run integration tests" -ForegroundColor White
    Write-Host "  npm run test:production     # Run production tests" -ForegroundColor White
}
catch {
    Write-Error "Failed to set up test environment: $_"
    exit 1
}