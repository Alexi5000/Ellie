import React, { useState, useEffect } from 'react';

export interface ErrorNotificationProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  type = 'error',
  duration = 5000,
  onClose,
  showRetry = false,
  onRetry,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for animation to complete
  };

  const getIconAndColors = () => {
    switch (type) {
      case 'warning':
        return {
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800',
        };
      case 'info':
        return {
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
        };
      default: // error
        return {
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
        };
    }
  };

  const { icon, bgColor, borderColor, iconColor, textColor } = getIconAndColors();

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full ${bgColor} ${borderColor} border rounded-lg shadow-lg transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className={`w-5 h-5 ${iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {icon}
            </svg>
          </div>
          
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${textColor}`}>
              {message}
            </p>
          </div>
          
          <div className="ml-4 flex-shrink-0 flex space-x-2">
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className={`text-xs ${textColor} hover:opacity-75 underline`}
              >
                Retry
              </button>
            )}
            
            <button
              onClick={handleClose}
              className={`${iconColor} hover:opacity-75`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;