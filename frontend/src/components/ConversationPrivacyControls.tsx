import React, { useState } from 'react';

interface ConversationPrivacyControlsProps {
  isVisible: boolean;
  onClose: () => void;
  onUpdateSettings: (settings: PrivacySettings) => void;
  currentSettings: PrivacySettings;
}

export interface PrivacySettings {
  enableConversationLogging: boolean;
  enableAudioRecording: boolean;
  dataRetentionDays: number;
  allowAnalytics: boolean;
  allowQualityImprovement: boolean;
}

const ConversationPrivacyControls: React.FC<ConversationPrivacyControlsProps> = ({
  isVisible,
  onClose,
  onUpdateSettings,
  currentSettings
}) => {
  const [settings, setSettings] = useState<PrivacySettings>(currentSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(currentSettings));
  };

  const handleSave = () => {
    onUpdateSettings(settings);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setSettings(currentSettings);
    setHasChanges(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h2 className="text-2xl font-bold">Privacy & Data Controls</h2>
                <p className="text-primary-100">Manage your conversation data and privacy settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-primary-100 hover:text-white transition-colors p-2"
              aria-label="Close privacy controls"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Data Collection Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Data Collection
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Conversation Logging</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Store conversation transcripts for reference and quality improvement. 
                      Logs are encrypted and automatically deleted after the retention period.
                    </p>
                  </div>
                  <label className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={settings.enableConversationLogging}
                      onChange={(e) => handleSettingChange('enableConversationLogging', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable</span>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Audio Recording</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Temporarily store audio data for processing. Audio is processed in real-time 
                      and deleted immediately after transcription unless logging is enabled.
                    </p>
                  </div>
                  <label className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={settings.enableAudioRecording}
                      onChange={(e) => handleSettingChange('enableAudioRecording', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Data Retention Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Data Retention
              </h3>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Automatic Data Deletion</h4>
                  <span className="text-sm text-gray-600">{settings.dataRetentionDays} days</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  All conversation data will be automatically deleted after this period. 
                  You can also request immediate deletion at any time.
                </p>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={settings.dataRetentionDays}
                    onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 day</span>
                    <span>30 days</span>
                    <span>90 days</span>
                    <span>365 days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Analytics Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
                Analytics & Improvement
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Usage Analytics</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Collect anonymized usage statistics to understand how Ellie is used 
                      and improve the service. No personal information is included.
                    </p>
                  </div>
                  <label className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={settings.allowAnalytics}
                      onChange={(e) => handleSettingChange('allowAnalytics', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow</span>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Quality Improvement</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Use conversation data to improve AI responses and accuracy. 
                      Data is anonymized and used only for service enhancement.
                    </p>
                  </div>
                  <label className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={settings.allowQualityImprovement}
                      onChange={(e) => handleSettingChange('allowQualityImprovement', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Data Rights */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Your Data Rights</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Request a copy of all your stored data</li>
                <li>• Request immediate deletion of your data</li>
                <li>• Modify your privacy settings at any time</li>
                <li>• Opt out of data collection entirely</li>
              </ul>
              <div className="mt-3">
                <button className="text-blue-800 hover:text-blue-900 font-medium text-sm underline">
                  Contact us about your data rights
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {hasChanges && (
                <span className="text-orange-600 font-medium">
                  You have unsaved changes
                </span>
              )}
            </div>
            <div className="flex space-x-4">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  hasChanges
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPrivacyControls;