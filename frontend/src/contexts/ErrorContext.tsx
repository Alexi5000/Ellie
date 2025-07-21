import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ErrorNotification, ErrorNotificationProps } from '../components/ErrorNotification';

interface ErrorContextType {
  showError: (message: string, options?: Partial<ErrorNotificationProps>) => void;
  showWarning: (message: string, options?: Partial<ErrorNotificationProps>) => void;
  showInfo: (message: string, options?: Partial<ErrorNotificationProps>) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorNotificationState extends ErrorNotificationProps {
  id: string;
}

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<ErrorNotificationState[]>([]);

  const addNotification = useCallback((
    message: string,
    type: 'error' | 'warning' | 'info' = 'error',
    options: Partial<ErrorNotificationProps> = {}
  ) => {
    const id = Date.now().toString();
    const notification: ErrorNotificationState = {
      id,
      message,
      type,
      duration: 5000,
      ...options,
      onClose: () => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        options.onClose?.();
      },
    };

    setNotifications(prev => [...prev, notification]);
  }, []);

  const showError = useCallback((message: string, options?: Partial<ErrorNotificationProps>) => {
    addNotification(message, 'error', options);
  }, [addNotification]);

  const showWarning = useCallback((message: string, options?: Partial<ErrorNotificationProps>) => {
    addNotification(message, 'warning', options);
  }, [addNotification]);

  const showInfo = useCallback((message: string, options?: Partial<ErrorNotificationProps>) => {
    addNotification(message, 'info', options);
  }, [addNotification]);

  const clearErrors = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: ErrorContextType = {
    showError,
    showWarning,
    showInfo,
    clearErrors,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ transform: `translateY(${index * 10}px)` }}
          >
            <ErrorNotification {...notification} />
          </div>
        ))}
      </div>
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorProvider;