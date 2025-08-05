#!/bin/bash

# Test Environment Setup Script
# This script sets up environment variables for testing in CI/CD pipelines

set -e

echo "Setting up test environment..."

# Create test environment files if they don't exist
create_backend_test_env() {
    if [ ! -f "backend/.env.test" ]; then
        echo "Creating backend/.env.test..."
        cp backend/.env.example backend/.env.test
        
        # Override with test-specific values
        sed -i 's/NODE_ENV=development/NODE_ENV=test/' backend/.env.test
        sed -i 's/PORT=5000/PORT=0/' backend/.env.test
        sed -i 's/your_openai_api_key_here/test_openai_api_key_mock/' backend/.env.test
        sed -i 's/your_groq_api_key_here/test_groq_api_key_mock/' backend/.env.test
        sed -i 's/LOG_LEVEL=info/LOG_LEVEL=error/' backend/.env.test
        sed -i 's/CDN_ENABLED=false/CDN_ENABLED=false/' backend/.env.test
        sed -i 's/REDIS_DB=0/REDIS_DB=1/' backend/.env.test
    fi
}

create_frontend_test_env() {
    if [ ! -f "frontend/.env.test" ]; then
        echo "Creating frontend/.env.test..."
        cp frontend/.env.example frontend/.env.test
        
        # Add test-specific values
        echo "" >> frontend/.env.test
        echo "# Test-specific Configuration" >> frontend/.env.test
        echo "VITE_TEST_MODE=true" >> frontend/.env.test
        echo "VITE_MOCK_AUDIO=true" >> frontend/.env.test
        echo "VITE_SKIP_PERMISSIONS=true" >> frontend/.env.test
        echo "VITE_PWA_ENABLED=false" >> frontend/.env.test
    fi
}

# Set up mock API keys for CI/CD if not provided
setup_ci_env_vars() {
    echo "Setting up CI/CD environment variables..."
    
    # Export test environment variables
    export NODE_ENV=test
    export OPENAI_API_KEY=${OPENAI_API_KEY:-"test_openai_api_key_mock"}
    export GROQ_API_KEY=${GROQ_API_KEY:-"test_groq_api_key_mock"}
    export CI=true
    
    # Create .env files for CI if they don't exist
    if [ "$CI" = "true" ]; then
        echo "Running in CI environment, creating test configuration..."
        
        # Backend CI environment
        cat > backend/.env.test << EOF
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
EOF

        # Frontend CI environment
        cat > frontend/.env.test << EOF
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
EOF
    fi
}

# Validate test environment
validate_test_env() {
    echo "Validating test environment..."
    
    # Check required files exist
    if [ ! -f "backend/.env.test" ]; then
        echo "Error: backend/.env.test not found"
        exit 1
    fi
    
    if [ ! -f "frontend/.env.test" ]; then
        echo "Error: frontend/.env.test not found"
        exit 1
    fi
    
    # Check required environment variables
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "Warning: OPENAI_API_KEY not set, using mock value"
    fi
    
    if [ -z "$GROQ_API_KEY" ]; then
        echo "Warning: GROQ_API_KEY not set, using mock value"
    fi
    
    echo "Test environment validation completed"
}

# Main execution
main() {
    echo "Starting test environment setup..."
    
    create_backend_test_env
    create_frontend_test_env
    setup_ci_env_vars
    validate_test_env
    
    echo "Test environment setup completed successfully!"
    echo ""
    echo "Environment files created:"
    echo "  - backend/.env.test"
    echo "  - frontend/.env.test"
    echo ""
    echo "To run tests:"
    echo "  npm test                    # Run all tests"
    echo "  npm run test:integration    # Run integration tests"
    echo "  npm run test:production     # Run production tests"
}

# Run main function
main "$@"