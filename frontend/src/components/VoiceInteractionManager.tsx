import React from 'react';
import { VoiceInterface } from './VoiceInterface';
import { ChatInterface } from './ChatInterface';
import { VoiceErrorBoundary } from './VoiceErrorBoundary';
import { useVoiceInteraction } from '../hooks/useVoiceInteraction';
import { useError } from '../contexts/ErrorContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface VoiceInteractionManagerProps {
  className?: string;
  onError?: (error: string) => void;
}

export const VoiceInteractionManager: React.FC<VoiceInteractionManagerProps> = ({
  className = '',
  onError
}) => {
  const { showError, showWarning, showInfo } = useError();
  const networkStatus = useNetworkStatus();
  
  const {
    messages,
    voiceState,
    isConnected,
    isInitialized,
    connectionError,
    handleVoiceInput,
    handlePlayAudio,
    handleClearConversation,
    handleRetryConnection,
  } = useVoiceInteraction({ 
    onError: (error) => {
      showError(error, { showRetry: true, onRetry: handleRetryConnection });
      onError?.(error);
    }
  });

  // Show network status warnings
  React.useEffect(() => {
    if (!networkStatus.isOnline) {
      showError('You appear to be offline. Voice features may not work properly.', {
        duration: 0, // Don't auto-dismiss
        showRetry: true,
        onRetry: () => window.location.reload(),
      });
    } else if (networkStatus.isSlowConnection) {
      showWarning('Slow network connection detected. Voice processing may be slower than usual.', {
        duration: 8000,
      });
    }
  }, [networkStatus.isOnline, networkStatus.isSlowConnection, showError, showWarning]);

  // Render connection error state
  if (connectionError && !isConnected) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
          <p className="text-red-700 text-sm mb-4">{connectionError}</p>
          <button
            onClick={handleRetryConnection}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (!isInitialized) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Connecting to voice service...</p>
      </div>
    );
  }

  return (
    <VoiceErrorBoundary 
      enableTextFallback={true}
      onError={(error, errorInfo) => {
        console.error('Voice component error:', error, errorInfo);
        showError('Voice features encountered an error. You can continue with text chat.', {
          duration: 0,
          showRetry: true,
          onRetry: handleRetryConnection,
        });
      }}
    >
      <div className={`flex flex-col lg:flex-row gap-6 h-full ${className}`}>
        {/* Voice Interface */}
        <div className="flex-shrink-0 lg:w-80 flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Talk to Ellie
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Click the microphone and speak naturally
            </p>
          </div>

          <VoiceInterface
            onVoiceInput={handleVoiceInput}
            onError={onError || (() => {})}
            voiceState={voiceState}
            disabled={!isConnected}
          />

          {/* Connection status */}
          <div className="mt-6 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
          <ChatInterface
            messages={messages}
            voiceState={voiceState}
            onPlayAudio={handlePlayAudio}
            onClearConversation={handleClearConversation}
          />
        </div>
      </div>
    </VoiceErrorBoundary>
  );
};

export default VoiceInteractionManager;