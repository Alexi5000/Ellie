// Mobile detection and device capability utilities

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  hasVibration: boolean;
  supportsWebAudio: boolean;
  supportsSpeechRecognition: boolean;
  browserName: string;
  osName: string;
}

export interface MobileAudioConstraints {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  sampleRate: number;
  channelCount: number;
  latency?: number;
}

/**
 * Detects if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile'
  ];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
         window.innerWidth <= 768 ||
         ('ontouchstart' in window);
};

/**
 * Detects if the current device is a tablet
 */
export const isTabletDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  const isLargeScreen = window.innerWidth >= 768 && window.innerWidth <= 1024;
  
  return isTablet || (isMobileDevice() && isLargeScreen);
};

/**
 * Gets comprehensive device capabilities
 */
export const getDeviceCapabilities = (): DeviceCapabilities => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = isMobileDevice();
  const isTablet = isTabletDevice();
  
  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasVibration: 'vibrate' in navigator,
    supportsWebAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    supportsSpeechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    browserName: getBrowserName(userAgent),
    osName: getOSName(userAgent)
  };
};

/**
 * Gets browser name from user agent
 */
const getBrowserName = (userAgent: string): string => {
  if (userAgent.includes('chrome')) return 'Chrome';
  if (userAgent.includes('firefox')) return 'Firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
  if (userAgent.includes('edge')) return 'Edge';
  if (userAgent.includes('opera')) return 'Opera';
  return 'Unknown';
};

/**
 * Gets operating system name from user agent
 */
const getOSName = (userAgent: string): string => {
  if (userAgent.includes('android')) return 'Android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
  if (userAgent.includes('windows')) return 'Windows';
  if (userAgent.includes('mac')) return 'macOS';
  if (userAgent.includes('linux')) return 'Linux';
  return 'Unknown';
};

/**
 * Gets optimal audio constraints for mobile devices
 */
export const getMobileAudioConstraints = (capabilities: DeviceCapabilities): MobileAudioConstraints => {
  const baseConstraints: MobileAudioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
    channelCount: 1
  };

  // iOS-specific optimizations
  if (capabilities.osName === 'iOS') {
    return {
      ...baseConstraints,
      sampleRate: 48000, // iOS prefers 48kHz
      latency: 0.1 // Lower latency for iOS
    };
  }

  // Android-specific optimizations
  if (capabilities.osName === 'Android') {
    return {
      ...baseConstraints,
      sampleRate: 44100,
      autoGainControl: false, // Can cause issues on some Android devices
      latency: 0.2
    };
  }

  return baseConstraints;
};

/**
 * Checks if the device supports high-quality audio recording
 */
export const supportsHighQualityAudio = (capabilities: DeviceCapabilities): boolean => {
  // Desktop browsers generally support high-quality audio
  if (capabilities.isDesktop) return true;
  
  // Modern mobile browsers with good audio support
  const supportedMobileBrowsers = ['Chrome', 'Safari', 'Firefox'];
  return supportedMobileBrowsers.includes(capabilities.browserName);
};

/**
 * Gets recommended media recorder options for the device
 */
export const getMediaRecorderOptions = (capabilities: DeviceCapabilities): MediaRecorderOptions => {
  const options: MediaRecorderOptions = {};

  // Prefer WebM on Chrome/Firefox, MP4 on Safari
  if (capabilities.browserName === 'Safari') {
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      options.mimeType = 'audio/mp4';
    }
  } else {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options.mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      options.mimeType = 'audio/webm';
    }
  }

  // Mobile devices may benefit from lower bitrates
  if (capabilities.isMobile) {
    options.audioBitsPerSecond = 128000; // 128 kbps for mobile
  }

  return options;
};

/**
 * Provides haptic feedback on supported devices
 */
export const provideMobileHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light'): void => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
};

/**
 * Checks if the device is in landscape mode
 */
export const isLandscapeMode = (): boolean => {
  return window.innerWidth > window.innerHeight;
};

/**
 * Gets safe area insets for devices with notches/rounded corners
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
    right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
    bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
    left: style.getPropertyValue('env(safe-area-inset-left)') || '0px'
  };
};