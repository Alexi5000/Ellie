#!/bin/bash

# FastAPI Testing Script
# Comprehensive testing with coverage reporting

set -e

echo "🧪 Running Ellie Voice Receptionist FastAPI Tests..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Install test dependencies
echo "📦 Installing test dependencies..."
pip install pytest pytest-asyncio pytest-cov pytest-mock httpx faker

# Set test environment
export ENVIRONMENT=test
export NODE_ENV=test
export LOG_LEVEL=WARNING
export REDIS_URL=redis://localhost:6379/1  # Use different DB for tests

# Create test directory if it doesn't exist
mkdir -p tests

# Run tests with coverage
echo "🏃 Running tests with coverage..."
python -m pytest tests/ \
    --cov=app \
    --cov-report=html \
    --cov-report=term-missing \
    --cov-report=xml \
    --asyncio-mode=auto \
    -v \
    --tb=short

# Check coverage threshold
echo "📊 Checking coverage threshold..."
python -m coverage report --fail-under=80

echo "✅ All tests completed successfully!"
echo "📈 Coverage report generated in htmlcov/index.html"