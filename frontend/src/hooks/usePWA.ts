import { useState, useEffect, useCallback } from 'react';
import {
  getPWACapabilities,
  setupInstallPrompt,
  showInstallPrompt,
  requestNotificationPermission,
  showNotification,
  subscribeToPushNotifications,
  setupNetworkListeners,
  checkForUpdates,
  applyUpdate,
  getStorageUsage,
  isOnline,
  PWACapabilities,
  InstallPromptEvent
} from '../utils/pwa';

export interface PWAState {
  capabilities: PWACapabilities;
  isOnline: boolean;
  installPromptAvailable: boolean;
  notificationPermission: NotificationPermission;
  hasUpdate: boolean;
  storageUsage: {
    used: number;
    quota: number;
    percentage: number;
  };
}

export interface PWAActions {
  installApp: () => Promise<boolean>;
  requestNotifications: () => Promise<NotificationPermission>;
  showLocalNotification: (title: string, options?: NotificationOptions) => Promise<Notification | null>;
  subscribeToPush: () => Promise<PushSubscription | null>;
  checkUpdates: () => Promise<boolean>;
  applyAppUpdate: () => Promise<void>;
  refreshStorageUsage: () => Promise<void>;
}

export const usePWA = (): [PWAState, PWAActions] => {
  const [capabilities, setCapabilities] = useState<PWACapabilities>(getPWACapabilities());
  const [isAppOnline, setIsAppOnline] = useState(isOnline());
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [hasUpdate, setHasUpdate] = useState(false);
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    quota: 0,
    percentage: 0
  });

  // Initialize PWA features
  useEffect(() => {
    // Set up install prompt handling
    const cleanupInstallPrompt = setupInstallPrompt(
      (event: InstallPromptEvent) => {
        setInstallPromptAvailable(true);
        setCapabilities(prev => ({ ...prev, isInstallable: true }));
      },
      () => {
        setInstallPromptAvailable(false);
        setCapabilities(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      },
      () => {
        setInstallPromptAvailable(false);
        setCapabilities(prev => ({ ...prev, isInstallable: false }));
      }
    );

    // Set up network listeners
    const cleanupNetworkListeners = setupNetworkListeners(
      () => setIsAppOnline(true),
      () => setIsAppOnline(false)
    );

    // Check for updates periodically
    const updateCheckInterval = setInterval(async () => {
      try {
        const updateAvailable = await checkForUpdates();
        setHasUpdate(updateAvailable);
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }, 60000); // Check every minute

    // Get initial storage usage
    refreshStorageUsage();

    // Cleanup function
    return () => {
      if (cleanupInstallPrompt) cleanupInstallPrompt();
      cleanupNetworkListeners();
      clearInterval(updateCheckInterval);
    };
  }, []);

  // Update capabilities when relevant state changes
  useEffect(() => {
    setCapabilities(getPWACapabilities());
  }, [installPromptAvailable, notificationPermission]);

  // Install app action
  const installApp = useCallback(async (): Promise<boolean> => {
    try {
      const result = await showInstallPrompt();
      if (result) {
        setInstallPromptAvailable(false);
        setCapabilities(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      }
      return result;
    } catch (error) {
      console.error('Error installing app:', error);
      return false;
    }
  }, []);

  // Request notification permission
  const requestNotifications = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, []);

  // Show local notification
  const showLocalNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<Notification | null> => {
    try {
      if (notificationPermission !== 'granted') {
        const permission = await requestNotifications();
        if (permission !== 'granted') {
          throw new Error('Notification permission not granted');
        }
      }

      return await showNotification(title, options);
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [notificationPermission, requestNotifications]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    try {
      if (notificationPermission !== 'granted') {
        const permission = await requestNotifications();
        if (permission !== 'granted') {
          throw new Error('Notification permission required for push notifications');
        }
      }

      return await subscribeToPushNotifications();
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }, [notificationPermission, requestNotifications]);

  // Check for app updates
  const checkUpdates = useCallback(async (): Promise<boolean> => {
    try {
      const updateAvailable = await checkForUpdates();
      setHasUpdate(updateAvailable);
      return updateAvailable;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }, []);

  // Apply app update
  const applyAppUpdate = useCallback(async (): Promise<void> => {
    try {
      await applyUpdate();
      setHasUpdate(false);
    } catch (error) {
      console.error('Error applying update:', error);
      throw error;
    }
  }, []);

  // Refresh storage usage
  const refreshStorageUsage = useCallback(async (): Promise<void> => {
    try {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.error('Error getting storage usage:', error);
    }
  }, []);

  const state: PWAState = {
    capabilities,
    isOnline: isAppOnline,
    installPromptAvailable,
    notificationPermission,
    hasUpdate,
    storageUsage
  };

  const actions: PWAActions = {
    installApp,
    requestNotifications,
    showLocalNotification,
    subscribeToPush,
    checkUpdates,
    applyAppUpdate,
    refreshStorageUsage
  };

  return [state, actions];
};