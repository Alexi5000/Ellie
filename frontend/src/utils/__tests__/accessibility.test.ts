import {
  createFocusTrap,
  announceToScreenReader,
  isElementFocusable,
  getNextFocusableElement,
  restoreFocus,
  generateA11yId,
  prefersReducedMotion,
  prefersHighContrast,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  preventBodyScroll,
  getAccessibleName,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('createFocusTrap', () => {
    it('should trap focus within container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const cleanup = createFocusTrap(container);

      // First element should be focused
      expect(document.activeElement).toBe(button1);

      cleanup();
      document.body.removeChild(container);
    });

    it('should handle Tab key to cycle through elements', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const cleanup = createFocusTrap(container);

      // Simulate Tab key
      button1.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(tabEvent);

      cleanup();
      document.body.removeChild(container);
    });
  });

  describe('announceToScreenReader', () => {
    it('should create ARIA live region', () => {
      announceToScreenReader('Test message');

      const liveRegion = document.getElementById('aria-live-region-polite');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce message with assertive priority', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const liveRegion = document.getElementById('aria-live-region-assertive');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should update message content', async () => {
      announceToScreenReader('First message');

      await new Promise(resolve => setTimeout(resolve, 150));

      const liveRegion = document.getElementById('aria-live-region-polite');
      expect(liveRegion?.textContent).toBe('First message');
    });
  });

  describe('isElementFocusable', () => {
    it('should return true for visible button', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      expect(isElementFocusable(button)).toBe(true);

      document.body.removeChild(button);
    });

    it('should return false for disabled button', () => {
      const button = document.createElement('button');
      button.disabled = true;
      document.body.appendChild(button);

      expect(isElementFocusable(button)).toBe(false);

      document.body.removeChild(button);
    });

    it('should return false for element with negative tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '-1');
      document.body.appendChild(div);

      expect(isElementFocusable(div)).toBe(false);

      document.body.removeChild(div);
    });

    it('should return false for hidden element', () => {
      const button = document.createElement('button');
      button.style.display = 'none';
      document.body.appendChild(button);

      expect(isElementFocusable(button)).toBe(false);

      document.body.removeChild(button);
    });
  });

  describe('getNextFocusableElement', () => {
    it('should return next focusable element', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      document.body.appendChild(button1);
      document.body.appendChild(button2);

      const next = getNextFocusableElement(button1);
      expect(next).toBe(button2);

      document.body.removeChild(button1);
      document.body.removeChild(button2);
    });

    it('should return previous focusable element when reverse is true', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      document.body.appendChild(button1);
      document.body.appendChild(button2);

      const prev = getNextFocusableElement(button2, true);
      expect(prev).toBe(button1);

      document.body.removeChild(button1);
      document.body.removeChild(button2);
    });
  });

  describe('restoreFocus', () => {
    it('should restore focus to element', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      restoreFocus(button);
      expect(document.activeElement).toBe(button);

      document.body.removeChild(button);
    });

    it('should not throw error for null element', () => {
      expect(() => restoreFocus(null)).not.toThrow();
    });
  });

  describe('generateA11yId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateA11yId();
      const id2 = generateA11yId();

      expect(id1).not.toBe(id2);
      expect(id1).toContain('a11y');
      expect(id2).toContain('a11y');
    });

    it('should use custom prefix', () => {
      const id = generateA11yId('custom');
      expect(id).toContain('custom');
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false when motion is not reduced', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      expect(prefersReducedMotion()).toBe(false);
    });

    it('should return true when motion is reduced', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe('prefersHighContrast', () => {
    it('should return false when high contrast is not preferred', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      expect(prefersHighContrast()).toBe(false);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#000000', '#000000');
      expect(ratio).toBeCloseTo(1, 0);
    });

    it('should handle colors without # prefix', () => {
      const ratio = getContrastRatio('000000', 'ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should return true for black text on white background', () => {
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
    });

    it('should return false for low contrast colors', () => {
      expect(meetsWCAGAA('#cccccc', '#ffffff')).toBe(false);
    });

    it('should use different threshold for large text', () => {
      // A contrast ratio that meets AA for large text but not normal text
      expect(meetsWCAGAA('#767676', '#ffffff', true)).toBe(true);
      expect(meetsWCAGAA('#767676', '#ffffff', false)).toBe(false);
    });
  });

  describe('meetsWCAGAAA', () => {
    it('should return true for black text on white background', () => {
      expect(meetsWCAGAAA('#000000', '#ffffff')).toBe(true);
    });

    it('should return false for colors that meet AA but not AAA', () => {
      // A contrast ratio between 4.5 and 7
      expect(meetsWCAGAAA('#595959', '#ffffff')).toBe(false);
    });
  });

  describe('preventBodyScroll', () => {
    it('should prevent body scroll', () => {
      preventBodyScroll(true);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll', () => {
      preventBodyScroll(true);
      preventBodyScroll(false);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('getAccessibleName', () => {
    it('should return aria-label', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close dialog');
      
      expect(getAccessibleName(button)).toBe('Close dialog');
    });

    it('should return text from aria-labelledby', () => {
      const label = document.createElement('span');
      label.id = 'label-id';
      label.textContent = 'Label text';
      document.body.appendChild(label);

      const button = document.createElement('button');
      button.setAttribute('aria-labelledby', 'label-id');
      
      expect(getAccessibleName(button)).toBe('Label text');

      document.body.removeChild(label);
    });

    it('should return text content', () => {
      const button = document.createElement('button');
      button.textContent = 'Button text';
      
      expect(getAccessibleName(button)).toBe('Button text');
    });

    it('should prioritize aria-label over text content', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Accessible name');
      button.textContent = 'Visual text';
      
      expect(getAccessibleName(button)).toBe('Accessible name');
    });
  });
});
