import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TextFallbackInterface } from '../TextFallbackInterface';

// Mock fetch
global.fetch = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('TextFallbackInterface', () => {
  beforeEach(() => {
    (fetch as any).mockClear();
  });

  it('renders the text chat interface', () => {
    render(<TextFallbackInterface />);

    expect(screen.getByText('Text Chat with Ellie')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByText('Type your message below to start chatting with Ellie')).toBeInTheDocument();
  });

  it('shows retry voice button when onRetryVoice is provided', () => {
    const onRetryVoice = vi.fn();
    render(<TextFallbackInterface onRetryVoice={onRetryVoice} />);

    const retryButton = screen.getByText('Try Voice');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetryVoice).toHaveBeenCalled();
  });

  it('hides retry voice button when onRetryVoice is not provided', () => {
    render(<TextFallbackInterface />);

    expect(screen.queryByText('Try Voice')).not.toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Hello! How can I help you?' }),
    });

    render(<TextFallbackInterface />);

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    const submitButton = screen.getByRole('button', { name: '' }); // Submit button has no text, only icon
    fireEvent.click(submitButton);

    expect(fetch).toHaveBeenCalledWith('/api/chat/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        sessionId: 'text-fallback-session',
      }),
    });

    // Wait for the response to be processed
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
    });
  });

  it('shows loading state while processing', async () => {
    (fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<TextFallbackInterface />);

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText('Ellie is typing...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeDisabled();
  });

  it('handles API errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<TextFallbackInterface />);

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Failed to send message. Please try again.')).toBeInTheDocument();
      expect(screen.getByText(/I apologize, but I'm having trouble processing/)).toBeInTheDocument();
    });
  });

  it('handles HTTP errors', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<TextFallbackInterface />);

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Failed to send message. Please try again.')).toBeInTheDocument();
    });
  });

  it('clears conversation when clear button is clicked', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Hello! How can I help you?' }),
    });

    render(<TextFallbackInterface />);

    // Send a message first
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Clear conversation
    fireEvent.click(screen.getByText('Clear'));

    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    expect(screen.getByText('Type your message below to start chatting with Ellie')).toBeInTheDocument();
  });

  it('prevents submission of empty messages', () => {
    render(<TextFallbackInterface />);

    const submitButton = screen.getByRole('button', { name: '' }); // Submit button has no text, only icon
    expect(submitButton).toBeDisabled();

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: '   ' } }); // Only whitespace

    expect(submitButton).toBeDisabled();
  });

  it('enables submission when message has content', () => {
    render(<TextFallbackInterface />);

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    const submitButton = screen.getByRole('button', { name: '' }); // Submit button has no text, only icon
    expect(submitButton).not.toBeDisabled();
  });

  it('clears input after successful submission', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Hello! How can I help you?' }),
    });

    render(<TextFallbackInterface />);

    const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});