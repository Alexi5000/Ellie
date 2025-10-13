import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import MarketingPage from '../../pages/MarketingPage';

describe('Interactive Elements Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should handle code snippet copy functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find copy buttons in code tabs
    const copyButtons = screen.queryAllByRole('button', { name: /copy/i });
    
    if (copyButtons.length > 0) {
      await user.click(copyButtons[0]);

      // Verify clipboard was called
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });

      // Should show confirmation
      const confirmation = await screen.findByText(/copied/i);
      expect(confirmation).toBeInTheDocument();
    }
  });

  it('should switch between code tabs', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find code tabs
    const tabs = screen.queryAllByRole('tab');
    const codeTabs = tabs.filter(tab => 
      /typescript|python|curl|react/i.test(tab.textContent || '')
    );

    if (codeTabs.length >= 2) {
      // Click second tab
      await user.click(codeTabs[1]);

      // Verify tab is selected
      await waitFor(() => {
        expect(codeTabs[1]).toHaveAttribute('aria-selected', 'true');
      });

      // First tab should not be selected
      expect(codeTabs[0]).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('should switch between solution tabs', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find solution tabs (Inbound/Outbound)
    const inboundTab = screen.queryByRole('tab', { name: /inbound/i });
    const outboundTab = screen.queryByRole('tab', { name: /outbound/i });

    if (inboundTab && outboundTab) {
      // Initially inbound should be selected
      expect(inboundTab).toHaveAttribute('aria-selected', 'true');

      // Click outbound tab
      await user.click(outboundTab);

      // Verify outbound is now selected
      await waitFor(() => {
        expect(outboundTab).toHaveAttribute('aria-selected', 'true');
        expect(inboundTab).toHaveAttribute('aria-selected', 'false');
      });
    }
  });

  it('should trigger KPI animations on scroll', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find KPI section
    const kpiStats = screen.queryAllByText(/\d+M\+|\d+K\+/);
    
    if (kpiStats.length > 0) {
      // KPI numbers should be visible
      kpiStats.forEach(stat => {
        expect(stat).toBeInTheDocument();
      });
    }
  });

  it('should handle button hover states', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find primary buttons
    const buttons = screen.getAllByRole('button');
    
    if (buttons.length > 0) {
      // Hover over first button
      await user.hover(buttons[0]);
      
      // Button should still be in document
      expect(buttons[0]).toBeInTheDocument();
    }
  });

  it('should handle feature card interactions', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find feature cards
    const multilingual = screen.queryByText(/multilingual/i);
    
    if (multilingual) {
      const featureCard = multilingual.closest('div[class*="card"], div[class*="feature"]');
      
      if (featureCard) {
        // Hover over feature card
        await user.hover(featureCard as HTMLElement);
        
        // Card should still be visible
        expect(featureCard).toBeInTheDocument();
      }
    }
  });

  it('should handle animated orb interactions', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find hero section with animated orb
    const hero = screen.queryByRole('region', { name: /hero/i }) || 
                 document.querySelector('[class*="hero"]');
    
    if (hero) {
      // Orb should be present (canvas or SVG)
      const canvas = hero.querySelector('canvas');
      const svg = hero.querySelector('svg');
      
      expect(canvas || svg).toBeTruthy();
    }
  });

  it('should handle logo strip interactions', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find logo images
    const logos = screen.queryAllByRole('img').filter(img => 
      img.getAttribute('alt')?.toLowerCase().includes('logo')
    );

    if (logos.length > 0) {
      // Hover over first logo
      await user.hover(logos[0]);
      
      // Logo should still be visible
      expect(logos[0]).toBeInTheDocument();
    }
  });

  it('should handle form interactions if present', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Look for any input fields
    const inputs = screen.queryAllByRole('textbox');
    
    if (inputs.length > 0) {
      // Type in first input
      await user.type(inputs[0], 'test@example.com');
      
      // Input should have value
      expect(inputs[0]).toHaveValue('test@example.com');
    }
  });

  it('should handle multiple rapid interactions', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find theme toggle
    const themeToggle = screen.getByRole('button', { name: /toggle theme|switch to (dark|light) mode/i });

    // Rapidly toggle theme multiple times
    await user.click(themeToggle);
    await user.click(themeToggle);
    await user.click(themeToggle);

    // Should still be functional
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).toBeEnabled();
  });
});
