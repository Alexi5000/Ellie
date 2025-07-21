import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceState } from '../types';
import { getDeviceCapabilities } from '../utils/mobileDetection';
import MobileVoiceInterface from './MobileVoiceInterface';

interface VoiceInterfaceProps {
  onVoiceInput: (audioBlob: Blob) => void;
  onError: (error: string) => void;
  voiceState: VoiceState;
  disabled?: boolean;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onVoiceInput,
  onError,
  voiceState,
  disabled = false
}) => {
  // Check if we should use mobile interface
  const deviceCapabilities = getDeviceCapabilities();
  const shouldUseMobileInterface = deviceCapabilities.isMobile || deviceCapabilities.isTablet;

  // If mobile device, use mobile-optimized interface
  if (shouldUseMobileInterface) {
    return (
      <MobileVoiceInterface
        onVoiceInput={onVoiceInput}
        onError={onError}
        voiceState={voiceState}
        disabled={disabled}
      />
    );
  }

  // Desktop interface implementation
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check microphone permission on component mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Your browser does not support microphone access');
        setHasPermission(false);
        return;
      }

      // Check permission status if available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permission.state === 'denied') {
          setPermissionError('Microphone access denied. Please enable microphone permissions in your browser settings.');
          setHasPermission(false);
          return;
        }
      }

      setHasPermission(true);
      setPermissionError(null);
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermissionError('Unable to check microphone permissions');
      setHasPermission(false);
    }
  };

  const requestMicrophoneAccess = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      setHasPermission(true);
      setPermissionError(null);
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setPermissionError('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          setPermissionError('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          setPermissionError('Microphone is being used by another application. Please close other applications and try again.');
        } else {
          setPermissionError(`Microphone error: ${error.message}`);
        }
      } else {
        setPermissionError('Unknown microphone error occurred');
      }
      
      setHasPermission(false);
      onError(permissionError || 'Microphone access failed');
      return null;
    }
  };

  const startRecording = useCallback(async () => {
    if (isRecording || disabled || voiceState === VoiceState.PROCESSING || voiceState === VoiceState.SPEAKING) {
      return;
    }

    try {
      const stream = await requestMicrophoneAccess();
      if (!stream) return;

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        onError('Audio recording is not supported in your browser');
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

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

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording');
    }
  }, [isRecording, disabled, voiceState, onVoiceInput, onError, permissionError]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    try {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      onError('Failed to stop recording');
    }
  }, [isRecording, onError]);

  const handleMicrophoneClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
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
    if (voiceState === VoiceState.PROCESSING) return 'processing';
    if (voiceState === VoiceState.SPEAKING) return 'speaking';
    if (isRecording || voiceState === VoiceState.LISTENING) return 'recording';
    return 'idle';
  };

  const getButtonText = () => {
    switch (voiceState) {
      case VoiceState.LISTENING:
        return 'Listening...';
      case VoiceState.PROCESSING:
        return 'Processing...';
      case VoiceState.SPEAKING:
        return 'Speaking...';
      case VoiceState.ERROR:
        return 'Try Again';
      default:
        return isRecording ? 'Recording...' : 'Tap to Speak';
    }
  };

  const buttonState = getButtonState();
  const isButtonDisabled = disabled || buttonState === 'processing' || buttonState === 'speaking' || hasPermission === false;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Permission Error Display */}
      {permissionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md text-center">
          <p className="text-red-700 text-sm">{permissionError}</p>
          <button
            onClick={checkMicrophonePermission}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Microphone Button */}
      <div className="relative">
        <button
          onClick={handleMicrophoneClick}
          disabled={isButtonDisabled}
          className={`
            relative w-20 h-20 rounded-full border-4 transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-4 focus:ring-blue-300
            ${buttonState === 'recording' 
              ? 'bg-red-500 border-red-600 shadow-lg scale-110 animate-pulse' 
              : buttonState === 'processing'
              ? 'bg-yellow-500 border-yellow-600 animate-spin'
              : buttonState === 'speaking'
              ? 'bg-green-500 border-green-600 animate-pulse'
              : buttonState === 'disabled' || hasPermission === false
              ? 'bg-gray-300 border-gray-400 cursor-not-allowed'
              : 'bg-blue-500 border-blue-600 hover:bg-blue-600 hover:scale-105 shadow-md'
            }
          `}
          aria-label={getButtonText()}
          aria-pressed={isRecording}
        >
          {/* Microphone Icon */}
          <svg
            className={`w-8 h-8 mx-auto transition-colors duration-300 ${
              buttonState === 'disabled' || hasPermission === false ? 'text-gray-500' : 'text-white'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>

          {/* Recording Animation Ring */}
          {buttonState === 'recording' && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
          )}
        </button>
      </div>

      {/* Status Text */}
      <p className={`text-sm font-medium transition-colors duration-300 ${
        voiceState === VoiceState.ERROR ? 'text-red-600' : 'text-gray-700'
      }`}>
        {getButtonText()}
      </p>

      {/* Voice State Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          voiceState === VoiceState.IDLE ? 'bg-gray-400' :
          voiceState === VoiceState.LISTENING ? 'bg-blue-500' :
          voiceState === VoiceState.PROCESSING ? 'bg-yellow-500' :
          voiceState === VoiceState.SPEAKING ? 'bg-green-500' :
          'bg-red-500'
        }`} />
        <span className="text-xs text-gray-600 capitalize">
          {voiceState.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};

export default VoiceInterface;