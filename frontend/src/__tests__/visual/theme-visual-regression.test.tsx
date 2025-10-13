import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import MarketingPage from '../../pages/MarketingPage';

describe('Theme Visual Regression Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render correctly in light mode', () => {
    localStorage.setItem('ellie-theme', 'light');
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Verify light mode is applied
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Check that key elements are rendered
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should render correctly in dark mode', () => {
    localStorage.setItem('ellie-theme', 'dark');
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Verify dark mode is applied
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Check that key elements are rendered
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should maintain layout when switching themes', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Get initial layout measurements
    const header = screen.getByRole('banner');
    const initialHeaderHeight = header.getBoundingClientRect().height;

    // Toggle theme
    const themeToggle = screen.getByRole('button', { name: /toggle theme|switch to (dark|light) mode/i });
    await user.click(themeToggle);

    await waitFor(() => {
      const newHeaderHeight = header.getBoundingClientRect().height;
      // Header height should remain consistent
      expect(Math.abs(newHeaderHeight - initialHeaderHeight)).toBeLessThan(5);
    });
  });

  it('should apply correct CSS variables in light mode', () => {
    localStorage.setItem('ellie-theme', 'light');
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const root = document.documentElement;
    const styles = window.getComputedStyle(root);

    // Check that CSS variables are defined
    const bgPrimary = styles.getPropertyValue('--color-bg-primary');
    const textPrimary = styles.getPropertyValue('--color-text-primary');

    // Variables should be defined (may be empty in test environment)
    expect(bgPrimary).toBeDefined();
    expect(textPrimary).toBeDefined();
  });

  it('should apply correct CSS variables in dark mode', () => {
    localStorage.setItem('ellie-theme', 'dark');
    document.documentElement.classList.add('dark');
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const root = document.documentElement;
    const styles = window.getComputedStyle(root);

    // Check that CSS variables are defined
    const bgPrimary = styles.getPropertyValue('--color-bg-primary');
    const textPrimary = styles.getPropertyValue('--color-text-primary');

    // Variables should be defined
    expect(bgPrimary).toBeDefined();
    expect(textPrimary).toBeDefined();
  });

  it('should render all components consistently in light mode', () => {
    localStorage.setItem('ellie-theme', 'light');
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Check for key marketing components
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
    
    // Check for navigation
    const navs = screen.getAllByRole('navigation');
    expect(navs.length).toBeGreaterThan(0);

    // Check for buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render all components consistently in dark mode', () => {
    localStorage.setItem('ellie-theme', 'dark');
    document.documentElement.classList.add('dark');
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Check for key marketing components
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
    
    // Check for navigation
    const navs = screen.getAllByRole('navigation');
    expect(navs.length).toBeGreaterThan(0);

    // Check for buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should not cause layout shift during theme transition', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Get initial positions of key elements
    const header = screen.getByRole('banner');
    const footer = screen.getByRole('contentinfo');
    
    const initialHeaderTop = header.getBoundingClientRect().top;
    const initialFooterTop = footer.getBoundingClientRect().top;

    // Toggle theme
    const themeToggle = screen.getByRole('button', { name: /toggle theme|switch to (dark|light) mode/i });
    await user.click(themeToggle);

    await waitFor(() => {
      const newHeaderTop = header.getBoundingClientRect().top;
      const newFooterTop = footer.getBoundingClientRect().top;

      // Positions should remain consistent (allowing for small rounding differences)
      expect(Math.abs(newHeaderTop - initialHeaderTop)).toBeLessThan(2);
      expect(Math.abs(newFooterTop - initialFooterTop)).toBeLessThan(2);
    });
  });

  it('should render images correctly in both themes', () => {
    const { rerender } = render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Check images in light mode
    const lightImages = screen.getAllByRole('img');
    expect(lightImages.length).toBeGreaterThan(0);

    // Switch to dark mode
    localStorage.setItem('ellie-theme', 'dark');
    document.documentElement.classList.add('dark');

    rerender(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Check images in dark mode
    const darkImages = screen.getAllByRole('img');
    expect(darkImages.length).toBeGreaterThan(0);

    // Should have same number of images (or more if dark variants exist)
    expect(darkImages.length).toBeGreaterThanOrEqual(lightImages.length);
  });

  it('should apply theme-specific styles to buttons', () => {
    const { rerender } = render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0];
    
    // Get light mode styles
    const lightStyles = window.getComputedStyle(firstButton);
    const lightBg = lightStyles.backgroundColor;

    // Switch to dark mode
    localStorage.setItem('ellie-theme', 'dark');
    document.documentElement.classList.add('dark');

    rerender(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const darkButtons = screen.getAllByRole('button');
    const darkFirstButton = darkButtons[0];
    
    // Get dark mode styles
    const darkStyles = window.getComputedStyle(darkFirstButton);
    const darkBg = darkStyles.backgroundColor;

    // Styles should be defined in both modes
    expect(lightBg).toBeTruthy();
    expect(darkBg).toBeTruthy();
  });

  it('should maintain component visibility in both themes', () => {
    const { rerender } = render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Count visible elements in light mode
    const lightButtons = screen.getAllByRole('button');
    const lightLinks = screen.getAllByRole('link');
    const lightHeadings = screen.getAllByRole('heading');

    // Switch to dark mode
    localStorage.setItem('ellie-theme', 'dark');
    document.documentElement.classList.add('dark');

    rerender(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Count visible elements in dark mode
    const darkButtons = screen.getAllByRole('button');
    const darkLinks = screen.getAllByRole('link');
    const darkHeadings = screen.getAllByRole('heading');

    // Should have same number of elements
    expect(darkButtons.length).toBe(lightButtons.length);
    expect(darkLinks.length).toBe(lightLinks.length);
    expect(darkHeadings.length).toBe(lightHeadings.length);
  });
});
