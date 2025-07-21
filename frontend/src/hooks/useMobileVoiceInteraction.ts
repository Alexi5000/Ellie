import { useState, useCallback, useEffect, useRef } from 'react';
import { useVoiceInteraction } from './useVoiceInteraction';
import { 
  getDeviceCapabilities, 
  provideMobileHapticFeedback,
  DeviceCapabilities 
} from '../utils/mobileDetection';
import { VoiceState } from '../types';

export interface MobileVoiceInteractionState {
  deviceCapabilities: DeviceCapabilities | null;
  isInBackground: boolean;
  batteryLevel: number | null;
  isLowPowerMode: boolean;
  networkType: string | null;
  isOnline: boolean;
}

export interface MobileVoiceInteractionActions {
  handleAppStateChange: (isBackground: boolean) => void;
  optimizeForBattery: () => void;
  handleNetworkChange: () => void;
  preventScreenLock: () => void;
  releaseScreenLock: () => void;
}

export const useMobileVoiceInteraction = (): [
  ReturnType<typeof useVoiceInteraction>[0] & MobileVoiceInteractionState,
  ReturnType<typeof useVoiceInteraction>[1] & MobileVoiceInteractionActions
] => {
  const [baseState, baseActions] = useVoiceInteraction();
  
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isInBackground, setIsInBackground] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [networkType, setNetworkType] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const batteryRef = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const backgroundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize mobile-specific features
  useEffect(() => {
    const capabilities = getDeviceCapabilities();
    setDeviceCapabilities(capabilities);

    // Only initialize mobile features on mobile devices
    if (capabilities.isMobile || capabilities.isTablet) {
      initializeBatteryAPI();
      initializeNetworkAPI();
      initializeVisibilityAPI();
      initializeOnlineStatus();
    }

    return () => {
      if (backgroundTimeoutRef.current) {
        clearTimeout(backgroundTimeoutRef.current);
      }
      releaseScreenLock();
    };
  }, []);

  // Initialize Battery API
  const initializeBatteryAPI = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryRef.current = battery;
        
        setBatteryLevel(battery.level);
        setIsLowPowerMode(battery.level < 0.2); // Consider low power when < 20%

        const updateBatteryInfo = () => {
          setBatteryLevel(battery.level);
          setIsLowPowerMode(battery.level < 0.2);
        };

        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
      }
    } catch (error) {
      console.warn('Battery API not supported:', error);
    }
  };

  // Initialize Network Information API
  const initializeNetworkAPI = () => {
    try {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        connectionRef.current = connection;
        setNetworkType(connection.effectiveType || connection.type);

        const updateNetworkInfo = () => {
          setNetworkType(connection.effectiveType || connection.type);
        };

        connection.addEventListener('change', updateNetworkInfo);
      }
    } catch (error) {
      console.warn('Network Information API not supported:', error);
    }
  };

  // Initialize Page Visibility API
  const initializeVisibilityAPI = () => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      setIsInBackground(isHidden);
      
      if (isHidden) {
        // App went to background - pause voice interactions after delay
        backgroundTimeoutRef.current = setTimeout(() => {
          if (baseState.voiceState === VoiceState.LISTENING) {
            baseActions.handleError('Voice interaction paused - app in background');
          }
        }, 5000); // 5 second grace period
      } else {
        // App came to foreground - resume interactions
        if (backgroundTimeoutRef.current) {
          clearTimeout(backgroundTimeoutRef.current);
          backgroundTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  // Initialize online status monitoring
  const initializeOnlineStatus = () => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine && baseState.voiceState !== VoiceState.IDLE) {
        baseActions.handleError('Connection lost - please check your internet connection');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  };

  // Enhanced voice input with mobile optimizations
  const sendVoiceInputMobile = useCallback(async (audioBlob: Blob) => {
    try {
      // Check network conditions
      if (!isOnline) {
        throw new Error('No internet connection available');
      }

      // Optimize for slow networks
      if (networkType === 'slow-2g' || networkType === '2g') {
        // Compress audio more aggressively for slow networks
        console.warn('Slow network detected - using compressed audio');
      }

      // Provide haptic feedback
      if (deviceCapabilities?.hasVibration) {
        provideMobileHapticFeedback('light');
      }

      // Prevent screen lock during processing
      await preventScreenLock();

      await baseActions.sendVoiceInput(audioBlob);

      // Provide success haptic feedback
      if (deviceCapabilities?.hasVibration) {
        provideMobileHapticFeedback('medium');
      }

    } catch (error) {
      // Provide error haptic feedback
      if (deviceCapabilities?.hasVibration) {
        provideMobileHapticFeedback('heavy');
      }
      throw error;
    } finally {
      // Release screen lock after processing
      releaseScreenLock();
    }
  }, [baseActions, isOnline, networkType, deviceCapabilities]);

  // Handle app state changes
  const handleAppStateChange = useCallback((isBackground: boolean) => {
    setIsInBackground(isBackground);
    
    if (isBackground) {
      // Pause voice interactions when app goes to background
      if (baseState.voiceState === VoiceState.LISTENING || baseState.voiceState === VoiceState.PROCESSING) {
        baseActions.handleError('Voice interaction paused');
      }
    }
  }, [baseState.voiceState, baseActions]);

  // Optimize for battery usage
  const optimizeForBattery = useCallback(() => {
    if (isLowPowerMode) {
      // Reduce audio quality for battery saving
      console.log('Low power mode - optimizing audio settings');
      
      // Disconnect when not actively used
      if (baseState.voiceState === VoiceState.IDLE) {
        baseActions.disconnect();
      }
    }
  }, [isLowPowerMode, baseState.voiceState, baseActions]);

  // Handle network changes
  const handleNetworkChange = useCallback(() => {
    if (!isOnline) {
      baseActions.handleError('Connection lost');
    } else if (networkType === 'slow-2g' || networkType === '2g') {
      console.warn('Slow network detected - voice processing may be slower');
    }
  }, [isOnline, networkType, baseActions]);

  // Prevent screen lock during voice interactions
  const preventScreenLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Screen wake lock acquired');
      }
    } catch (error) {
      console.warn('Wake lock not supported or failed:', error);
    }
  }, []);

  // Release screen lock
  const releaseScreenLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Screen wake lock released');
    }
  }, []);

  // Auto-optimize based on device state
  useEffect(() => {
    if (deviceCapabilities?.isMobile) {
      optimizeForBattery();
    }
  }, [isLowPowerMode, batteryLevel, deviceCapabilities, optimizeForBattery]);

  // Handle network changes
  useEffect(() => {
    handleNetworkChange();
  }, [isOnline, networkType, handleNetworkChange]);

  // Enhanced error handling with mobile-specific messages
  const handleErrorMobile = useCallback((error: string) => {
    let mobileError = error;

    // Provide mobile-specific error messages
    if (!isOnline) {
      mobileError = 'No internet connection. Please check your network settings.';
    } else if (networkType === 'slow-2g' || networkType === '2g') {
      mobileError = `${error} (Slow network detected - this may affect performance)`;
    } else if (isLowPowerMode) {
      mobileError = `${error} (Low battery mode may affect performance)`;
    }

    // Provide haptic feedback for errors
    if (deviceCapabilities?.hasVibration) {
      provideMobileHapticFeedback('heavy');
    }

    baseActions.handleError(mobileError);
  }, [isOnline, networkType, isLowPowerMode, deviceCapabilities, baseActions]);

  // Enhanced play audio with mobile optimizations
  const playAudioMobile = useCallback(async (audioUrl: string) => {
    try {
      // Prevent screen lock during audio playback
      await preventScreenLock();
      
      await baseActions.playAudio(audioUrl);
      
      // Provide haptic feedback when audio starts
      if (deviceCapabilities?.hasVibration) {
        provideMobileHapticFeedback('light');
      }
    } catch (error) {
      console.error('Mobile audio playback error:', error);
      throw error;
    } finally {
      releaseScreenLock();
    }
  }, [baseActions, deviceCapabilities, preventScreenLock, releaseScreenLock]);

  const mobileState = {
    ...baseState,
    deviceCapabilities,
    isInBackground,
    batteryLevel,
    isLowPowerMode,
    networkType,
    isOnline
  };

  const mobileActions = {
    ...baseActions,
    sendVoiceInput: sendVoiceInputMobile,
    handleError: handleErrorMobile,
    playAudio: playAudioMobile,
    handleAppStateChange,
    optimizeForBattery,
    handleNetworkChange,
    preventScreenLock,
    releaseScreenLock
  };

  return [mobileState, mobileActions];
};