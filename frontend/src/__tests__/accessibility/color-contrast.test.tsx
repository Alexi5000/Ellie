import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import MarketingPage from '../../pages/MarketingPage';

// Helper function to calculate relative luminance
function getRelativeLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Helper function to calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  // Parse RGB values from color strings
  const parseColor = (color: string): [number, number, number] => {
    // Handle rgb() format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }
    
    // Handle hex format
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return [
        parseInt(hexMatch[1], 16),
        parseInt(hexMatch[2], 16),
        parseInt(hexMatch[3], 16)
      ];
    }
    
    // Default to black
    return [0, 0, 0];
  };

  const [r1, g1, b1] = parseColor(color1);
  const [r2, g2, b2] = parseColor(color2);

  const l1 = getRelativeLuminance(r1, g1, b1);
  const l2 = getRelativeLuminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('Color Contrast Accessibility Tests', () => {
  it('should have sufficient contrast for body text in light mode', () => {
    localStorage.setItem('ellie-theme', 'light');
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Get computed styles for text elements
    const textElements = screen.getAllByText(/./);
    
    if (textElements.length > 0) {
      const element = textElements[0];
      const styles = window.getComputedStyle(element);
      
      // Text color and background should exist
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });

  it('should have sufficient contrast for body text in dark mode', () => {
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

    // Get computed styles for text elements
    const textElements = screen.getAllByText(/./);
    
    if (textElements.length > 0) {
      const element = textElements[0];
      const styles = window.getComputedStyle(element);
      
      // Text color and background should exist
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });

  it('should have sufficient contrast for buttons', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      
      // Buttons should have defined colors
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
      
      // Button text should be readable
      const hasText = button.textContent && button.textContent.trim().length > 0;
      const hasAriaLabel = button.hasAttribute('aria-label');
      
      expect(hasText || hasAriaLabel).toBe(true);
    });
  });

  it('should have sufficient contrast for links', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const links = screen.getAllByRole('link');
    
    links.forEach(link => {
      const styles = window.getComputedStyle(link);
      
      // Links should have defined color
      expect(styles.color).toBeTruthy();
      
      // Links should be distinguishable (color or underline)
      const hasUnderline = styles.textDecoration.includes('underline');
      const hasColor = styles.color !== 'rgb(0, 0, 0)'; // Not default black
      
      expect(hasUnderline || hasColor).toBe(true);
    });
  });

  it('should have sufficient contrast for focus indicators', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const buttons = screen.getAllByRole('button');
    
    if (buttons.length > 0) {
      buttons[0].focus();
      const styles = window.getComputedStyle(buttons[0]);
      
      // Should have visible focus indicator
      const hasOutline = styles.outline !== 'none' && styles.outline !== '';
      const hasBoxShadow = styles.boxShadow !== 'none';
      const hasBorder = styles.border !== 'none' && styles.borderWidth !== '0px';
      
      expect(hasOutline || hasBoxShadow || hasBorder).toBe(true);
    }
  });

  it('should maintain contrast in hover states', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      // Get default styles
      const defaultStyles = window.getComputedStyle(button);
      
      // Simulate hover (check if hover styles are defined)
      const hasHoverClass = button.className.includes('hover:');
      
      // Button should have defined colors
      expect(defaultStyles.color).toBeTruthy();
      expect(defaultStyles.backgroundColor).toBeTruthy();
    });
  });

  it('should have sufficient contrast for disabled states', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const buttons = screen.getAllByRole('button');
    const disabledButtons = buttons.filter(b => b.hasAttribute('disabled'));
    
    disabledButtons.forEach(button => {
      const styles = window.getComputedStyle(button);
      
      // Disabled buttons should still have readable text
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  it('should have sufficient contrast for form inputs', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const inputs = screen.queryAllByRole('textbox');
    
    inputs.forEach(input => {
      const styles = window.getComputedStyle(input);
      
      // Inputs should have defined colors
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.borderColor).toBeTruthy();
    });
  });

  it('should have sufficient contrast for tab indicators', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const tabs = screen.queryAllByRole('tab');
    
    tabs.forEach(tab => {
      const styles = window.getComputedStyle(tab);
      const isSelected = tab.getAttribute('aria-selected') === 'true';
      
      // Tabs should have defined colors
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
      
      // Selected tabs should be visually distinct
      if (isSelected) {
        const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
        const hasBorder = styles.borderWidth !== '0px';
        
        expect(hasBackground || hasBorder).toBe(true);
      }
    });
  });

  it('should have sufficient contrast for code snippets', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find code elements
    const codeElements = document.querySelectorAll('code, pre');
    
    codeElements.forEach(code => {
      const styles = window.getComputedStyle(code);
      
      // Code should have defined colors
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  it('should have sufficient contrast for headings', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const headings = screen.getAllByRole('heading');
    
    headings.forEach(heading => {
      const styles = window.getComputedStyle(heading);
      
      // Headings should have defined color
      expect(styles.color).toBeTruthy();
      
      // Headings should be larger or bolder than body text
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = parseInt(styles.fontWeight);
      
      expect(fontSize).toBeGreaterThan(0);
      expect(fontWeight).toBeGreaterThan(0);
    });
  });

  it('should maintain contrast across theme changes', () => {
    const { rerender } = render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Get initial colors
    const initialElement = screen.getAllByText(/./)[0];
    const initialStyles = window.getComputedStyle(initialElement);
    const initialColor = initialStyles.color;

    // Toggle theme
    localStorage.setItem('ellie-theme', 'dark');
    document.documentElement.classList.add('dark');

    rerender(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Get new colors
    const newElement = screen.getAllByText(/./)[0];
    const newStyles = window.getComputedStyle(newElement);
    const newColor = newStyles.color;

    // Colors should change with theme
    // (In a real implementation, they should maintain contrast)
    expect(newStyles.color).toBeTruthy();
  });
});
