import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isMobileDevice,
  isTabletDevice,
  getDeviceCapabilities,
  getMobileAudioConstraints,
  getMediaRecorderOptions,
  provideMobileHapticFeedback,
  isLandscapeMode,
  getSafeAreaInsets,
  supportsHighQualityAudio
} from './mobileDetection';

// Mock navigator and window properties
const mockNavigator = {
  userAgent: '',
  maxTouchPoints: 0,
  vibrate: vi.fn()
};

const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  AudioContext: vi.fn(),
  MediaRecorder: {
    isTypeSupported: vi.fn()
  }
};

describe('mobileDetection', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default values
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 0
    });

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 768
    });

    Object.defineProperty(window, 'AudioContext', {
      writable: true,
      value: vi.fn()
    });

    Object.defineProperty(window, 'MediaRecorder', {
      writable: true,
      value: {
        isTypeSupported: vi.fn().mockReturnValue(true)
      }
    });
  });

  describe('isMobileDevice', () => {
    it('detects mobile devices by user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });
      
      expect(isMobileDevice()).toBe(true);
    });

    it('detects Android devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)'
      });
      
      expect(isMobileDevice()).toBe(true);
    });

    it('detects mobile by screen width', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 480
      });
      
      expect(isMobileDevice()).toBe(true);
    });

    it('detects mobile by touch support', () => {
      Object.defineProperty(window, 'ontouchstart', {
        value: true
      });
      
      expect(isMobileDevice()).toBe(true);
    });

    it('returns false for desktop devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1920
      });
      
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isTabletDevice', () => {
    it('detects iPad devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'
      });
      
      expect(isTabletDevice()).toBe(true);
    });

    it('detects Android tablets', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-T510) AppleWebKit/537.36'
      });
      
      expect(isTabletDevice()).toBe(true);
    });

    it('detects tablets by screen size', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 800
      });
      
      expect(isTabletDevice()).toBe(true);
    });

    it('returns false for phones', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 375
      });
      
      expect(isTabletDevice()).toBe(false);
    });
  });

  describe('getDeviceCapabilities', () => {
    it('returns comprehensive device capabilities', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 375
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5
      });
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn()
      });

      const capabilities = getDeviceCapabilities();

      expect(capabilities.isMobile).toBe(true);
      expect(capabilities.isTablet).toBe(false);
      expect(capabilities.isDesktop).toBe(false);
      expect(capabilities.isTouchDevice).toBe(true);
      expect(capabilities.hasVibration).toBe(true);
      expect(capabilities.supportsWebAudio).toBe(true);
      expect(capabilities.browserName).toBe('Safari');
      expect(capabilities.osName).toBe('iOS');
    });

    it('detects Chrome browser correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      });

      const capabilities = getDeviceCapabilities();
      expect(capabilities.browserName).toBe('Chrome');
      expect(capabilities.osName).toBe('Android');
    });

    it('detects Firefox browser correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Mobile; rv:68.0) Gecko/68.0 Firefox/68.0'
      });

      const capabilities = getDeviceCapabilities();
      expect(capabilities.browserName).toBe('Firefox');
    });
  });

  describe('getMobileAudioConstraints', () => {
    it('returns iOS-optimized constraints', () => {
      const capabilities = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        hasVibration: true,
        supportsWebAudio: true,
        supportsSpeechRecognition: false,
        browserName: 'Safari',
        osName: 'iOS'
      };

      const constraints = getMobileAudioConstraints(capabilities);

      expect(constraints.sampleRate).toBe(48000);
      expect(constraints.latency).toBe(0.1);
      expect(constraints.echoCancellation).toBe(true);
    });

    it('returns Android-optimized constraints', () => {
      const capabilities = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        hasVibration: true,
        supportsWebAudio: true,
        supportsSpeechRecognition: false,
        browserName: 'Chrome',
        osName: 'Android'
      };

      const constraints = getMobileAudioConstraints(capabilities);

      expect(constraints.sampleRate).toBe(44100);
      expect(constraints.autoGainControl).toBe(false);
      expect(constraints.latency).toBe(0.2);
    });

    it('returns default constraints for other platforms', () => {
      const capabilities = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        hasVibration: false,
        supportsWebAudio: true,
        supportsSpeechRecognition: true,
        browserName: 'Chrome',
        osName: 'Windows'
      };

      const constraints = getMobileAudioConstraints(capabilities);

      expect(constraints.sampleRate).toBe(44100);
      expect(constraints.autoGainControl).toBe(true);
      expect(constraints.channelCount).toBe(1);
    });
  });

  describe('getMediaRecorderOptions', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'MediaRecorder', {
        writable: true,
        value: {
          isTypeSupported: vi.fn()
        }
      });
    });

    it('prefers MP4 for Safari', () => {
      const capabilities = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        hasVibration: true,
        supportsWebAudio: true,
        supportsSpeechRecognition: false,
        browserName: 'Safari',
        osName: 'iOS'
      };

      window.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

      const options = getMediaRecorderOptions(capabilities);

      expect(options.mimeType).toBe('audio/mp4');
    });

    it('prefers WebM with Opus for Chrome', () => {
      const capabilities = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        hasVibration: true,
        supportsWebAudio: true,
        supportsSpeechRecognition: false,
        browserName: 'Chrome',
        osName: 'Android'
      };

      window.MediaRecorder.isTypeSupported = vi.fn()
        .mockImplementation((type) => type === 'audio/webm;codecs=opus');

      const options = getMediaRecorderOptions(capabilities);

      expect(options.mimeType).toBe('audio/webm;codecs=opus');
    });

    it('sets lower bitrate for mobile devices', () => {
      const capabilities = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        hasVibration: true,
        supportsWebAudio: true,
        supportsSpeechRecognition: false,
        browserName: 'Chrome',
        osName: 'Android'
      };

      const options = getMediaRecorderOptions(capabilities);

      expect(options.audioBitsPerSecond).toBe(128000);
    });
  });

  describe('provideMobileHapticFeedback', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        value: vi.fn()
      });
    });

    it('provides light haptic feedback', () => {
      provideMobileHapticFeedback('light');
      expect(navigator.vibrate).toHaveBeenCalledWith([10]);
    });

    it('provides medium haptic feedback', () => {
      provideMobileHapticFeedback('medium');
      expect(navigator.vibrate).toHaveBeenCalledWith([20]);
    });

    it('provides heavy haptic feedback', () => {
      provideMobileHapticFeedback('heavy');
      expect(navigator.vibrate).toHaveBeenCalledWith([30]);
    });

    it('defaults to light feedback', () => {
      provideMobileHapticFeedback();
      expect(navigator.vibrate).toHaveBeenCalledWith([10]);
    });

    it('handles missing vibrate API gracefully', () => {
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined
      });

      expect(() => provideMobileHapticFeedback()).not.toThrow();
    });
  });

  describe('isLandscapeMode', () => {
    it('detects landscape mode', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 800
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 600
      });

      expect(isLandscapeMode()).toBe(true);
    });

    it('detects portrait mode', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 600
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800
      });

      expect(isLandscapeMode()).toBe(false);
    });
  });

  describe('getSafeAreaInsets', () => {
    it('returns safe area insets', () => {
      // Mock getComputedStyle
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockImplementation((prop) => {
          const values = {
            'env(safe-area-inset-top)': '44px',
            'env(safe-area-inset-right)': '0px',
            'env(safe-area-inset-bottom)': '34px',
            'env(safe-area-inset-left)': '0px'
          };
          return values[prop] || '0px';
        })
      });

      Object.defineProperty(window, 'getComputedStyle', {
        value: mockGetComputedStyle
      });

      const insets = getSafeAreaInsets();

      expect(insets.top).toBe('44px');
      expect(insets.bottom).toBe('34px');
      expect(insets.left).toBe('0px');
      expect(insets.right).toBe('0px');
    });

    it('returns default values when safe area insets are not available', () => {
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('')
      });

      Object.defineProperty(window, 'getComputedStyle', {
        value: mockGetComputedStyle
      });

      const insets = getSafeAreaInsets();

      expect(insets.top).toBe('0px');
      expect(insets.bottom).toBe('0px');
      expect(insets.left).toBe('0px');
      expect(insets.right).toBe('0px');
    });
  });

  describe('supportsHighQualityAudio', () => {
    it('returns true for desktop devices', () => {
      const capabilities = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        hasVibration: false,
        supportsWebAudio: true,
        supportsSpeechRecognition: true,
        browserName: 'Chrome',
        osName: 'Windows'
      };

      expect(supportsHighQualityAudio(capabilities)).toBe(true);
    });

    it('returns true for supported mobile browsers', () => {
      const capabilities = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        hasVibration: true,
        supportsWebAudio: true,
        supportsSpeechRecognition: false,
        browserName: 'Chrome',
        osName: 'Android'
      };

      expect(supportsHighQualityAudio(capabilities)).toBe(true);
    });

    it('returns false for unsupported mobile browsers', () => {
      const capabilities = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        hasVibration: true,
        supportsWebAudio: true,
        supportsSpeechRecognition: false,
        browserName: 'Unknown',
        osName: 'Android'
      };

      expect(supportsHighQualityAudio(capabilities)).toBe(false);
    });
  });
});