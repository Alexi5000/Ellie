// PWA utilities for enhanced mobile app experience

export interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  supportsNotifications: boolean;
  supportsBackgroundSync: boolean;
  supportsPushNotifications: boolean;
  isStandalone: boolean;
  hasServiceWorker: boolean;
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: InstallPromptEvent | null = null;

/**
 * Gets comprehensive PWA capabilities of the current environment
 */
export const getPWACapabilities = (): PWACapabilities => {
  return {
    isInstallable: deferredPrompt !== null,
    isInstalled: isAppInstalled(),
    supportsNotifications: 'Notification' in window,
    supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    supportsPushNotifications: 'serviceWorker' in navigator && 'PushManager' in window,
    isStandalone: isStandaloneMode(),
    hasServiceWorker: 'serviceWorker' in navigator
  };
};

/**
 * Checks if the app is running in standalone mode (installed as PWA)
 */
export const isStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

/**
 * Checks if the app is installed as a PWA
 */
export const isAppInstalled = (): boolean => {
  return isStandaloneMode() || 
         window.matchMedia('(display-mode: minimal-ui)').matches;
};

/**
 * Sets up PWA install prompt handling
 */
export const setupInstallPrompt = (
  onInstallPromptAvailable?: (event: InstallPromptEvent) => void,
  onInstallSuccess?: () => void,
  onInstallDismissed?: () => void
) => {
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt available');
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
    
    if (onInstallPromptAvailable) {
      onInstallPromptAvailable(deferredPrompt);
    }
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    
    if (onInstallSuccess) {
      onInstallSuccess();
    }
  });

  // Handle install prompt dismissal
  if (deferredPrompt) {
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'dismissed') {
        console.log('[PWA] Install prompt dismissed');
        if (onInstallDismissed) {
          onInstallDismissed();
        }
      }
      deferredPrompt = null;
    });
  }
};

/**
 * Triggers the PWA install prompt
 */
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    console.log('[PWA] Install prompt result:', choiceResult.outcome);
    deferredPrompt = null;
    
    return choiceResult.outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Error showing install prompt:', error);
    return false;
  }
};

/**
 * Requests notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('[PWA] Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Shows a local notification
 */
export const showNotification = (
  title: string,
  options?: NotificationOptions
): Promise<Notification | null> => {
  return new Promise((resolve, reject) => {
    if (!('Notification' in window)) {
      reject(new Error('Notifications not supported'));
      return;
    }

    if (Notification.permission !== 'granted') {
      reject(new Error('Notification permission not granted'));
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      resolve(notification);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Registers for push notifications
 */
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[PWA] Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey())
    });

    console.log('[PWA] Push subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Error subscribing to push notifications:', error);
    return null;
  }
};

/**
 * Handles offline voice message caching
 */
export const cacheVoiceMessageForSync = async (audioBlob: Blob): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.active) {
      // Convert blob to array buffer for transfer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      registration.active.postMessage({
        type: 'CACHE_VOICE_MESSAGE',
        payload: {
          audioData: arrayBuffer,
          timestamp: new Date().toISOString(),
          mimeType: audioBlob.type
        }
      });
    }
  } catch (error) {
    console.error('[PWA] Error caching voice message:', error);
    throw error;
  }
};

/**
 * Checks if the app is currently online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Sets up online/offline event listeners
 */
export const setupNetworkListeners = (
  onOnline?: () => void,
  onOffline?: () => void
) => {
  const handleOnline = () => {
    console.log('[PWA] App is online');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('[PWA] App is offline');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Gets app version from manifest or package
 */
export const getAppVersion = async (): Promise<string> => {
  try {
    const response = await fetch('/manifest.json');
    const manifest = await response.json();
    return manifest.version || '1.0.0';
  } catch (error) {
    console.warn('[PWA] Could not get app version:', error);
    return '1.0.0';
  }
};

/**
 * Checks for app updates
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return registration.waiting !== null;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Error checking for updates:', error);
    return false;
  }
};

/**
 * Applies pending app update
 */
export const applyUpdate = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to apply update
      window.location.reload();
    }
  } catch (error) {
    console.error('[PWA] Error applying update:', error);
    throw error;
  }
};

/**
 * Gets storage usage information
 */
export const getStorageUsage = async (): Promise<{
  used: number;
  quota: number;
  percentage: number;
}> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;

      return { used, quota, percentage };
    } catch (error) {
      console.error('[PWA] Error getting storage usage:', error);
    }
  }

  return { used: 0, quota: 0, percentage: 0 };
};

/**
 * Clears app cache and storage
 */
export const clearAppCache = async (): Promise<void> => {
  try {
    // Clear caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    // Clear IndexedDB
    if ('indexedDB' in window) {
      const deleteDB = indexedDB.deleteDatabase('EllieVoiceDB');
      await new Promise((resolve, reject) => {
        deleteDB.onsuccess = () => resolve(undefined);
        deleteDB.onerror = () => reject(deleteDB.error);
      });
    }

    console.log('[PWA] App cache cleared successfully');
  } catch (error) {
    console.error('[PWA] Error clearing app cache:', error);
    throw error;
  }
};

// Helper functions
function getVapidPublicKey(): string {
  // This should be replaced with your actual VAPID public key
  return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnKJuOmLsOBJXoRJNQRhHlbEi2Sab2FKVOy-nFAAlgp2nSHkI';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}