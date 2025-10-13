#!/bin/bash

# FastAPI Startup Script
# Production-ready startup with proper error handling

set -e

echo "🚀 Starting Ellie Voice Receptionist FastAPI Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check required environment variables
required_vars=("OPENAI_API_KEY" "SECRET_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Check if Redis is available
echo "🔍 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if ! redis-cli -u "${REDIS_URL:-redis://localhost:6379/0}" ping &> /dev/null; then
        echo "⚠️  Redis is not available. Starting without Redis (using in-memory cache)..."
    else
        echo "✅ Redis connection successful"
    fi
else
    echo "⚠️  redis-cli not found. Assuming Redis is available..."
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

echo "📦 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing/updating dependencies..."
pip install -r requirements.txt

# Run database migrations (if applicable)
# echo "🗄️  Running database migrations..."
# alembic upgrade head

# Start the application
echo "🎯 Starting FastAPI application..."
echo "🌐 Environment: ${ENVIRONMENT:-development}"
echo "🏠 Host: ${HOST:-0.0.0.0}"
echo "🔌 Port: ${PORT:-8000}"
echo "👥 Workers: ${WORKERS:-1}"

if [ "${ENVIRONMENT}" = "production" ]; then
    echo "🏭 Starting in production mode with ${WORKERS:-4} workers..."
    exec uvicorn app.main:app \
        --host "${HOST:-0.0.0.0}" \
        --port "${PORT:-8000}" \
        --workers "${WORKERS:-4}" \
        --log-level "${LOG_LEVEL:-info}" \
        --access-log \
        --no-use-colors
else
    echo "🔧 Starting in development mode with auto-reload..."
    exec uvicorn app.main:app \
        --host "${HOST:-0.0.0.0}" \
        --port "${PORT:-8000}" \
        --reload \
        --log-level "${LOG_LEVEL:-info}" \
        --access-log
fi