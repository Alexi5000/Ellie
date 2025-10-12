# Frontend Test Environment Configuration

## Overview

This document describes the test environment configuration for the Ellie Voice Receptionist frontend, including test isolation strategies, mock setup, and best practices for writing tests.

## Test Configuration

### Vitest Configuration (`vite.config.ts`)

- **Test Environment**: jsdom (browser simulation)
- **Test Timeout**: 20 seconds (for async operations)
- **Hook Timeout**: 15 seconds
- **Teardown Timeout**: 10 seconds
- **Pool**: forks with single fork (prevents race conditions)
- **Test Isolation**: Enabled with `isolate: true`
- **Mock Cleanup**: Automatic with `clearMocks`, `restoreMocks`, `mockReset`
- **Retry**: 1 (retry flaky tests once)

### Environment Setup

Tests use a single setup file:

- **`src/test/setup.ts`**: Configures mocks, test utilities, and cleanup hooks

## Environment Variables

Test environment variables are loaded from `.env.test` and configured in `vite.config.ts`:

```bash
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
VITE_APP_NAME=Ellie Voice Receptionist (Test)
VITE_TEST_MODE=true
VITE_MOCK_AUDIO=true
VITE_SKIP_PERMISSIONS=true
```

These are automatically available in tests via `import.meta.env`.

## Test Isolation

### Automatic Cleanup

Each test is isolated with automatic cleanup:

```typescript
beforeEach(() => {
  // Clear all mocks
  // Reset fetch mock to default behavior
  // Reset Audio mock
  // Reset MediaRecorder mock
});

afterEach(async () => {
  // Clear all mocks and timers
  // Wait for pending promises
  // Additional cleanup delay (10ms)
});
```

### Browser API Mocks

All browser APIs are mocked:

- **MediaRecorder**: Mocked for audio recording
- **getUserMedia**: Mocked for microphone access
- **WebSocket**: Mocked for Socket.io
- **Audio**: Mocked for audio playback
- **Service Worker**: Mocked for PWA functionality
- **navigator.vibrate**: Mocked for mobile haptics
- **fetch**: Mocked for API calls

### Mock Implementations

#### MediaRecorder Mock

```typescript
const mockMediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive',
  mimeType: 'audio/webm',
}));
```

#### WebSocket Mock

```typescript
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  send = vi.fn();
  close = vi.fn();
  readyState = 1; // OPEN
}
```

#### Socket.io Mock

```typescript
vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: 'mock-socket-id',
  }),
}));
```

## Writing Tests

### Best Practices

1. **Use Testing Library**: Prefer user-centric queries
   ```typescript
   import { render, screen, waitFor } from '@testing-library/react';
   
   it('should display button', () => {
     render(<VoiceButton />);
     expect(screen.getByRole('button')).toBeInTheDocument();
   });
   ```

2. **Handle Async Operations**: Use waitFor for async updates
   ```typescript
   it('should update state', async () => {
     render(<Component />);
     await waitFor(() => {
       expect(screen.getByText('Updated')).toBeInTheDocument();
     });
   });
   ```

3. **Mock API Calls**: Use fetch mock
   ```typescript
   beforeEach(() => {
     (global.fetch as any).mockResolvedValue({
       ok: true,
       json: async () => ({ data: 'test' }),
     });
   });
   ```

4. **Test User Interactions**: Use userEvent
   ```typescript
   import userEvent from '@testing-library/user-event';
   
   it('should handle click', async () => {
     const user = userEvent.setup();
     render(<Button />);
     await user.click(screen.getByRole('button'));
     expect(mockHandler).toHaveBeenCalled();
   });
   ```

### Testing Voice Interactions

```typescript
it('should start recording', async () => {
  render(<VoiceInterface />);
  
  const button = screen.getByRole('button', { name: /start/i });
  await userEvent.click(button);
  
  await waitFor(() => {
    expect(mockMediaRecorder).toHaveBeenCalled();
  });
});
```

### Testing Socket.io

```typescript
import { socketService } from '../services/socketService';

it('should connect to socket', async () => {
  render(<App />);
  
  await waitFor(() => {
    expect(socketService.connect).toHaveBeenCalled();
  });
});
```

### Testing Error Boundaries

```typescript
it('should catch errors', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **Act Warnings**
   - Wrap state updates in `waitFor`
   - Use `await` for async operations
   - Ensure all promises resolve

2. **Mock Not Working**
   - Verify mock is set up in setup.ts
   - Check mock is cleared in beforeEach
   - Use `vi.clearAllMocks()` to reset

3. **Timeout Errors**
   - Increase timeout in test or config
   - Check for unresolved promises
   - Ensure proper async/await usage

4. **Memory Leaks**
   - Clean up event listeners
   - Clear timers in cleanup
   - Disconnect sockets in afterEach

### Debug Mode

Enable verbose logging:

```bash
VITEST_VERBOSE=true npm test
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test -- VoiceInterface.test.tsx
```

### Watch Mode
```bash
npm run test:watch
```

### With UI
```bash
npx vitest --ui
```

### With Coverage
```bash
npm test -- --coverage
```

## Test Structure

```
frontend/
├── src/
│   ├── test/
│   │   └── setup.ts              # Mock setup and cleanup
│   ├── components/
│   │   └── __tests__/
│   │       └── *.test.tsx        # Component tests
│   ├── hooks/
│   │   └── __tests__/
│   │       └── *.test.ts         # Hook tests
│   └── services/
│       └── __tests__/
│           └── *.test.ts         # Service tests
├── vite.config.ts                # Vitest configuration
└── .env.test                     # Test environment variables
```

## Component Testing Patterns

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';

it('should use voice recording', async () => {
  const { result } = renderHook(() => useVoiceRecording());
  
  act(() => {
    result.current.startRecording();
  });
  
  await waitFor(() => {
    expect(result.current.isRecording).toBe(true);
  });
});
```

### Testing Context Providers

```typescript
const wrapper = ({ children }) => (
  <SocketProvider>
    {children}
  </SocketProvider>
);

it('should provide socket context', () => {
  const { result } = renderHook(() => useSocket(), { wrapper });
  expect(result.current.isConnected).toBe(true);
});
```

### Testing Mobile Features

```typescript
it('should detect mobile device', () => {
  // Mock mobile user agent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mobile',
    configurable: true,
  });
  
  render(<MobileComponent />);
  expect(screen.getByTestId('mobile-view')).toBeInTheDocument();
});
```

## Continuous Integration

For CI environments:

1. Ensure `.env.test` is committed
2. Set `CI=true` environment variable
3. Use `--run` flag (no watch mode)
4. Monitor test execution time
5. Review coverage reports
6. Check for flaky tests

## Performance Tips

1. **Use Shallow Rendering**: When full render isn't needed
2. **Mock Heavy Dependencies**: Mock large libraries
3. **Parallel Execution**: Use multiple workers (if stable)
4. **Skip Slow Tests**: Use `.skip` for development
5. **Focus Tests**: Use `.only` during development

## Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Security Notes

- Never commit real API keys or tokens
- Mock all external API calls
- Test authentication flows with mock tokens
- Verify CORS handling in tests
- Test input validation and sanitization
