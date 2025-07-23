/**
 * Unified Monitoring Dashboard Component
 * Requirements: 15.2 - Advanced monitoring and analytics
 */

import React, { useState } from 'react';
import BusinessMetricsDashboard from './BusinessMetricsDashboard';
import PerformanceMonitoringDashboard from './PerformanceMonitoringDashboard';
import LogMonitoringDashboard from './LogMonitoringDashboard';

const MonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'performance' | 'logs' | 'business'>('performance');
  const [timeWindow, setTimeWindow] = useState<number>(3600000); // 1 hour default

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ellie Monitoring Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive monitoring and analytics for the Ellie Voice Receptionist system
          </p>
        </div>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'performance'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'logs'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Logs
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'business'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Business Metrics
              </button>
            </nav>
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Window
              </label>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value={300000}>5 minutes</option>
                <option value={900000}>15 minutes</option>
                <option value={3600000}>1 hour</option>
                <option value={21600000}>6 hours</option>
                <option value={86400000}>24 hours</option>
                <option value={604800000}>7 days</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              Data updates automatically based on the selected dashboard's refresh interval
            </div>
          </div>
        </div>
        
        {/* Active Dashboard */}
        {activeTab === 'performance' && (
          <PerformanceMonitoringDashboard 
            timeWindow={timeWindow} 
            refreshInterval={60000} 
            showHeader={false}
          />
        )}
        
        {activeTab === 'logs' && (
          <LogMonitoringDashboard 
            timeWindow={timeWindow} 
            refreshInterval={30000} 
            showHeader={false}
          />
        )}
        
        {activeTab === 'business' && (
          <BusinessMetricsDashboard 
            timeWindow={timeWindow} 
            refreshInterval={300000} 
            showHeader={false}
          />
        )}
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Ellie Voice Receptionist Monitoring System</p>
          <p className="mt-1">Data refreshes automatically. Last page load: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;