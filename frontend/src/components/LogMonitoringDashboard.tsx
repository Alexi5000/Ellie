/**
 * Log Monitoring Dashboard Component
 * Requirements: 15.2 - Advanced logging with log aggregation
 */

import React, { useState, useEffect } from 'react';

interface LogMonitoringProps {
  timeWindow?: number;
  refreshInterval?: number;
  title?: string;
  showHeader?: boolean;
  maxLogs?: number;
}

interface LogEntry {
  timestamp: Date;
  level: string;
  service: string;
  message: string;
  metadata?: any;
  requestId?: string;
}

interface LogAlert {
  id: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  timeWindow: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  status: 'active' | 'resolved';
  message: string;
}

const LogMonitoringDashboard: React.FC<LogMonitoringProps> = ({
  timeWindow = 3600000, // 1 hour default
  refreshInterval = 30000, // 30 seconds default
  title = 'Log Monitoring',
  showHeader = true,
  maxLogs = 100
}) => {
  const [logMetrics, setLogMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<LogAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [messageFilter, setMessageFilter] = useState<string>('');

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [timeWindow, refreshInterval, levelFilter, serviceFilter, messageFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch log metrics
      const metricsResponse = await fetch(`/api/logs/metrics?timeWindow=${timeWindow}`);
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch log metrics');
      }
      const metricsData = await metricsResponse.json();
      setLogMetrics(metricsData);
      
      // Fetch log alerts
      const alertsResponse = await fetch('/api/logs/alerts');
      if (!alertsResponse.ok) {
        throw new Error('Failed to fetch log alerts');
      }
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData);
      
      // Fetch logs with filters
      const searchParams = new URLSearchParams({
        timeWindow: timeWindow.toString(),
        limit: maxLogs.toString()
      });
      
      if (levelFilter) searchParams.append('level', levelFilter);
      if (serviceFilter) searchParams.append('service', serviceFilter);
      if (messageFilter) searchParams.append('message', messageFilter);
      
      const logsResponse = await fetch(`/api/logs/search?${searchParams.toString()}`);
      if (!logsResponse.ok) {
        throw new Error('Failed to fetch logs');
      }
      const logsData = await logsResponse.json();
      setLogs(logsData);
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/logs/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }
      
      // Update alerts list
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const exportLogs = (format: 'json' | 'csv' | 'txt') => {
    const searchParams = new URLSearchParams({
      format,
      timeWindow: timeWindow.toString()
    });
    
    if (levelFilter) searchParams.append('level', levelFilter);
    if (serviceFilter) searchParams.append('service', serviceFilter);
    
    window.open(`/api/logs/export?${searchParams.toString()}`, '_blank');
  };

  const getLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-800 bg-red-100';
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: Date | string): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString();
  };

  if (loading && !logMetrics) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !logMetrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {showHeader && (
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {lastUpdated && (
            <div className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        {/* Log Metrics Summary */}
        {logMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider">Total Logs</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {logMetrics.totalLogs}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider">Error Rate</h3>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {logMetrics.errorRate.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider">Active Alerts</h3>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {alerts.filter(a => a.status === 'active').length}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider">Services</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {logMetrics.logsByService ? Object.keys(logMetrics.logsByService).length : 0}
              </p>
            </div>
          </div>
        )}
        
        {/* Active Alerts */}
        {alerts.filter(a => a.status === 'active').length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Active Alerts</h3>
            <div className="space-y-3">
              {alerts
                .filter(alert => alert.status === 'active')
                .sort((a, b) => {
                  // Sort by severity first, then by timestamp
                  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                  const severityDiff = 
                    severityOrder[b.severity as keyof typeof severityOrder] - 
                    severityOrder[a.severity as keyof typeof severityOrder];
                  
                  if (severityDiff !== 0) return severityDiff;
                  
                  // Then by timestamp (most recent first)
                  return new Date(b.lastOccurrence).getTime() - new Date(a.lastOccurrence).getTime();
                })
                .slice(0, 5)
                .map(alert => (
                  <div key={alert.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {alert.pattern}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <span>Count: {alert.count}</span>
                          <span className="mx-2">•</span>
                          <span>Last: {formatTimestamp(alert.lastOccurrence)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {alerts.filter(a => a.status === 'active').length > 5 && (
              <div className="mt-3 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View all {alerts.filter(a => a.status === 'active').length} alerts
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Log Search Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
              >
                <option value="">All</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
              >
                <option value="">All</option>
                {logMetrics && logMetrics.logsByService && 
                  Object.keys(logMetrics.logsByService).map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))
                }
              </select>
            </div>
            
            <div className="flex-grow">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Message Contains
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value)}
                  placeholder="Filter by message content..."
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white flex-grow"
                />
                <button
                  onClick={fetchData}
                  className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Logs Table */}
        <div className="mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {log.service}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 max-w-md truncate">
                        {log.message}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
                      No logs found matching the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => exportLogs('json')}
              className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded px-2 py-1"
            >
              Export JSON
            </button>
            <button
              onClick={() => exportLogs('csv')}
              className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded px-2 py-1"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportLogs('txt')}
              className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded px-2 py-1"
            >
              Export TXT
            </button>
          </div>
          
          <button
            onClick={fetchData}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span className="mr-1">Refresh</span>
            <span className="fas fa-sync-alt"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogMonitoringDashboard;