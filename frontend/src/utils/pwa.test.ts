import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPWACapabilities,
  isStandaloneMode,
  isAppInstalled,
  requestNotificationPermission,
  showNotification,
  isOnline,
  setupNetworkListeners
} from './pwa';

// Mock window and navigator properties
const mockWindow = {
  matchMedia: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  Notification: {
    permission: 'default' as NotificationPermission,
    requestPermission: vi.fn()
  }
};

const mockNavigator = {
  onLine: true,
  serviceWorker: {
    ready: Promise.resolve({
      pushManager: {
        getSubscription: vi.fn(),
        subscribe: vi.fn()
      }
    })
  }
};

describe('PWA utilities', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup window mocks
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockWindow.matchMedia
    });

    Object.defineProperty(window, 'addEventListener', {
      writable: true,
      value: mockWindow.addEventListener
    });

    Object.defineProperty(window, 'removeEventListener', {
      writable: true,
      value: mockWindow.removeEventListener
    });

    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: mockWindow.Notification
    });

    // Setup navigator mocks
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: mockNavigator.onLine
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: mockNavigator.serviceWorker
    });

    // Default matchMedia behavior
    mockWindow.matchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPWACapabilities', () => {
    it('returns comprehensive PWA capabilities', () => {
      // Mock various capabilities
      mockWindow.matchMedia.mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      const capabilities = getPWACapabilities();

      expect(capabilities).toHaveProperty('isInstallable');
      expect(capabilities).toHaveProperty('isInstalled');
      expect(capabilities).toHaveProperty('supportsNotifications');
      expect(capabilities).toHaveProperty('supportsBackgroundSync');
      expect(capabilities).toHaveProperty('supportsPushNotifications');
      expect(capabilities).toHaveProperty('isStandalone');
      expect(capabilities).toHaveProperty('hasServiceWorker');
    });

    it('detects notification support correctly', () => {
      const capabilities = getPWACapabilities();
      expect(capabilities.supportsNotifications).toBe(true);

      // Test without Notification API
      delete (window as any).Notification;
      const capabilitiesWithoutNotifications = getPWACapabilities();
      expect(capabilitiesWithoutNotifications.supportsNotifications).toBe(false);
    });

    it('detects service worker support correctly', () => {
      const capabilities = getPWACapabilities();
      expect(capabilities.hasServiceWorker).toBe(true);

      // Test without service worker
      delete (navigator as any).serviceWorker;
      const capabilitiesWithoutSW = getPWACapabilities();
      expect(capabilitiesWithoutSW.hasServiceWorker).toBe(false);
    });
  });

  describe('isStandaloneMode', () => {
    it('detects standalone mode via display-mode media query', () => {
      mockWindow.matchMedia.mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      expect(isStandaloneMode()).toBe(true);
    });

    it('detects standalone mode via navigator.standalone', () => {
      mockWindow.matchMedia.mockReturnValue({ matches: false });
      (navigator as any).standalone = true;

      expect(isStandaloneMode()).toBe(true);
    });

    it('detects standalone mode via Android app referrer', () => {
      mockWindow.matchMedia.mockReturnValue({ matches: false });
      Object.defineProperty(document, 'referrer', {
        value: 'android-app://com.example.app',
        writable: true
      });

      expect(isStandaloneMode()).toBe(true);
    });

    it('returns false when not in standalone mode', () => {
      mockWindow.matchMedia.mockReturnValue({ matches: false });
      delete (navigator as any).standalone;
      Object.defineProperty(document, 'referrer', {
        value: 'https://example.com',
        writable: true
      });

      expect(isStandaloneMode()).toBe(false);
    });
  });

  describe('isAppInstalled', () => {
    it('returns true when in standalone mode', () => {
      mockWindow.matchMedia.mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      expect(isAppInstalled()).toBe(true);
    });

    it('returns true when in minimal-ui mode', () => {
      mockWindow.matchMedia.mockImplementation((query) => ({
        matches: query === '(display-mode: minimal-ui)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      expect(isAppInstalled()).toBe(true);
    });

    it('returns false when not installed', () => {
      mockWindow.matchMedia.mockReturnValue({ matches: false });

      expect(isAppInstalled()).toBe(false);
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns granted when permission is already granted', async () => {
      mockWindow.Notification.permission = 'granted';

      const permission = await requestNotificationPermission();
      expect(permission).toBe('granted');
      expect(mockWindow.Notification.requestPermission).not.toHaveBeenCalled();
    });

    it('returns denied when permission is denied', async () => {
      mockWindow.Notification.permission = 'denied';

      const permission = await requestNotificationPermission();
      expect(permission).toBe('denied');
      expect(mockWindow.Notification.requestPermission).not.toHaveBeenCalled();
    });

    it('requests permission when default', async () => {
      mockWindow.Notification.permission = 'default';
      mockWindow.Notification.requestPermission.mockResolvedValue('granted');

      const permission = await requestNotificationPermission();
      expect(permission).toBe('granted');
      expect(mockWindow.Notification.requestPermission).toHaveBeenCalled();
    });

    it('handles permission request errors', async () => {
      mockWindow.Notification.permission = 'default';
      mockWindow.Notification.requestPermission.mockRejectedValue(new Error('Permission error'));

      const permission = await requestNotificationPermission();
      expect(permission).toBe('denied');
    });

    it('returns denied when Notification API is not supported', async () => {
      delete (window as any).Notification;

      const permission = await requestNotificationPermission();
      expect(permission).toBe('denied');
    });
  });

  describe('showNotification', () => {
    beforeEach(() => {
      // Mock Notification constructor
      global.Notification = vi.fn().mockImplementation((title, options) => ({
        title,
        options,
        onclick: null,
        close: vi.fn()
      }));
      
      mockWindow.Notification.permission = 'granted';
    });

    it('shows notification when permission is granted', async () => {
      const notification = await showNotification('Test Title', { body: 'Test Body' });

      expect(notification).toBeDefined();
      expect(global.Notification).toHaveBeenCalledWith('Test Title', expect.objectContaining({
        body: 'Test Body',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200]
      }));
    });

    it('rejects when permission is not granted', async () => {
      mockWindow.Notification.permission = 'denied';

      await expect(showNotification('Test Title')).rejects.toThrow('Notification permission not granted');
    });

    it('rejects when Notification API is not supported', async () => {
      delete (window as any).Notification;

      await expect(showNotification('Test Title')).rejects.toThrow('Notifications not supported');
    });

    it('handles notification creation errors', async () => {
      global.Notification = vi.fn().mockImplementation(() => {
        throw new Error('Notification creation failed');
      });

      await expect(showNotification('Test Title')).rejects.toThrow('Notification creation failed');
    });
  });

  describe('isOnline', () => {
    it('returns true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      expect(isOnline()).toBe(true);
    });

    it('returns false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      expect(isOnline()).toBe(false);
    });
  });

  describe('setupNetworkListeners', () => {
    it('sets up online and offline event listeners', () => {
      const onOnline = vi.fn();
      const onOffline = vi.fn();

      const cleanup = setupNetworkListeners(onOnline, onOffline);

      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

      // Test cleanup
      cleanup();
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('calls onOnline callback when online event fires', () => {
      const onOnline = vi.fn();
      const onOffline = vi.fn();

      setupNetworkListeners(onOnline, onOffline);

      // Get the online event handler
      const onlineHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];

      // Simulate online event
      if (onlineHandler) {
        onlineHandler();
        expect(onOnline).toHaveBeenCalled();
      }
    });

    it('calls onOffline callback when offline event fires', () => {
      const onOnline = vi.fn();
      const onOffline = vi.fn();

      setupNetworkListeners(onOnline, onOffline);

      // Get the offline event handler
      const offlineHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];

      // Simulate offline event
      if (offlineHandler) {
        offlineHandler();
        expect(onOffline).toHaveBeenCalled();
      }
    });

    it('works without callbacks', () => {
      expect(() => setupNetworkListeners()).not.toThrow();
    });
  });
});