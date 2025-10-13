# Test Environment Setup

This document describes how to set up and configure the test environment for the Ellie Voice Receptionist application.

## Overview

The test environment is designed to provide isolated, reproducible testing conditions with mock API keys and services. It supports both local development testing and CI/CD pipeline execution.

## Environment Files

### Backend Test Environment (`.env.test`)

Located at `backend/.env.test`, this file contains:

- Mock API keys for OpenAI and Groq services
- Test-specific database configuration
- Reduced logging levels
- Disabled external services (CDN, etc.)
- Lenient rate limiting for testing

### Frontend Test Environment (`.env.test`)

Located at `frontend/.env.test`, this file contains:

- Test API endpoints
- Mock audio configuration
- Disabled PWA features for testing
- Test-specific application settings

## Setup Scripts

### Automatic Setup

Run the setup script to automatically configure test environments:

```bash
# Linux/Mac
npm run test:setup

# Windows
npm run test:setup-windows
```

### Manual Setup

1. Copy environment examples:
   ```bash
   cp backend/.env.example backend/.env.test
   cp frontend/.env.example frontend/.env.test
   ```

2. Update API keys in `backend/.env.test`:
   ```env
   OPENAI_API_KEY=test_openai_api_key_mock
   GROQ_API_KEY=test_groq_api_key_mock
   ```

3. Add test-specific frontend variables to `frontend/.env.test`:
   ```env
   VITE_TEST_MODE=true
   VITE_MOCK_AUDIO=true
   VITE_SKIP_PERMISSIONS=true
   ```

## Running Tests

### Individual Test Suites

```bash
# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# Integration tests
npm run test:integration

# Production deployment tests
npm run test:production
```

### All Tests

```bash
# Run all test suites
npm run test:all
```

## CI/CD Configuration

### GitHub Actions

The `.github/workflows/test.yml` file configures automated testing with:

- Multiple Node.js versions (18.x, 20.x)
- Redis service for caching tests
- Environment variable injection
- Docker integration testing

### Environment Variables in CI

Set these secrets in your GitHub repository:

- `OPENAI_API_KEY` (optional - will use mock if not provided)
- `GROQ_API_KEY` (optional - will use mock if not provided)

### Local CI Testing

Test the CI configuration locally using act:

```bash
# Install act (GitHub Actions runner)
# https://github.com/nektos/act

# Run tests locally
act -j test
```

## Mock Services

### OpenAI API Mocking

The test environment includes comprehensive OpenAI API mocking:

```typescript
// Whisper API (Speech-to-Text)
mockOpenAI.audio.transcriptions.create.mockResolvedValue('Mock transcription');

// TTS API (Text-to-Speech)
mockOpenAI.audio.speech.create.mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
});
```

### Groq API Mocking

Groq API responses are mocked for consistent testing:

```typescript
mockGroq.chat.completions.create.mockResolvedValue({
  choices: [{
    message: { content: 'Mock AI response' }
  }]
});
```

### Redis Mocking

Redis operations are mocked to avoid external dependencies:

```typescript
mockRedis.get.mockResolvedValue(null);
mockRedis.set.mockResolvedValue('OK');
mockRedis.del.mockResolvedValue(1);
```

## Test Configuration

### Jest Configuration (Backend)

Key settings in `backend/jest.config.js`:

- Single worker to prevent race conditions
- 15-second timeout for async operations
- Comprehensive cleanup between tests
- Mock clearing and restoration

### Vitest Configuration (Frontend)

Key settings in `frontend/vite.config.ts`:

- jsdom environment for DOM testing
- Global test utilities
- Environment variable injection
- Mock service worker support

## Debugging Tests

### Backend Debugging

Enable verbose logging in tests:

```bash
LOG_LEVEL=debug npm run test:backend
```

### Frontend Debugging

Run tests in watch mode:

```bash
cd frontend
npm run test:watch
```

### Integration Test Debugging

Increase timeout and enable detailed logging:

```bash
DEBUG=true npm run test:integration
```

## Common Issues

### API Key Errors

**Problem**: Tests fail with "API key not found" errors.

**Solution**: Ensure test environment files are created and contain mock API keys:

```bash
npm run test:setup
```

### Port Conflicts

**Problem**: Tests fail due to port conflicts.

**Solution**: Use port 0 for dynamic port assignment in tests:

```env
PORT=0
```

### Redis Connection Errors

**Problem**: Tests fail to connect to Redis.

**Solution**: Ensure Redis is mocked in test setup or running locally:

```bash
# Start Redis for integration tests
docker run -d -p 6379:6379 redis:alpine
```

### Audio API Errors

**Problem**: Frontend tests fail due to missing Web Audio API.

**Solution**: Ensure proper mocking in test setup:

```typescript
Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({ /* mock implementation */ }))
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on external services
2. **Cleanup**: Always clean up resources after tests complete
3. **Mocking**: Mock external APIs and services consistently
4. **Environment**: Use separate test databases and cache instances
5. **Timeouts**: Set appropriate timeouts for async operations
6. **Logging**: Use reduced logging levels in tests to avoid noise

## Troubleshooting

### Test Environment Not Loading

Check that environment files exist and are properly formatted:

```bash
ls -la backend/.env.test frontend/.env.test
```

### Mock Services Not Working

Verify mock setup in test configuration files:

- `backend/src/test/setup.ts`
- `frontend/src/test/setup.ts`

### CI/CD Failures

Check GitHub Actions logs for specific error messages and ensure all required environment variables are set.

## Contributing

When adding new tests:

1. Update environment files if new variables are needed
2. Add appropriate mocks for external services
3. Ensure tests clean up after themselves
4. Update this documentation if configuration changes