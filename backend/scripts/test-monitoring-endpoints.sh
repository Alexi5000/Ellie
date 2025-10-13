#!/bin/bash

# Monitoring Endpoints Integration Test Script
# This script tests all monitoring endpoints against a running backend instance

BASE_URL="${1:-http://localhost:5000}"
VERBOSE="${2:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

test_endpoint() {
    local method=$1
    local path=$2
    local description=$3
    local body=$4
    
    local url="${BASE_URL}${path}"
    
    echo -e "\n${CYAN}Testing: ${description}${NC}"
    echo -e "  ${GRAY}${method} ${url}${NC}"
    
    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$body" \
            --max-time 10 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            --max-time 10 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    content=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "200" ] || [ "$status_code" = "503" ]; then
        echo -e "  ${GREEN}✓ PASS - Status: ${status_code}${NC}"
        ((pass_count++))
        
        if [ "$VERBOSE" = "true" ]; then
            content_length=${#content}
            echo -e "  ${GRAY}Response Length: ${content_length} bytes${NC}"
        fi
    else
        echo -e "  ${RED}✗ FAIL - Status: ${status_code}${NC}"
        ((fail_count++))
    fi
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Monitoring Endpoints Integration Tests${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Base URL: ${BASE_URL}${NC}"
echo ""

# Core Health and Metrics Endpoints
echo -e "\n${MAGENTA}=== Core Health and Metrics ===${NC}"
test_endpoint "GET" "/health" "Health Check Endpoint"
test_endpoint "GET" "/metrics" "Prometheus Metrics Endpoint"

# Service Discovery Endpoints
echo -e "\n${MAGENTA}=== Service Discovery ===${NC}"
test_endpoint "GET" "/services" "List All Services"
test_endpoint "GET" "/services/health" "System Health Status"
test_endpoint "GET" "/services/stats" "Service Statistics"

# Monitoring API Endpoints
echo -e "\n${MAGENTA}=== Monitoring API ===${NC}"
test_endpoint "GET" "/api/monitoring/logs" "Recent Logs"
test_endpoint "GET" "/api/monitoring/logs?count=50" "Recent Logs with Count"
test_endpoint "GET" "/api/monitoring/logs?level=error" "Error Logs Only"
test_endpoint "GET" "/api/monitoring/errors" "Error Statistics"
test_endpoint "GET" "/api/monitoring/errors?window=7200000" "Error Statistics (2h window)"
test_endpoint "GET" "/api/monitoring/fallbacks" "Fallback Statistics"

# Cache Management Endpoints
echo -e "\n${MAGENTA}=== Cache Management ===${NC}"
test_endpoint "GET" "/api/cache/stats" "Cache Statistics"
test_endpoint "POST" "/api/cache/clear" "Clear Cache"
test_endpoint "DELETE" "/api/cache/invalidate/test-pattern" "Invalidate Cache Pattern"

# CDN Management Endpoints
echo -e "\n${MAGENTA}=== CDN Management ===${NC}"
test_endpoint "GET" "/api/cdn/config" "CDN Configuration"
test_endpoint "GET" "/api/cdn/stats" "CDN Statistics"
test_endpoint "POST" "/api/cdn/purge" "Purge CDN Cache" '{"paths":["/test/path"]}'

# Analytics Endpoints
echo -e "\n${MAGENTA}=== Analytics ===${NC}"
test_endpoint "GET" "/api/analytics/usage" "Usage Metrics"
test_endpoint "GET" "/api/analytics/usage?timeWindow=7200000" "Usage Metrics (2h window)"
test_endpoint "GET" "/api/analytics/performance" "Performance Metrics"
test_endpoint "GET" "/api/analytics/business" "Business Metrics"
test_endpoint "GET" "/api/analytics/dashboard" "Dashboard Data"
test_endpoint "GET" "/api/analytics/export?format=json" "Export Analytics (JSON)"

# APM Endpoints
echo -e "\n${MAGENTA}=== Application Performance Monitoring ===${NC}"
test_endpoint "GET" "/api/apm/metrics" "APM Metrics"
test_endpoint "GET" "/api/apm/metrics?timeWindow=7200000" "APM Metrics (2h window)"
test_endpoint "GET" "/api/apm/active" "Active Operations"

# Advanced Logging Endpoints
echo -e "\n${MAGENTA}=== Advanced Logging ===${NC}"
test_endpoint "GET" "/api/logs/metrics" "Log Metrics"
test_endpoint "GET" "/api/logs/metrics?timeWindow=7200000" "Log Metrics (2h window)"
test_endpoint "GET" "/api/logs/search?level=error&limit=50" "Search Logs"
test_endpoint "GET" "/api/logs/aggregations" "Log Aggregations"
test_endpoint "GET" "/api/logs/aggregations?timeWindow=1h&service=api" "Log Aggregations (filtered)"
test_endpoint "GET" "/api/logs/alerts" "Active Alerts"
test_endpoint "GET" "/api/logs/export?format=json" "Export Logs (JSON)"

# Summary
total_tests=$((pass_count + fail_count))
success_rate=$(awk "BEGIN {printf \"%.2f\", ($pass_count / $total_tests) * 100}")

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Total Tests: ${total_tests}"
echo -e "${GREEN}Passed: ${pass_count}${NC}"
if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}Failed: ${fail_count}${NC}"
else
    echo -e "${RED}Failed: ${fail_count}${NC}"
fi
echo -e "Success Rate: ${success_rate}%"

# Exit with appropriate code
if [ $fail_count -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
