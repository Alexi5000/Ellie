import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { MarketingPage } from '../../pages/MarketingPage';

describe('Theme Switching Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should toggle theme across all marketing components', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Initially should be in light mode (or system preference)
    const html = document.documentElement;
    const initialTheme = html.classList.contains('dark') ? 'dark' : 'light';

    // Find and click theme toggle button
    const themeToggle = screen.getByRole('button', { name: /toggle theme|switch to (dark|light) mode/i });
    await userEvent.click(themeToggle);

    // Wait for theme to change
    await waitFor(() => {
      const newTheme = html.classList.contains('dark') ? 'dark' : 'light';
      expect(newTheme).not.toBe(initialTheme);
    });

    // Verify theme persists in localStorage
    const storedTheme = localStorage.getItem('ellie-theme');
    expect(storedTheme).toBeTruthy();
  });

  it('should persist theme preference across page reloads', async () => {
    // Set theme in localStorage
    localStorage.setItem('ellie-theme', 'dark');

    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Verify dark theme is applied
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should respect system preference when no stored theme', () => {
    // Mock system preference for dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Should apply dark theme based on system preference
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should apply theme transitions smoothly', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const themeToggle = screen.getByRole('button', { name: /toggle theme|switch to (dark|light) mode/i });
    
    // Toggle theme multiple times
    await userEvent.click(themeToggle);
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await userEvent.click(themeToggle);
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  it('should maintain theme state when navigating between sections', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Toggle to dark theme
    const themeToggle = screen.getByRole('button', { name: /toggle theme|switch to (dark|light) mode/i });
    await userEvent.click(themeToggle);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    // Scroll to different sections (simulating navigation)
    const featuresSection = screen.queryByText(/multilingual/i)?.closest('section');
    if (featuresSection) {
      featuresSection.scrollIntoView();
    }

    // Theme should still be dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
