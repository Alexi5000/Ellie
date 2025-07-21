import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

interface PWAStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({
  showDetails = false,
  className = ''
}) => {
  const [pwaState, pwaActions] = usePWA();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await pwaActions.applyAppUpdate();
    } catch (error) {
      console.error('Error applying update:', error);
      setIsUpdating(false);
    }
  };

  const getConnectionStatus = () => {
    if (pwaState.isOnline) {
      return {
        icon: (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        ),
        text: 'Online',
        color: 'text-green-600'
      };
    } else {
      return {
        icon: (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        ),
        text: 'Offline',
        color: 'text-red-600'
      };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className={`${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        {connectionStatus.icon}
        <span className={`text-sm font-medium ${connectionStatus.color}`}>
          {connectionStatus.text}
        </span>
      </div>

      {/* Update Available */}
      {pwaState.hasUpdate && (
        <div className="mt-2 flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className={`text-sm font-medium transition-colors ${
              isUpdating
                ? 'text-blue-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            {isUpdating ? 'Updating...' : 'Update Available'}
          </button>
        </div>
      )}

      {/* Detailed Status */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          {/* PWA Status */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>PWA Installed:</span>
            <span className={pwaState.capabilities.isInstalled ? 'text-green-600' : 'text-gray-400'}>
              {pwaState.capabilities.isInstalled ? 'Yes' : 'No'}
            </span>
          </div>

          {/* Service Worker */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Service Worker:</span>
            <span className={pwaState.capabilities.hasServiceWorker ? 'text-green-600' : 'text-gray-400'}>
              {pwaState.capabilities.hasServiceWorker ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Notifications:</span>
            <span className={
              pwaState.notificationPermission === 'granted' 
                ? 'text-green-600' 
                : pwaState.notificationPermission === 'denied'
                ? 'text-red-600'
                : 'text-yellow-600'
            }>
              {pwaState.notificationPermission === 'granted' ? 'Enabled' : 
               pwaState.notificationPermission === 'denied' ? 'Disabled' : 'Pending'}
            </span>
          </div>

          {/* Storage Usage */}
          {pwaState.storageUsage.quota > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Storage Used:</span>
                <span>
                  {Math.round(pwaState.storageUsage.percentage)}% 
                  ({formatBytes(pwaState.storageUsage.used)} / {formatBytes(pwaState.storageUsage.quota)})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    pwaState.storageUsage.percentage > 80 
                      ? 'bg-red-500' 
                      : pwaState.storageUsage.percentage > 60 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(pwaState.storageUsage.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Capabilities */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Capabilities:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className={`flex items-center ${pwaState.capabilities.supportsNotifications ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="w-2 h-2 rounded-full bg-current mr-1" />
                Notifications
              </div>
              <div className={`flex items-center ${pwaState.capabilities.supportsBackgroundSync ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="w-2 h-2 rounded-full bg-current mr-1" />
                Background Sync
              </div>
              <div className={`flex items-center ${pwaState.capabilities.supportsPushNotifications ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="w-2 h-2 rounded-full bg-current mr-1" />
                Push Messages
              </div>
              <div className={`flex items-center ${pwaState.capabilities.isStandalone ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="w-2 h-2 rounded-full bg-current mr-1" />
                Standalone
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default PWAStatus;