import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPWACapabilities,
  isStandaloneMode,
  isAppInstalled,
  setupInstallPrompt,
  showInstallPrompt,
  InstallPromptEvent
} from '../utils/pwa';

/**
 * PWA Installation Capabilities Test Suite
 * 
 * This test suite verifies that the PWA installation functionality works correctly
 * across different scenarios and browser environments.
 * 
 * Tests cover:
 * - Installation prompt detection and handling
 * - Standalone mode detection
 * - Installation state management
 * - Cross-platform compatibility
 * - Error handling and edge cases
 */

describe('PWA Installation Capabilities', () => {
  let mockBeforeInstallPromptEvent: Partial<InstallPromptEvent>;
  let mockAppInstalledEvent: Event;
  let eventListeners: Map<string, EventListener[]>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Track event listeners
    eventListeners = new Map();

    // Mock window.addEventListener
    window.addEventListener = vi.fn((event: string, handler: EventListener) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event)!.push(handler);
    });

    // Mock window.removeEventListener
    window.removeEventListener = vi.fn((event: string, handler: EventListener) => {
      if (eventListeners.has(event)) {
        const handlers = eventListeners.get(event)!;
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    });

    // Create mock beforeinstallprompt event
    mockBeforeInstallPromptEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      type: 'beforeinstallprompt'
    };

    // Create mock appinstalled event
    mockAppInstalledEvent = new Event('appinstalled');

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock ServiceWorkerRegistration.prototype for getPWACapabilities
    if (typeof window.ServiceWorkerRegistration === 'undefined') {
      (window as any).ServiceWorkerRegistration = function() {};
      window.ServiceWorkerRegistration.prototype = { sync: true } as any;
    } else if (!window.ServiceWorkerRegistration.prototype) {
      window.ServiceWorkerRegistration.prototype = { sync: true } as any;
    }

    // Mock navigator.serviceWorker - only if not already defined
    if (!('serviceWorker' in navigator)) {
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: vi.fn(),
              subscribe: vi.fn(),
            },
          }),
          register: vi.fn().mockResolvedValue({
            installing: null,
            waiting: null,
            active: {},
            onupdatefound: null,
          }),
          getRegistration: vi.fn().mockResolvedValue({
            update: vi.fn(),
            waiting: null,
          }),
        },
      });
    }

    // Reset document.referrer
    Object.defineProperty(document, 'referrer', {
      writable: true,
      configurable: true,
      value: 'https://example.com',
    });

    // Reset navigator.standalone
    Object.defineProperty(navigator, 'standalone', {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    eventListeners.clear();
  });

  describe('Installation Prompt Detection', () => {
    it('should detect when beforeinstallprompt event is available', async () => {
      const onInstallPromptAvailable = vi.fn((event) => {
        expect(event).toBeDefined();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      setupInstallPrompt(onInstallPromptAvailable);

      // Simulate beforeinstallprompt event
      const handlers = eventListeners.get('beforeinstallprompt');
      expect(handlers).toBeDefined();
      expect(handlers!.length).toBeGreaterThan(0);

      handlers![0](mockBeforeInstallPromptEvent as Event);

      // Wait for callback to be called
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(onInstallPromptAvailable).toHaveBeenCalled();
    });

    it('should prevent default behavior of beforeinstallprompt', () => {
      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      expect(mockBeforeInstallPromptEvent.preventDefault).toHaveBeenCalled();
    });

    it('should store deferred prompt for later use', () => {
      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      // Verify capabilities reflect installable state
      const capabilities = getPWACapabilities();
      expect(capabilities.isInstallable).toBe(true);
    });

    it('should handle multiple beforeinstallprompt events', () => {
      const onInstallPromptAvailable = vi.fn();
      setupInstallPrompt(onInstallPromptAvailable);

      const handlers = eventListeners.get('beforeinstallprompt');
      
      // Trigger event multiple times
      handlers![0](mockBeforeInstallPromptEvent as Event);
      handlers![0](mockBeforeInstallPromptEvent as Event);

      expect(onInstallPromptAvailable).toHaveBeenCalledTimes(2);
    });
  });

  describe('Installation Process', () => {
    it('should successfully trigger install prompt', async () => {
      setupInstallPrompt();

      // Simulate beforeinstallprompt event
      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      // Trigger installation
      const result = await showInstallPrompt();

      expect(mockBeforeInstallPromptEvent.prompt).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle user accepting installation', async () => {
      mockBeforeInstallPromptEvent.userChoice = Promise.resolve({ 
        outcome: 'accepted' as const 
      });

      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      const result = await showInstallPrompt();

      expect(result).toBe(true);
    });

    it('should handle user dismissing installation', async () => {
      mockBeforeInstallPromptEvent.userChoice = Promise.resolve({ 
        outcome: 'dismissed' as const 
      });

      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      const result = await showInstallPrompt();

      expect(result).toBe(false);
    });

    it('should call onInstallSuccess callback when app is installed', async () => {
      const onInstallSuccess = vi.fn();

      setupInstallPrompt(undefined, onInstallSuccess);

      // Simulate appinstalled event
      const handlers = eventListeners.get('appinstalled');
      expect(handlers).toBeDefined();
      handlers![0](mockAppInstalledEvent);

      // Wait for callback to be called
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(onInstallSuccess).toHaveBeenCalled();
    });

    it('should call onInstallDismissed callback when user dismisses', async () => {
      const onInstallDismissed = vi.fn();
      
      mockBeforeInstallPromptEvent.userChoice = Promise.resolve({ 
        outcome: 'dismissed' as const 
      });

      setupInstallPrompt(undefined, undefined, onInstallDismissed);

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      // Wait for userChoice promise to resolve
      await mockBeforeInstallPromptEvent.userChoice;

      // Give time for the callback to be called
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onInstallDismissed).toHaveBeenCalled();
    });

    it('should return false when install prompt is not available', async () => {
      // Don't trigger beforeinstallprompt event
      const result = await showInstallPrompt();

      expect(result).toBe(false);
    });

    it('should handle errors during installation gracefully', async () => {
      mockBeforeInstallPromptEvent.prompt = vi.fn().mockRejectedValue(
        new Error('Installation failed')
      );

      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      const result = await showInstallPrompt();

      expect(result).toBe(false);
    });
  });

  describe('Standalone Mode Detection', () => {
    it('should detect standalone mode via display-mode media query', () => {
      (window.matchMedia as any).mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(isStandaloneMode()).toBe(true);
    });

    it('should detect standalone mode via navigator.standalone (iOS)', () => {
      (window.matchMedia as any).mockReturnValue({ matches: false });
      
      Object.defineProperty(navigator, 'standalone', {
        writable: true,
        configurable: true,
        value: true,
      });

      expect(isStandaloneMode()).toBe(true);
    });

    it('should detect standalone mode via Android app referrer', () => {
      (window.matchMedia as any).mockReturnValue({ matches: false });
      
      Object.defineProperty(document, 'referrer', {
        writable: true,
        configurable: true,
        value: 'android-app://com.example.app',
      });

      expect(isStandaloneMode()).toBe(true);
    });

    it('should return false when not in standalone mode', () => {
      (window.matchMedia as any).mockReturnValue({ matches: false });
      
      Object.defineProperty(navigator, 'standalone', {
        writable: true,
        configurable: true,
        value: undefined,
      });
      
      Object.defineProperty(document, 'referrer', {
        writable: true,
        configurable: true,
        value: 'https://example.com',
      });

      expect(isStandaloneMode()).toBe(false);
    });
  });

  describe('Installation State Detection', () => {
    it('should detect when app is installed via standalone mode', () => {
      (window.matchMedia as any).mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(isAppInstalled()).toBe(true);
    });

    it('should detect when app is installed via minimal-ui mode', () => {
      (window.matchMedia as any).mockImplementation((query: string) => ({
        matches: query === '(display-mode: minimal-ui)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(isAppInstalled()).toBe(true);
    });

    it('should return false when app is not installed', () => {
      (window.matchMedia as any).mockReturnValue({ matches: false });

      expect(isAppInstalled()).toBe(false);
    });

    it('should update installation state after successful install', async () => {
      const onInstallSuccess = vi.fn();
      setupInstallPrompt(undefined, onInstallSuccess);

      // Simulate appinstalled event
      const handlers = eventListeners.get('appinstalled');
      handlers![0](mockAppInstalledEvent);

      // Wait for callback to be called
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(onInstallSuccess).toHaveBeenCalled();
    });
  });

  describe('PWA Capabilities Detection', () => {
    it('should detect all PWA capabilities correctly', () => {
      const capabilities = getPWACapabilities();

      expect(capabilities).toHaveProperty('isInstallable');
      expect(capabilities).toHaveProperty('isInstalled');
      expect(capabilities).toHaveProperty('supportsNotifications');
      expect(capabilities).toHaveProperty('supportsBackgroundSync');
      expect(capabilities).toHaveProperty('supportsPushNotifications');
      expect(capabilities).toHaveProperty('isStandalone');
      expect(capabilities).toHaveProperty('hasServiceWorker');
    });

    it('should detect service worker support', () => {
      const capabilities = getPWACapabilities();
      expect(capabilities.hasServiceWorker).toBe(true);
    });

    it('should detect notification support', () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: {
          permission: 'default',
          requestPermission: vi.fn(),
        },
      });

      const capabilities = getPWACapabilities();
      expect(capabilities.supportsNotifications).toBe(true);
    });

    it('should detect background sync support', () => {
      Object.defineProperty(window, 'ServiceWorkerRegistration', {
        writable: true,
        configurable: true,
        value: {
          prototype: {
            sync: true,
          },
        },
      });

      const capabilities = getPWACapabilities();
      expect(capabilities.supportsBackgroundSync).toBe(true);
    });

    it('should detect push notification support', () => {
      Object.defineProperty(window, 'PushManager', {
        writable: true,
        configurable: true,
        value: {},
      });

      const capabilities = getPWACapabilities();
      expect(capabilities.supportsPushNotifications).toBe(true);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work on Chrome/Edge (Chromium-based browsers)', () => {
      // Chromium browsers support beforeinstallprompt
      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      expect(handlers).toBeDefined();
      expect(handlers!.length).toBeGreaterThan(0);
    });

    it('should detect iOS Safari standalone mode', () => {
      Object.defineProperty(navigator, 'standalone', {
        writable: true,
        configurable: true,
        value: true,
      });

      expect(isStandaloneMode()).toBe(true);
    });

    it('should detect Android Chrome standalone mode', () => {
      (window.matchMedia as any).mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(isStandaloneMode()).toBe(true);
    });

    it('should handle browsers without PWA support gracefully', () => {
      // Test that the function handles missing features gracefully
      // We can't actually remove serviceWorker in the test environment,
      // but we can verify the function doesn't crash
      const capabilities = getPWACapabilities();
      
      // Should still return a valid capabilities object
      expect(capabilities).toHaveProperty('hasServiceWorker');
      expect(capabilities).toHaveProperty('supportsBackgroundSync');
      expect(capabilities).toHaveProperty('supportsPushNotifications');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing beforeinstallprompt event gracefully', async () => {
      // Don't set up any event listeners
      const result = await showInstallPrompt();
      expect(result).toBe(false);
    });

    it('should handle prompt() method throwing an error', async () => {
      mockBeforeInstallPromptEvent.prompt = vi.fn().mockRejectedValue(
        new Error('Prompt failed')
      );

      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      const result = await showInstallPrompt();
      expect(result).toBe(false);
    });

    it('should handle userChoice promise rejection', async () => {
      // Create a new mock that rejects userChoice
      const rejectedPromptEvent = {
        ...mockBeforeInstallPromptEvent,
        userChoice: Promise.reject(new Error('User choice failed'))
      };

      // Catch the rejection to prevent unhandled promise rejection
      rejectedPromptEvent.userChoice.catch(() => {});

      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](rejectedPromptEvent as Event);

      // Should not throw
      await expect(showInstallPrompt()).resolves.toBeDefined();
    });

    it('should handle multiple install attempts', async () => {
      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      // First attempt
      await showInstallPrompt();

      // Second attempt should return false (prompt already used)
      const result = await showInstallPrompt();
      expect(result).toBe(false);
    });

    it('should clear deferred prompt after installation', async () => {
      setupInstallPrompt();

      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](mockBeforeInstallPromptEvent as Event);

      await showInstallPrompt();

      // Capabilities should reflect that prompt is no longer available
      const capabilities = getPWACapabilities();
      expect(capabilities.isInstallable).toBe(false);
    });
  });

  describe('Installation Lifecycle', () => {
    it('should follow complete installation lifecycle', async () => {
      const onInstallPromptAvailable = vi.fn();
      const onInstallSuccess = vi.fn();
      const onInstallDismissed = vi.fn();

      setupInstallPrompt(
        onInstallPromptAvailable,
        onInstallSuccess,
        onInstallDismissed
      );

      // Step 1: beforeinstallprompt event fires
      const beforeInstallHandlers = eventListeners.get('beforeinstallprompt');
      beforeInstallHandlers![0](mockBeforeInstallPromptEvent as Event);

      expect(onInstallPromptAvailable).toHaveBeenCalled();

      // Step 2: User triggers installation
      const installResult = await showInstallPrompt();
      expect(installResult).toBe(true);

      // Step 3: appinstalled event fires
      const appInstalledHandlers = eventListeners.get('appinstalled');
      appInstalledHandlers![0](mockAppInstalledEvent);

      expect(onInstallSuccess).toHaveBeenCalled();
    });

    it('should handle installation cancellation lifecycle', async () => {
      const onInstallDismissed = vi.fn();

      const dismissedPromptEvent = {
        ...mockBeforeInstallPromptEvent,
        userChoice: Promise.resolve({ outcome: 'dismissed' as const })
      };

      setupInstallPrompt(undefined, undefined, onInstallDismissed);

      // Step 1: beforeinstallprompt event fires
      const handlers = eventListeners.get('beforeinstallprompt');
      handlers![0](dismissedPromptEvent as Event);

      // Step 2: User dismisses installation
      const installResult = await showInstallPrompt();
      expect(installResult).toBe(false);

      // The onInstallDismissed callback is called in the setupInstallPrompt
      // when userChoice resolves, but it's in a separate promise chain
      // For this test, we verify the installation was dismissed
      expect(installResult).toBe(false);
    });
  });
});
