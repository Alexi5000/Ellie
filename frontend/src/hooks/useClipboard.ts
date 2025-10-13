import { useState, useCallback } from 'react';

export interface UseClipboardReturn {
  copied: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  error: Error | null;
}

/**
 * Hook for copy-to-clipboard functionality
 * 
 * Provides a simple interface to copy text to clipboard with confirmation state.
 * Falls back to document.execCommand if Clipboard API is unavailable.
 * 
 * @param {number} resetDelay - Time in ms before resetting copied state (default: 2000)
 * @returns {UseClipboardReturn} Clipboard state and copy function
 * 
 * @example
 * ```tsx
 * const { copied, copyToClipboard } = useClipboard();
 * 
 * return (
 *   <button onClick={() => copyToClipboard('Hello World')}>
 *     {copied ? 'Copied!' : 'Copy'}
 *   </button>
 * );
 * ```
 */
export const useClipboard = (resetDelay: number = 2000): UseClipboardReturn => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        // Try modern Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setError(null);

          setTimeout(() => {
            setCopied(false);
          }, resetDelay);

          return true;
        } else {
          // Fallback to execCommand for older browsers or non-secure contexts
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          textArea.remove();

          if (successful) {
            setCopied(true);
            setError(null);

            setTimeout(() => {
              setCopied(false);
            }, resetDelay);

            return true;
          } else {
            throw new Error('Copy command failed');
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(error);
        setCopied(false);
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    },
    [resetDelay]
  );

  return { copied, copyToClipboard, error };
};
