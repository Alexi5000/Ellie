import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeTabs, CodeTab } from '../CodeTabs';

// Mock hooks
vi.mock('../../../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('../../../../hooks/useClipboard', () => ({
  useClipboard: vi.fn(() => ({
    copied: false,
    copyToClipboard: vi.fn().mockResolvedValue(true),
    error: null,
  })),
}));

// Mock react-syntax-highlighter
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => (
    <pre data-testid="syntax-highlighter">{children}</pre>
  ),
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

const mockTabs: CodeTab[] = [
  {
    id: 'typescript',
    label: 'TypeScript',
    language: 'typescript',
    code: 'const hello = "world";',
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python',
    code: 'hello = "world"',
  },
  {
    id: 'curl',
    label: 'cURL',
    language: 'bash',
    code: 'curl https://api.example.com',
  },
];

describe('CodeTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render all tabs', () => {
      render(<CodeTabs tabs={mockTabs} />);

      expect(screen.getByRole('tab', { name: 'TypeScript' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Python' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'cURL' })).toBeInTheDocument();
    });

    it('should render the first tab as active by default', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const firstTab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
      expect(firstTab).toHaveAttribute('tabindex', '0');
    });

    it('should render the specified default tab as active', () => {
      render(<CodeTabs tabs={mockTabs} defaultTab="python" />);

      const pythonTab = screen.getByRole('tab', { name: 'Python' });
      expect(pythonTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should render the active tab panel', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const panel = screen.getByRole('tabpanel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('id', 'panel-typescript');
      expect(panel).toHaveAttribute('aria-labelledby', 'tab-typescript');
    });

    it('should display the code for the active tab', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const panel = screen.getByRole('tabpanel');
      const codeBlock = panel.querySelector('[data-testid="syntax-highlighter"]');
      expect(codeBlock).toHaveTextContent('const hello = "world";');
    });

    it('should render copy button', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch tabs when clicked', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const pythonTab = screen.getByRole('tab', { name: 'Python' });
      fireEvent.click(pythonTab);

      expect(pythonTab).toHaveAttribute('aria-selected', 'true');
      const panel = screen.getByRole('tabpanel');
      const codeBlock = panel.querySelector('[data-testid="syntax-highlighter"]');
      expect(codeBlock).toHaveTextContent('hello = "world"');
    });

    it('should update tabindex when switching tabs', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      const pythonTab = screen.getByRole('tab', { name: 'Python' });

      expect(tsTab).toHaveAttribute('tabindex', '0');
      expect(pythonTab).toHaveAttribute('tabindex', '-1');

      fireEvent.click(pythonTab);

      expect(tsTab).toHaveAttribute('tabindex', '-1');
      expect(pythonTab).toHaveAttribute('tabindex', '0');
    });

    it('should hide inactive tab panels', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const pythonPanel = document.getElementById('panel-python');
      expect(pythonPanel).toHaveAttribute('hidden');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to next tab with ArrowRight', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      tsTab.focus();
      fireEvent.keyDown(tsTab, { key: 'ArrowRight' });

      const pythonTab = screen.getByRole('tab', { name: 'Python' });
      expect(pythonTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should navigate to previous tab with ArrowLeft', () => {
      render(<CodeTabs tabs={mockTabs} defaultTab="python" />);

      const pythonTab = screen.getByRole('tab', { name: 'Python' });
      pythonTab.focus();
      fireEvent.keyDown(pythonTab, { key: 'ArrowLeft' });

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(tsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should wrap to last tab when pressing ArrowLeft on first tab', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      tsTab.focus();
      fireEvent.keyDown(tsTab, { key: 'ArrowLeft' });

      const curlTab = screen.getByRole('tab', { name: 'cURL' });
      expect(curlTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should wrap to first tab when pressing ArrowRight on last tab', () => {
      render(<CodeTabs tabs={mockTabs} defaultTab="curl" />);

      const curlTab = screen.getByRole('tab', { name: 'cURL' });
      curlTab.focus();
      fireEvent.keyDown(curlTab, { key: 'ArrowRight' });

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(tsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should navigate to first tab with Home key', () => {
      render(<CodeTabs tabs={mockTabs} defaultTab="curl" />);

      const curlTab = screen.getByRole('tab', { name: 'cURL' });
      curlTab.focus();
      fireEvent.keyDown(curlTab, { key: 'Home' });

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(tsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should navigate to last tab with End key', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      tsTab.focus();
      fireEvent.keyDown(tsTab, { key: 'End' });

      const curlTab = screen.getByRole('tab', { name: 'cURL' });
      expect(curlTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should not change tab for other keys', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      tsTab.focus();
      fireEvent.keyDown(tsTab, { key: 'Enter' });

      expect(tsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Copy Functionality', () => {
    it('should call copyToClipboard when copy button is clicked', async () => {
      const mockCopyToClipboard = vi.fn().mockResolvedValue(true);
      const { useClipboard } = await import('../../../../hooks/useClipboard');
      vi.mocked(useClipboard).mockReturnValue({
        copied: false,
        copyToClipboard: mockCopyToClipboard,
        error: null,
      });

      render(<CodeTabs tabs={mockTabs} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith('const hello = "world";');
      });
    });

    it('should show "Copied!" when copy is successful', async () => {
      const { useClipboard } = await import('../../../../hooks/useClipboard');
      vi.mocked(useClipboard).mockReturnValue({
        copied: true,
        copyToClipboard: vi.fn().mockResolvedValue(true),
        error: null,
      });

      render(<CodeTabs tabs={mockTabs} />);

      const copyButton = screen.getByRole('button', { name: /copied to clipboard/i });
      expect(copyButton).toHaveTextContent('Copied!');
    });

    it('should copy the active tab code', async () => {
      const mockCopyToClipboard = vi.fn().mockResolvedValue(true);
      const { useClipboard } = await import('../../../../hooks/useClipboard');
      vi.mocked(useClipboard).mockReturnValue({
        copied: false,
        copyToClipboard: mockCopyToClipboard,
        error: null,
      });

      render(<CodeTabs tabs={mockTabs} />);

      // Switch to Python tab
      const pythonTab = screen.getByRole('tab', { name: 'Python' });
      fireEvent.click(pythonTab);

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith('hello = "world"');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on tablist', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Code examples');
    });

    it('should have proper ARIA attributes on tabs', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(tsTab).toHaveAttribute('aria-selected', 'true');
      expect(tsTab).toHaveAttribute('aria-controls', 'panel-typescript');
      expect(tsTab).toHaveAttribute('id', 'tab-typescript');
    });

    it('should have proper ARIA attributes on tab panels', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('id', 'panel-typescript');
      expect(panel).toHaveAttribute('aria-labelledby', 'tab-typescript');
    });

    it('should have visible focus indicators', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(tsTab).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-accent-primary');
    });
  });

  describe('Reduced Motion', () => {
    it('should not apply transition classes when reduced motion is preferred', async () => {
      const { useReducedMotion } = await import('../../../../hooks/useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<CodeTabs tabs={mockTabs} />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(tsTab.className).not.toContain('transition');
    });

    it('should not apply fadeIn animation when reduced motion is preferred', async () => {
      const { useReducedMotion } = await import('../../../../hooks/useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<CodeTabs tabs={mockTabs} />);

      const panel = screen.getByRole('tabpanel');
      expect(panel.className).not.toContain('animate-fadeIn');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tabs array gracefully', () => {
      render(<CodeTabs tabs={[]} />);

      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    });

    it('should handle single tab', () => {
      const singleTab = [mockTabs[0]];
      render(<CodeTabs tabs={singleTab} />);

      const tab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(tab).toHaveAttribute('aria-selected', 'true');

      // Arrow keys should not change anything
      fireEvent.keyDown(tab, { key: 'ArrowRight' });
      expect(tab).toHaveAttribute('aria-selected', 'true');
    });

    it('should reset to first tab if active tab is removed', () => {
      const { rerender } = render(<CodeTabs tabs={mockTabs} defaultTab="python" />);

      const pythonTab = screen.getByRole('tab', { name: 'Python' });
      expect(pythonTab).toHaveAttribute('aria-selected', 'true');

      // Remove Python tab
      const newTabs = mockTabs.filter(tab => tab.id !== 'python');
      rerender(<CodeTabs tabs={newTabs} defaultTab="python" />);

      const tsTab = screen.getByRole('tab', { name: 'TypeScript' });
      expect(tsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should apply custom className', () => {
      const { container } = render(<CodeTabs tabs={mockTabs} className="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have horizontal scroll for mobile', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveClass('overflow-x-auto');
    });

    it('should prevent text wrapping in tabs', () => {
      render(<CodeTabs tabs={mockTabs} />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('whitespace-nowrap');
      });
    });
  });
});
