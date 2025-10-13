# Monitoring Endpoints Integration Test Script
# This script tests all monitoring endpoints against a running backend instance

param(
    [string]$BaseUrl = "http://localhost:5000",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$testResults = @()
$passCount = 0
$failCount = 0

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Description,
        [hashtable]$Body = $null
    )
    
    $url = "$BaseUrl$Path"
    Write-Host "`nTesting: $Description" -ForegroundColor Cyan
    Write-Host "  $Method $url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        
        if ($response.StatusCode -in @(200, 503)) {
            Write-Host "  ✓ PASS - Status: $($response.StatusCode)" -ForegroundColor Green
            $script:passCount++
            $script:testResults += [PSCustomObject]@{
                Test = $Description
                Status = "PASS"
                StatusCode = $response.StatusCode
                ContentLength = $response.Content.Length
            }
            
            if ($Verbose) {
                Write-Host "  Response Length: $($response.Content.Length) bytes" -ForegroundColor Gray
            }
            
            return $true
        } else {
            Write-Host "  ✗ FAIL - Unexpected status: $($response.StatusCode)" -ForegroundColor Red
            $script:failCount++
            $script:testResults += [PSCustomObject]@{
                Test = $Description
                Status = "FAIL"
                StatusCode = $response.StatusCode
                Error = "Unexpected status code"
            }
            return $false
        }
    }
    catch {
        Write-Host "  ✗ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failCount++
        $script:testResults += [PSCustomObject]@{
            Test = $Description
            Status = "FAIL"
            StatusCode = "N/A"
            Error = $_.Exception.Message
        }
        return $false
    }
}

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Monitoring Endpoints Integration Tests" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Core Health and Metrics Endpoints
Write-Host "`n=== Core Health and Metrics ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Path "/health" -Description "Health Check Endpoint"
Test-Endpoint -Method "GET" -Path "/metrics" -Description "Prometheus Metrics Endpoint"

# Service Discovery Endpoints
Write-Host "`n=== Service Discovery ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Path "/services" -Description "List All Services"
Test-Endpoint -Method "GET" -Path "/services/health" -Description "System Health Status"
Test-Endpoint -Method "GET" -Path "/services/stats" -Description "Service Statistics"

# Monitoring API Endpoints
Write-Host "`n=== Monitoring API ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Path "/api/monitoring/logs" -Description "Recent Logs"
Test-Endpoint -Method "GET" -Path "/api/monitoring/logs?count=50" -Description "Recent Logs with Count"
Test-Endpoint -Method "GET" -Path "/api/monitoring/logs?level=error" -Description "Error Logs Only"
Test-Endpoint -Method "GET" -Path "/api/monitoring/errors" -Description "Error Statistics"
Test-Endpoint -Method "GET" -Path "/api/monitoring/errors?window=7200000" -Description "Error Statistics (2h window)"
Test-Endpoint -Method "GET" -Path "/api/monitoring/fallbacks" -Description "Fallback Statistics"

# Cache Management Endpoints
Write-Host "`n=== Cache Management ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Path "/api/cache/stats" -Description "Cache Statistics"
Test-Endpoint -Method "POST" -Path "/api/cache/clear" -Description "Clear Cache"
Test-Endpoint -Method "DELETE" -Path "/api/cache/invalidate/test-pattern" -Description "Invalidate Cache Pattern"

# CDN Management Endpoints
Write-Host "`n=== CDN Management ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Path "/api/cdn/config" -Description "CDN Configuration"
Test-Endpoint -Method "GET" -Path "/api/cdn/stats" -Description "CDN Statistics"
Test-Endpoint -Method "POST" -Path "/api/cdn/purge" -Description "Purge CDN Cache" -Body @{ paths = @("/test/path") }

# Analytics Endpoints
Write-Host "`n=== Analytics ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Path "/api/analytics/usage" -Description "Usage Metrics"
Test-Endpoint -Method "GET" -Path "/api/analytics/usage?timeWindow=7200000" -Description "Usage Metrics (2h window)"
Test-Endpoint -Method "GET" -Path "/api/analytics/performance" -Description "Performance Metrics"
Test-Endpoint -Method "GET" -Path "/api/analytics/business" -Description "Business Metrics"
Test-Endpoint -Method "GET" -Path "/api/analytics/dashboard" -Description "Dashboard Data"
Test-Endpoint -Method "GET" -Path "/api/analytics/export?format=json" -Description "Export Analytics (JSON)"

# APM Endpoints
Write-Host "`n=== Application Performance Monitoring ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Path "/api/apm/metrics" -Description "APM Metrics"
Test-Endpoint -Method "GET" -Path "/api/apm/metrics?timeWindow=7200000" -Description "APM Metrics (2h window)"
Test-Endpoint -Method "GET" -Path "/api/apm/active" -Description "Active Operations"

# Advanced Logging Endpoints
Write-Host "`n=== Advanced Logging ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Path "/api/logs/metrics" -Description "Log Metrics"
Test-Endpoint -Method "GET" -Path "/api/logs/metrics?timeWindow=7200000" -Description "Log Metrics (2h window)"
Test-Endpoint -Method "GET" -Path "/api/logs/search?level=error&limit=50" -Description "Search Logs"
Test-Endpoint -Method "GET" -Path "/api/logs/aggregations" -Description "Log Aggregations"
Test-Endpoint -Method "GET" -Path "/api/logs/aggregations?timeWindow=1h&service=api" -Description "Log Aggregations (filtered)"
Test-Endpoint -Method "GET" -Path "/api/logs/alerts" -Description "Active Alerts"
Test-Endpoint -Method "GET" -Path "/api/logs/export?format=json" -Description "Export Logs (JSON)"

# Summary
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Test Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Total Tests: $($passCount + $failCount)" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "Success Rate: $([math]::Round(($passCount / ($passCount + $failCount)) * 100, 2))%" -ForegroundColor White

if ($Verbose) {
    Write-Host "`n=== Detailed Results ===" -ForegroundColor Magenta
    $testResults | Format-Table -AutoSize
}

# Exit with appropriate code
if ($failCount -eq 0) {
    Write-Host "`n✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed. Check the output above for details." -ForegroundColor Red
    exit 1
}
