/**
 * Performance Monitoring Dashboard Component
 * Requirements: 15.2 - Advanced monitoring and analytics
 */

import React, { useState, useEffect } from 'react';

interface PerformanceMonitoringProps {
  timeWindow?: number;
  refreshInterval?: number;
  title?: string;
  showHeader?: boolean;
}

const PerformanceMonitoringDashboard: React.FC<PerformanceMonitoringProps> = ({
  timeWindow = 3600000, // 1 hour default
  refreshInterval = 60000, // 1 minute default
  title = 'Performance Monitoring',
  showHeader = true
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [apmData, setApmData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [timeWindow, refreshInterval]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch performance metrics
      const metricsResponse = await fetch(`/api/analytics/performance?timeWindow=${timeWindow}`);
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      const metricsData = await metricsResponse.json();
      
      // Fetch APM metrics
      const apmResponse = await fetch(`/api/apm/metrics?timeWindow=${timeWindow}`);
      if (!apmResponse.ok) {
        throw new Error('Failed to fetch APM metrics');
      }
      const apmData = await apmResponse.json();
      
      setMetrics(metricsData);
      setApmData(apmData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1) return '< 1ms';
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !metrics) {
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
        {/* System Metrics */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-4">System Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics && (
              <>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider">Memory Usage</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {metrics.systemMetrics.memoryUsage} MB
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider">Active Connections</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {metrics.systemMetrics.activeConnections}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider">CPU Usage</h4>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {metrics.systemMetrics.cpuUsage || 'N/A'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* API Response Times */}
        {metrics && metrics.apiResponseTimes && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">API Response Times</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P95
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P99
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      OpenAI
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.openai.average)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.openai.p95)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.openai.p99)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Groq
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.groq.average)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.groq.p95)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.groq.p99)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      TTS
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.tts.average)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.tts.p95)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(metrics.apiResponseTimes.tts.p99)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Cache Hit Rates */}
        {metrics && metrics.cacheHitRates && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Cache Hit Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">AI Responses</h4>
                <div className="mt-2 flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${metrics.cacheHitRates.aiResponses}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {formatPercentage(metrics.cacheHitRates.aiResponses)}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">TTS Audio</h4>
                <div className="mt-2 flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${metrics.cacheHitRates.ttsAudio}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {formatPercentage(metrics.cacheHitRates.ttsAudio)}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">User Sessions</h4>
                <div className="mt-2 flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${metrics.cacheHitRates.userSessions}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {formatPercentage(metrics.cacheHitRates.userSessions)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* APM Metrics */}
        {apmData && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Application Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">Transactions</h4>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {apmData.transactions.total}
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-green-600 font-medium">
                    {apmData.transactions.successful}
                  </span>
                  <span className="mx-1 text-gray-500">successful,</span>
                  <span className="text-red-600 font-medium">
                    {apmData.transactions.failed}
                  </span>
                  <span className="ml-1 text-gray-500">failed</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">Avg Duration</h4>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatDuration(apmData.transactions.averageDuration)}
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-gray-500">P95:</span>
                  <span className="ml-1 font-medium">
                    {formatDuration(apmData.transactions.p95Duration)}
                  </span>
                  <span className="mx-1 text-gray-500">|</span>
                  <span className="text-gray-500">P99:</span>
                  <span className="ml-1 font-medium">
                    {formatDuration(apmData.transactions.p99Duration)}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">Errors</h4>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {apmData.errors.total}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {Object.keys(apmData.errors.byType).length > 0 ? (
                    `Top: ${Object.entries(apmData.errors.byType)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 2)
                      .map(([type, count]) => `${type} (${count})`)
                      .join(', ')}`
                  ) : (
                    'No errors'
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">Throughput</h4>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {apmData.throughput.requestsPerMinute.toFixed(1)}/min
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {apmData.throughput.requestsPerSecond.toFixed(2)} requests per second
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end">
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

export default PerformanceMonitoringDashboard;