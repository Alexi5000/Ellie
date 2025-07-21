import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TextFallbackInterface } from './TextFallbackInterface';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableTextFallback?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showTextFallback: boolean;
}

export class VoiceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showTextFallback: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VoiceErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      showTextFallback: false,
    });
  };

  handleUseTextFallback = () => {
    this.setState({
      showTextFallback: true,
    });
  };

  render() {
    if (this.state.hasError) {
      // Show text fallback if requested
      if (this.state.showTextFallback && this.props.enableTextFallback) {
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-yellow-800 text-sm">
                  Voice features are temporarily unavailable. Using text-based interface.
                </p>
              </div>
            </div>
            <TextFallbackInterface onRetryVoice={this.handleRetry} />
          </div>
        );
      }

      // Voice-specific error UI
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Voice Feature Error
            </h3>
            
            <p className="text-gray-600 mb-6">
              We're having trouble with the voice features. This could be due to microphone permissions, 
              browser compatibility, or network issues.
            </p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={this.handleRetry}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Voice Again
              </button>
              
              {this.props.enableTextFallback && (
                <button
                  onClick={this.handleUseTextFallback}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Use Text Instead
                </button>
              )}
            </div>

            {/* Troubleshooting tips */}
            <div className="mt-6 text-left">
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Troubleshooting Tips
                </summary>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check that microphone permissions are enabled</li>
                  <li>• Ensure you're using a supported browser (Chrome, Firefox, Safari)</li>
                  <li>• Try refreshing the page</li>
                  <li>• Check your internet connection</li>
                  <li>• Make sure your microphone is working in other applications</li>
                </ul>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VoiceErrorBoundary;