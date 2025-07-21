import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceState } from '../types';
import { 
  getDeviceCapabilities, 
  getMobileAudioConstraints, 
  getMediaRecorderOptions,
  provideMobileHapticFeedback,
  isLandscapeMode,
  getSafeAreaInsets,
  DeviceCapabilities
} from '../utils/mobileDetection';

interface MobileVoiceInterfaceProps {
  onVoiceInput: (audioBlob: Blob) => void;
  onError: (error: string) => void;
  voiceState: VoiceState;
  disabled?: boolean;
}

interface MobilePermissionState {
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  hasRequestedPermission: boolean;
  showInstructions: boolean;
}

export const MobileVoiceInterface: React.FC<MobileVoiceInterfaceProps> = ({
  onVoiceInput,
  onError,
  voiceState,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionState, setPermissionState] = useState<MobilePermissionState>({
    microphone: 'unknown',
    hasRequestedPermission: false,
    showInstructions: false
  });
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: '0px', bottom: '0px' });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize device capabilities and orientation
  useEffect(() => {
    const capabilities = getDeviceCapabilities();
    setDeviceCapabilities(capabilities);
    setIsLandscape(isLandscapeMode());
    setSafeAreaInsets(getSafeAreaInsets());

    // Check initial permission state
    checkMicrophonePermission();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      setIsLandscape(isLandscapeMode());
      setSafeAreaInsets(getSafeAreaInsets());
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionState(prev => ({
          ...prev,
          microphone: 'denied',
          showInstructions: true
        }));
        return;
      }

      // Check permission status if available
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(prev => ({
            ...prev,
            microphone: permission.state as 'granted' | 'denied' | 'prompt'
          }));

          // Listen for permission changes
          permission.onchange = () => {
            setPermissionState(prev => ({
              ...prev,
              microphone: permission.state as 'granted' | 'denied' | 'prompt'
            }));
          };
        } catch (error) {
          console.warn('Permission API not fully supported:', error);
        }
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermissionState(prev => ({
        ...prev,
        microphone: 'unknown'
      }));
    }
  };

  const requestMicrophonePermission = async (): Promise<MediaStream | null> => {
    if (!deviceCapabilities) return null;

    try {
      setPermissionState(prev => ({ ...prev, hasRequestedPermission: true }));

      const audioConstraints = getMobileAudioConstraints(deviceCapabilities);
      const constraints: MediaStreamConstraints = {
        audio: audioConstraints
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setPermissionState(prev => ({
        ...prev,
        microphone: 'granted',
        showInstructions: false
      }));

      // Provide haptic feedback on successful permission
      provideMobileHapticFeedback('light');
      
      return stream;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      
      let errorMessage = 'Microphone access failed';
      let showInstructions = true;

      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Microphone access denied. Please enable microphone permissions in your browser settings.';
            setPermissionState(prev => ({ ...prev, microphone: 'denied' }));
            break;
          case 'NotFoundError':
            errorMessage = 'No microphone found. Please connect a microphone and try again.';
            showInstructions = false;
            break;
          case 'NotReadableError':
            errorMessage = 'Microphone is being used by another application. Please close other applications and try again.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Microphone constraints not supported. Trying with basic settings...';
            // Try again with basic constraints
            try {
              const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              setPermissionState(prev => ({ ...prev, microphone: 'granted', showInstructions: false }));
              return basicStream;
            } catch (basicError) {
              errorMessage = 'Microphone access failed with basic settings.';
            }
            break;
          default:
            errorMessage = `Microphone error: ${error.message}`;
        }
      }

      setPermissionState(prev => ({ ...prev, showInstructions }));
      onError(errorMessage);
      return null;
    }
  };

  const startRecording = useCallback(async () => {
    if (isRecording || disabled || voiceState === VoiceState.PROCESSING || voiceState === VoiceState.SPEAKING) {
      return;
    }

    if (!deviceCapabilities) {
      onError('Device capabilities not initialized');
      return;
    }

    try {
      const stream = await requestMicrophonePermission();
      if (!stream) return;

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        onError('Audio recording is not supported in your browser');
        return;
      }

      const recorderOptions = getMediaRecorderOptions(deviceCapabilities);
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        });
        
        if (audioBlob.size > 0) {
          onVoiceInput(audioBlob);
          // Provide haptic feedback on successful recording
          provideMobileHapticFeedback('medium');
        }
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError('Recording failed. Please try again.');
        stopRecording();
      };

      // Start recording with mobile-optimized settings
      const timeslice = deviceCapabilities.isMobile ? 250 : 100; // Larger chunks for mobile
      mediaRecorder.start(timeslice);
      setIsRecording(true);

      // Provide haptic feedback on recording start
      provideMobileHapticFeedback('light');

      // Auto-stop recording after 30 seconds to prevent battery drain
      recordingTimeoutRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
          onError('Recording stopped automatically after 30 seconds');
        }
      }, 30000);

    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording');
    }
  }, [isRecording, disabled, voiceState, deviceCapabilities, onVoiceInput, onError]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    try {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);

      // Provide haptic feedback on recording stop
      provideMobileHapticFeedback('light');
    } catch (error) {
      console.error('Error stopping recording:', error);
      onError('Failed to stop recording');
    }
  }, [isRecording, onError]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior
    if (!isRecording) {
      startRecording();
    }
  }, [isRecording, startRecording]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  const handleClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getButtonState = () => {
    if (disabled) return 'disabled';
    if (permissionState.microphone === 'denied') return 'permission-denied';
    if (voiceState === VoiceState.PROCESSING) return 'processing';
    if (voiceState === VoiceState.SPEAKING) return 'speaking';
    if (isRecording || voiceState === VoiceState.LISTENING) return 'recording';
    return 'idle';
  };

  const getButtonText = () => {
    const buttonState = getButtonState();
    
    switch (buttonState) {
      case 'permission-denied':
        return 'Enable Microphone';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      case 'recording':
        return deviceCapabilities?.isTouchDevice ? 'Release to Send' : 'Recording...';
      case 'disabled':
        return 'Disabled';
      default:
        return deviceCapabilities?.isTouchDevice ? 'Hold to Speak' : 'Tap to Speak';
    }
  };

  const buttonState = getButtonState();
  const isButtonDisabled = disabled || buttonState === 'processing' || buttonState === 'speaking';

  return (
    <div 
      className={`flex flex-col items-center space-y-4 px-4 ${isLandscape ? 'py-2' : 'py-4'}`}
      style={{
        paddingTop: `calc(${safeAreaInsets.top} + 1rem)`,
        paddingBottom: `calc(${safeAreaInsets.bottom} + 1rem)`
      }}
    >
      {/* Permission Instructions */}
      {permissionState.showInstructions && permissionState.microphone === 'denied' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm text-center">
          <div className="mb-2">
            <svg className="w-8 h-8 mx-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-semibold text-blue-800 mb-2">Enable Microphone Access</h3>
          <p className="text-blue-700 text-sm mb-3">
            To use voice features, please enable microphone access in your browser settings.
          </p>
          <div className="text-xs text-blue-600 space-y-1">
            {deviceCapabilities?.browserName === 'Safari' && (
              <p>Safari: Tap the microphone icon in the address bar</p>
            )}
            {deviceCapabilities?.browserName === 'Chrome' && (
              <p>Chrome: Tap the lock icon next to the URL</p>
            )}
            {deviceCapabilities?.osName === 'iOS' && (
              <p>iOS: Check Settings → Safari → Microphone</p>
            )}
          </div>
          <button
            onClick={checkMicrophonePermission}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Voice Interface Button */}
      <div className="relative">
        <button
          onClick={handleClick}
          onTouchStart={deviceCapabilities?.isTouchDevice ? handleTouchStart : undefined}
          onTouchEnd={deviceCapabilities?.isTouchDevice ? handleTouchEnd : undefined}
          disabled={isButtonDisabled}
          className={`
            relative transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-4 focus:ring-blue-300
            ${isLandscape ? 'w-16 h-16' : 'w-24 h-24'}
            rounded-full border-4
            ${buttonState === 'recording' 
              ? 'bg-red-500 border-red-600 shadow-lg scale-110 animate-pulse' 
              : buttonState === 'processing'
              ? 'bg-yellow-500 border-yellow-600 animate-spin'
              : buttonState === 'speaking'
              ? 'bg-green-500 border-green-600 animate-pulse'
              : buttonState === 'permission-denied'
              ? 'bg-orange-500 border-orange-600 hover:bg-orange-600'
              : buttonState === 'disabled'
              ? 'bg-gray-300 border-gray-400 cursor-not-allowed'
              : 'bg-blue-500 border-blue-600 hover:bg-blue-600 hover:scale-105 shadow-md active:scale-95'
            }
          `}
          aria-label={getButtonText()}
          aria-pressed={isRecording}
          style={{ touchAction: 'manipulation' }} // Prevent double-tap zoom
        >
          {/* Microphone Icon */}
          <svg
            className={`mx-auto transition-colors duration-300 ${
              isLandscape ? 'w-6 h-6' : 'w-8 h-8'
            } ${
              buttonState === 'disabled' ? 'text-gray-500' : 'text-white'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            {buttonState === 'permission-denied' ? (
              // Settings/permission icon
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            ) : (
              // Microphone icon
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            )}
          </svg>

          {/* Recording Animation Ring */}
          {buttonState === 'recording' && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
          )}
        </button>
      </div>

      {/* Status Text */}
      <p className={`text-center font-medium transition-colors duration-300 ${
        isLandscape ? 'text-sm' : 'text-base'
      } ${
        voiceState === VoiceState.ERROR ? 'text-red-600' : 'text-gray-700'
      }`}>
        {getButtonText()}
      </p>

      {/* Touch Instructions for Mobile */}
      {deviceCapabilities?.isTouchDevice && buttonState === 'idle' && (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Hold the button to record, release to send
        </p>
      )}

      {/* Voice State Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          voiceState === VoiceState.IDLE ? 'bg-gray-400' :
          voiceState === VoiceState.LISTENING ? 'bg-blue-500' :
          voiceState === VoiceState.PROCESSING ? 'bg-yellow-500' :
          voiceState === VoiceState.SPEAKING ? 'bg-green-500' :
          'bg-red-500'
        }`} />
        <span className={`text-gray-600 capitalize ${isLandscape ? 'text-xs' : 'text-sm'}`}>
          {voiceState.replace('_', ' ')}
        </span>
      </div>

      {/* Device Info (Development/Debug) */}
      {process.env.NODE_ENV === 'development' && deviceCapabilities && (
        <div className="text-xs text-gray-400 text-center space-y-1">
          <p>{deviceCapabilities.browserName} on {deviceCapabilities.osName}</p>
          <p>{deviceCapabilities.isMobile ? 'Mobile' : deviceCapabilities.isTablet ? 'Tablet' : 'Desktop'}</p>
          {isLandscape && <p>Landscape Mode</p>}
        </div>
      )}
    </div>
  );
};

export default MobileVoiceInterface;