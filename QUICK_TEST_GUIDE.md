# Quick Test Guide

## Running Tests

### Backend
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm test -- <filename>     # Run specific file
```

### Frontend
```bash
cd frontend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm test -- <filename>     # Run specific file
```

## Writing Tests

### Backend Test Example

```typescript
import { createMockMulterFile, createMockConversationContext } from './test/testHelpers';

describe('My Service', () => {
  it('should process audio', async () => {
    // Use helper to create mock file
    const mockFile = createMockMulterFile({
      mimetype: 'audio/wav',
      size: 2048,
    });
    
    // Use helper to create mock context
    const context = createMockConversationContext({
      sessionId: 'test-123',
    });
    
    // Test your service
    const result = await service.process(mockFile, context);
    expect(result).toBeDefined();
  });
});
```

### Frontend Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockGetUserMedia, mockFetchSuccess } from './test/testHelpers';

describe('My Component', () => {
  it('should handle user interaction', async () => {
    // Setup mocks
    mockGetUserMedia();
    mockFetchSuccess({ data: 'test' });
    
    // Render component
    render(<MyComponent />);
    
    // Simulate user interaction
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    
    // Assert results
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

## Common Test Utilities

### Backend

```typescript
// Wait for promises
await flushPromises();

// Reset all mocks
resetAllMockServices();

// Control rate limiting
enableRateLimiting();
disableRateLimiting();

// Create mock data
const file = createMockMulterFile();
const context = createMockConversationContext();
const message = createMockMessage();

// Wait for condition
await waitForCondition(() => someCondition === true);
```

### Frontend

```typescript
// Wait for promises
await flushPromises();

// Reset all mocks
resetAllMocks();

// Mock browser APIs
mockGetUserMedia();
mockGetUserMediaError(new Error('Permission denied'));
mockFetchSuccess({ data: 'test' });
mockFetchError(new Error('Network error'));

// Mock devices
const mobile = mockMobileDevice();
// ... test mobile behavior
mobile.restore();

// Create mock data
const blob = createMockAudioBlob();
const stream = createMockMediaStream();
const socket = mockSocketConnection();

// Wait for condition
await waitForCondition(() => someCondition === true);
```

## Troubleshooting

### Test Timeout
```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 45000); // 45 second timeout
```

### Flaky Tests
- Check for proper cleanup in afterEach
- Ensure mocks are reset between tests
- Add delays for async operations
- Use waitFor for async state updates

### Mock Not Working
```typescript
// Reset mock before test
beforeEach(() => {
  jest.clearAllMocks(); // Backend
  vi.clearAllMocks();   // Frontend
});
```

### Open Handles
- Check for unclosed timers
- Ensure all async operations complete
- Clean up event listeners
- Disconnect services in afterEach

## Best Practices

1. **Always use test helpers** for creating mock data
2. **Reset mocks** in beforeEach hooks
3. **Clean up** in afterEach hooks
4. **Use waitFor** for async operations
5. **Mock external services** to prevent real API calls
6. **Test user behavior** not implementation details
7. **Keep tests isolated** - no shared state
8. **Use descriptive test names** that explain what is being tested

## Documentation

- **Backend**: See `backend/TEST_ENVIRONMENT.md`
- **Frontend**: See `frontend/TEST_ENVIRONMENT.md`
- **Improvements**: See `TEST_ENVIRONMENT_IMPROVEMENTS.md`
- **Completion**: See `TASK_8_COMPLETION_SUMMARY.md`

## Need Help?

1. Check the test environment documentation
2. Look at existing tests for examples
3. Use test helpers for common operations
4. Enable verbose mode for debugging:
   - Backend: `JEST_VERBOSE=true npm test`
   - Frontend: `VITEST_VERBOSE=true npm test`
