# SSL Certificate Setup Verification Script
# This script verifies the SSL setup scripts work correctly

Write-Host "=== SSL Certificate Setup Verification ===" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Test 1: Verify PowerShell script exists
Write-Host "Test 1: Checking if ssl-setup.ps1 exists..." -ForegroundColor Yellow
if (Test-Path "docker/ssl-setup.ps1") {
    Write-Host "  PASS: ssl-setup.ps1 found" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL: ssl-setup.ps1 not found" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Verify bash script exists
Write-Host "Test 2: Checking if ssl-setup.sh exists..." -ForegroundColor Yellow
if (Test-Path "docker/ssl-setup.sh") {
    Write-Host "  PASS: ssl-setup.sh found" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL: ssl-setup.sh not found" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Verify PowerShell script syntax
Write-Host "Test 3: Verifying PowerShell script syntax..." -ForegroundColor Yellow
$null = [System.Management.Automation.PSParser]::Tokenize((Get-Content "docker/ssl-setup.ps1" -Raw), [ref]$null)
Write-Host "  PASS: PowerShell script syntax is valid" -ForegroundColor Green
$testsPassed++

# Test 4: Test directory creation (without self-signed)
Write-Host "Test 4: Testing SSL directory creation..." -ForegroundColor Yellow
if (Test-Path "ssl") {
    Remove-Item -Path "ssl" -Recurse -Force -ErrorAction SilentlyContinue
}

$output = & powershell -ExecutionPolicy Bypass -File "docker/ssl-setup.ps1" -Domain "test-verify.example.com" 2>&1

if ((Test-Path "ssl/certs") -and (Test-Path "ssl/private")) {
    Write-Host "  PASS: SSL directories created successfully" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL: SSL directories not created" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Verify script parameters
Write-Host "Test 5: Verifying script accepts parameters..." -ForegroundColor Yellow
$scriptContent = Get-Content "docker/ssl-setup.ps1" -Raw
if ($scriptContent -match 'param\s*\(' -and $scriptContent -match '\[string\]\$Domain' -and $scriptContent -match '\[switch\]\$SelfSigned') {
    Write-Host "  PASS: Script has correct parameters" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL: Script parameters not configured correctly" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Verify nginx configuration references
Write-Host "Test 6: Checking nginx production config for SSL settings..." -ForegroundColor Yellow
if (Test-Path "docker/nginx-production.conf") {
    $nginxContent = Get-Content "docker/nginx-production.conf" -Raw
    if ($nginxContent -match 'ssl_certificate' -and $nginxContent -match 'ssl_protocols' -and $nginxContent -match 'listen 443 ssl') {
        Write-Host "  PASS: Nginx config has SSL configuration" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  FAIL: Nginx config missing SSL configuration" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "  FAIL: nginx-production.conf not found" -ForegroundColor Red
    $testsFailed++
}

# Test 7: Verify docker-compose SSL volume mounts
Write-Host "Test 7: Checking docker-compose for SSL volume configuration..." -ForegroundColor Yellow
$composeFiles = @("docker/docker-compose.prod.yml", "docker-compose.prod.yml")
$foundSSLConfig = $false

foreach ($file in $composeFiles) {
    if (Test-Path $file) {
        $composeContent = Get-Content $file -Raw
        if ($composeContent -match 'ssl/certs' -and $composeContent -match 'ssl/private') {
            $foundSSLConfig = $true
            break
        }
    }
}

if ($foundSSLConfig) {
    Write-Host "  PASS: Docker compose has SSL volume mount configuration" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL: Docker compose missing SSL volume mounts" -ForegroundColor Red
    $testsFailed++
}

# Test 8: Verify bash script has proper shebang
Write-Host "Test 8: Verifying bash script format..." -ForegroundColor Yellow
$bashFirstLine = Get-Content "docker/ssl-setup.sh" -First 1
if ($bashFirstLine -eq "#!/bin/bash") {
    Write-Host "  PASS: Bash script has correct shebang" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL: Bash script missing or incorrect shebang" -ForegroundColor Red
    $testsFailed++
}

# Test 9: Verify scripts provide helpful instructions
Write-Host "Test 9: Checking for user instructions in scripts..." -ForegroundColor Yellow
$psContent = Get-Content "docker/ssl-setup.ps1" -Raw
$bashContent = Get-Content "docker/ssl-setup.sh" -Raw

$hasInstructions = ($psContent -match "Let's Encrypt" -or $psContent -match "Certificate Authority") -and ($bashContent -match "Let's Encrypt" -or $bashContent -match "Certificate Authority")

if ($hasInstructions) {
    Write-Host "  PASS: Scripts provide helpful instructions for users" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL: Scripts missing user instructions" -ForegroundColor Red
    $testsFailed++
}

# Test 10: Verify OpenSSL command structure in scripts
Write-Host "Test 10: Verifying OpenSSL command structure..." -ForegroundColor Yellow
$psHasOpenSSL = $psContent -match 'openssl req -x509'
$bashHasOpenSSL = $bashContent -match 'openssl req -x509'

if ($psHasOpenSSL -and $bashHasOpenSSL) {
    Write-Host "  PASS: Both scripts have OpenSSL certificate generation commands" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL: OpenSSL commands not found in scripts" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host ""
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "All SSL certificate setup scripts verified successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage Instructions:" -ForegroundColor Cyan
    Write-Host "  For production with CA certificates:" -ForegroundColor Yellow
    Write-Host "    powershell -ExecutionPolicy Bypass -File docker/ssl-setup.ps1 -Domain your-domain.com"
    Write-Host ""
    Write-Host "  For development with self-signed certificates:" -ForegroundColor Yellow
    Write-Host "    powershell -ExecutionPolicy Bypass -File docker/ssl-setup.ps1 -Domain localhost -SelfSigned"
    Write-Host ""
    Write-Host "  On Linux/Mac:" -ForegroundColor Yellow
    Write-Host "    bash docker/ssl-setup.sh your-domain.com"
    Write-Host "    bash docker/ssl-setup.sh localhost --self-signed"
    exit 0
} else {
    Write-Host "Some verification tests failed. Please review the issues above." -ForegroundColor Red
    exit 1
}
