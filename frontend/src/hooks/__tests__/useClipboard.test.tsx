import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipboard } from '../useClipboard';

describe('useClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Clipboard API', () => {
    it('should initialize with copied as false', () => {
      const { result } = renderHook(() => useClipboard());

      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should copy text using Clipboard API', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      Object.assign(window, {
        isSecureContext: true,
      });

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean = false;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('Hello World');
      });

      expect(copyResult).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith('Hello World');
      expect(result.current.copied).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should reset copied state after delay', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      Object.assign(window, {
        isSecureContext: true,
      });

      const { result } = renderHook(() => useClipboard(1000));

      await act(async () => {
        await result.current.copyToClipboard('Test');
      });

      expect(result.current.copied).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.copied).toBe(false);
      });
    });

    it('should use custom reset delay', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      Object.assign(window, {
        isSecureContext: true,
      });

      const { result } = renderHook(() => useClipboard(5000));

      await act(async () => {
        await result.current.copyToClipboard('Test');
      });

      expect(result.current.copied).toBe(true);

      // Should still be copied after 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.copied).toBe(true);

      // Should reset after 5 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(result.current.copied).toBe(false);
      });
    });

    it('should handle Clipboard API errors', async () => {
      const mockError = new Error('Clipboard API failed');
      const mockWriteText = vi.fn().mockRejectedValue(mockError);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      Object.assign(window, {
        isSecureContext: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean = false;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('Test');
      });

      expect(copyResult).toBe(false);
      expect(result.current.copied).toBe(false);
      expect(result.current.error).toEqual(mockError);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', mockError);

      consoleSpy.mockRestore();
    });
  });

  describe('execCommand Fallback', () => {
    it('should fallback to execCommand when Clipboard API is unavailable', async () => {
      // Remove Clipboard API
      Object.assign(navigator, {
        clipboard: undefined,
      });

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean = false;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('Fallback Test');
      });

      expect(copyResult).toBe(true);
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result.current.copied).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should fallback to execCommand in non-secure context', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(),
        },
      });
      Object.assign(window, {
        isSecureContext: false,
      });

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyToClipboard('Non-secure Test');
      });

      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result.current.copied).toBe(true);
    });

    it('should handle execCommand failure', async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });

      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean = false;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('Test');
      });

      expect(copyResult).toBe(false);
      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Copy command failed');

      consoleSpy.mockRestore();
    });

    it('should create and remove textarea element for execCommand', async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(HTMLTextAreaElement.prototype, 'remove');

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyToClipboard('Test');
      });

      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('Multiple Copies', () => {
    it('should handle multiple copy operations', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      Object.assign(window, {
        isSecureContext: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyToClipboard('First');
      });
      expect(result.current.copied).toBe(true);

      await act(async () => {
        await result.current.copyToClipboard('Second');
      });
      expect(result.current.copied).toBe(true);
      expect(mockWriteText).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid successive copies', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      Object.assign(window, {
        isSecureContext: true,
      });

      const { result } = renderHook(() => useClipboard(2000));

      await act(async () => {
        await result.current.copyToClipboard('First');
      });

      expect(result.current.copied).toBe(true);

      // Advance time by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Copy again
      await act(async () => {
        await result.current.copyToClipboard('Second');
      });

      // Should still be copied
      expect(result.current.copied).toBe(true);

      // Advance by 2 seconds to trigger the second timer
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.copied).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error exceptions', async () => {
      const mockWriteText = vi.fn().mockRejectedValue('String error');
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      Object.assign(window, {
        isSecureContext: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyToClipboard('Test');
      });

      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to copy to clipboard');

      consoleSpy.mockRestore();
    });

    it('should clear error on successful copy', async () => {
      const mockWriteText = vi
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined);

      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      Object.assign(window, {
        isSecureContext: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useClipboard());

      // First copy fails
      await act(async () => {
        await result.current.copyToClipboard('Test');
      });
      expect(result.current.error).toBeTruthy();

      // Second copy succeeds
      await act(async () => {
        await result.current.copyToClipboard('Test');
      });
      expect(result.current.error).toBeNull();
      expect(result.current.copied).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
