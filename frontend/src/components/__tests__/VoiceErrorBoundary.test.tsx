import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { VoiceErrorBoundary } from '../VoiceErrorBoundary';

// Mock the TextFallbackInterface component
vi.mock('../TextFallbackInterface', () => ({
  TextFallbackInterface: ({ onRetryVoice }: { onRetryVoice: () => void }) => (
    <div>
      <div>Text Fallback Interface</div>
      <button onClick={onRetryVoice}>Retry Voice from Fallback</button>
    </div>
  ),
}));

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Voice error');
  }
  return <div>Voice working</div>;
};

describe('VoiceErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <VoiceErrorBoundary>
        <ThrowError shouldThrow={false} />
      </VoiceErrorBoundary>
    );

    expect(screen.getByText('Voice working')).toBeInTheDocument();
  });

  it('renders voice-specific error UI when there is an error', () => {
    render(
      <VoiceErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    expect(screen.getByText('Voice Feature Error')).toBeInTheDocument();
    expect(screen.getByText(/We're having trouble with the voice features/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Voice Again' })).toBeInTheDocument();
  });

  it('shows text fallback button when enableTextFallback is true', () => {
    render(
      <VoiceErrorBoundary enableTextFallback={true}>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    expect(screen.getByRole('button', { name: 'Use Text Instead' })).toBeInTheDocument();
  });

  it('hides text fallback button when enableTextFallback is false', () => {
    render(
      <VoiceErrorBoundary enableTextFallback={false}>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    expect(screen.queryByRole('button', { name: 'Use Text Instead' })).not.toBeInTheDocument();
  });

  it('shows text fallback interface when Use Text Instead is clicked', () => {
    render(
      <VoiceErrorBoundary enableTextFallback={true}>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use Text Instead' }));

    expect(screen.getByText('Text Fallback Interface')).toBeInTheDocument();
    expect(screen.getByText(/Voice features are temporarily unavailable/)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <VoiceErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('resets error state when Try Voice Again is clicked', async () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Voice error');
      }
      return <div>Voice working</div>;
    };

    const { rerender } = render(
      <VoiceErrorBoundary>
        <TestComponent />
      </VoiceErrorBoundary>
    );

    expect(screen.getByText('Voice Feature Error')).toBeInTheDocument();

    // Change the component to not throw error before clicking Try Again
    shouldThrow = false;

    // Click Try Again to reset error state
    fireEvent.click(screen.getByRole('button', { name: 'Try Voice Again' }));

    // The error boundary should now render the children again
    await waitFor(() => {
      expect(screen.getByText('Voice working')).toBeInTheDocument();
    });
  });

  it('shows troubleshooting tips', () => {
    render(
      <VoiceErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    expect(screen.getByText('Troubleshooting Tips')).toBeInTheDocument();
    
    // Click to expand troubleshooting tips
    fireEvent.click(screen.getByText('Troubleshooting Tips'));
    
    expect(screen.getByText(/Check that microphone permissions are enabled/)).toBeInTheDocument();
    expect(screen.getByText(/Ensure you're using a supported browser/)).toBeInTheDocument();
  });

  it('allows retry from text fallback interface', () => {
    render(
      <VoiceErrorBoundary enableTextFallback={true}>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    // Switch to text fallback
    fireEvent.click(screen.getByRole('button', { name: 'Use Text Instead' }));
    expect(screen.getByText('Text Fallback Interface')).toBeInTheDocument();

    // Click retry voice from fallback
    fireEvent.click(screen.getByRole('button', { name: 'Retry Voice from Fallback' }));

    // Should show the voice error UI again (since we're still throwing)
    expect(screen.getByText('Voice Feature Error')).toBeInTheDocument();
  });
});