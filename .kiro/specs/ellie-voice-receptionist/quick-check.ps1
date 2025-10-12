# Quick Voice Demo Check
# Simple script to verify the demo is accessible

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Ellie Voice Demo - Quick Check" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Frontend
Write-Host "Checking Frontend (http://localhost:3000)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

# Check Backend
Write-Host "Checking Backend (http://localhost:5000/health)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

if ($allGood) {
    Write-Host "All systems are GO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Open your browser" -ForegroundColor White
    Write-Host "2. Navigate to: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "3. Click 'Try Voice Demo'" -ForegroundColor White
    Write-Host "4. Follow the testing guide:" -ForegroundColor White
    Write-Host "   .kiro/specs/ellie-voice-receptionist/VOICE_DEMO_EXECUTION_GUIDE.md" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: API keys are using test values." -ForegroundColor Yellow
    Write-Host "Voice features may show mock responses or errors." -ForegroundColor Yellow
    Write-Host "To test with real APIs, configure valid keys in backend/.env" -ForegroundColor Yellow
} else {
    Write-Host "Some services are not accessible!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start the services:" -ForegroundColor Yellow
    Write-Host "  cd docker" -ForegroundColor Gray
    Write-Host "  docker-compose up --build" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
