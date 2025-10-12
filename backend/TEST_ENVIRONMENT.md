# Backend Test Environment Configuration

## Overview

This document describes the test environment configuration for the Ellie Voice Receptionist backend, including test isolation strategies, API key handling, and best practices for writing tests.

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Test Environment**: Node.js
- **Test Timeout**: 30 seconds (for async operations)
- **Max Workers**: 1 (single worker to prevent race conditions)
- **Test Isolation**: Enabled with `resetModules: true`
- **Mock Cleanup**: Automatic with `clearMocks`, `resetMocks`, `restoreMocks`

### Environment Setup

Tests use two setup files that run in order:

1. **`src/test/env-setup.ts`**: Loads environment variables and sets up mock API keys
2. **`src/test/setup.ts`**: Configures mocks, test utilities, and cleanup hooks

## API Key Handling

### Test API Keys

**IMPORTANT**: Tests ALWAYS use mock API keys for security and consistency:

```typescript
process.env.OPENAI_API_KEY = 'sk-test_openai_api_key_mock_1234567890abcdef';
process.env.GROQ_API_KEY = 'gsk_test_groq_api_key_mock_1234567890abcdef';
```

These mock keys are:
- Set automatically in `env-setup.ts`
- Never make real API calls
- Prevent accidental charges during testing
- Ensure consistent test behavior

### Environment Variables

Test environment variables are loaded from `.env.test`:

```bash
NODE_ENV=test
PORT=0
OPENAI_API_KEY=test_openai_api_key_mock
GROQ_API_KEY=test_groq_api_key_mock
LOG_LEVEL=error
REDIS_DB=1
CDN_ENABLED=false
```

## Test Isolation

### Automatic Cleanup

Each test is isolated with automatic cleanup:

```typescript
beforeEach(async () => {
  // Clear timers and intervals
  // Reset all mocks
  // Reset rate limiting state
  // Reset mock service implementations
  // Wait for pending operations
});

afterEach(async () => {
  // Clear all timers and intervals
  // Reset all mocks
  // Wait for async operations
  // Additional cleanup delay (50ms)
});
```

### Service Mocks

All external services are mocked:

- **OpenAI SDK**: Mocked for Whisper and TTS
- **Groq SDK**: Mocked for AI responses
- **Redis**: Mocked to prevent connection attempts
- **Logger Service**: Mocked to suppress test logs
- **Rate Limit Service**: Mocked with configurable behavior
- **Cache Service**: Mocked with in-memory operations
- **CDN Service**: Mocked with disabled CDN

### Timer Management

Tests track and clean up all timers:

```typescript
// Timers are tracked automatically
const timer = setTimeout(() => {}, 1000);

// Cleaned up automatically in afterEach
// No manual cleanup needed
```

## Writing Tests

### Best Practices

1. **Use Shared Mocks**: Access global mock instances for consistency
   ```typescript
   const mockVoiceService = (global as any).sharedMockVoiceProcessingService;
   mockVoiceService.processAudioInput.mockResolvedValue('Custom response');
   ```

2. **Reset Mocks Between Tests**: Automatic, but can be done manually
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **Handle Async Operations**: Use proper async/await
   ```typescript
   it('should process async operation', async () => {
     const result = await service.processData();
     expect(result).toBeDefined();
   });
   ```

4. **Test Timeouts**: Increase timeout for slow tests
   ```typescript
   it('should handle long operation', async () => {
     // Test code
   }, 45000); // 45 second timeout
   ```

### Rate Limiting Tests

Control rate limiting behavior:

```typescript
// Enable rate limiting for specific tests
(global as any).enableRateLimiting();

// Test rate limit behavior
const response = await request(app).post('/api/voice/process');

// Disable rate limiting after test
(global as any).disableRateLimiting();
```

### Mock Service Customization

Customize mock behavior per test:

```typescript
it('should handle transcription error', async () => {
  const mockService = (global as any).sharedMockVoiceProcessingService;
  mockService.processAudioInput.mockRejectedValue(new Error('Transcription failed'));
  
  // Test error handling
  const response = await request(app).post('/api/voice/process');
  expect(response.status).toBe(500);
});
```

## Troubleshooting

### Common Issues

1. **Open Handles Warning**
   - Caused by unclosed timers or connections
   - Check for missing cleanup in services
   - Use `detectOpenHandles: true` to identify

2. **Test Interference**
   - Tests affecting each other
   - Ensure proper mock reset in beforeEach
   - Use single worker (`maxWorkers: 1`)

3. **Timeout Errors**
   - Increase test timeout in jest.config.js
   - Check for unresolved promises
   - Ensure proper async/await usage

4. **Mock Not Working**
   - Verify mock is set up in env-setup.ts or setup.ts
   - Check mock is imported before actual module
   - Use `jest.clearAllMocks()` to reset

### Debug Mode

Enable verbose logging:

```bash
JEST_VERBOSE=true npm test
```

This will show:
- Mock function calls
- Environment setup details
- Service initialization logs

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test -- voiceRoutes.test.ts
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm test -- --coverage
```

## Test Structure

```
backend/
├── src/
│   ├── test/
│   │   ├── env-setup.ts          # Environment configuration
│   │   ├── setup.ts              # Mock setup and cleanup
│   │   ├── voiceRoutes.test.ts   # Route tests
│   │   └── *.test.ts             # Other test files
│   └── services/
│       └── *.ts                  # Service implementations
├── jest.config.js                # Jest configuration
└── .env.test                     # Test environment variables
```

## Continuous Integration

For CI environments:

1. Ensure `.env.test` is committed (contains only mock values)
2. Set `CI=true` environment variable
3. Use `--forceExit` flag if needed
4. Monitor test execution time
5. Review coverage reports

## Security Notes

- Never commit real API keys
- Always use mock keys in tests
- Review `.env.test` before committing
- Mock external service calls
- Disable real network requests in tests
