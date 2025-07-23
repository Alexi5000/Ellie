/**
 * Business Metrics Dashboard Component
 * Requirements: 15.2 - Create custom dashboards for business metrics
 */

import React, { useState, useEffect } from 'react';

interface BusinessMetrics {
  conversionRate: number;
  consultationRequests: number;
  legalTopicDistribution: Array<{ topic: string; percentage: number }>;
  userSatisfactionScore: number;
  averageConversationLength: number;
}

interface UsageMetrics {
  totalSessions: number;
  totalInteractions: number;
  averageSessionDuration: number;
  averageResponseTime: number;
  errorRate: number;
  popularFeatures: Array<{ feature: string; count: number }>;
  peakUsageHours: Array<{ hour: number; count: number }>;
}

interface PerformanceMetrics {
  apiResponseTimes: {
    openai: { average: number; p95: number; p99: number };
    groq: { average: number; p95: number; p99: number };
    tts: { average: number; p95: number; p99: number };
  };
  cacheHitRates: {
    aiResponses: number;
    ttsAudio: number;
    userSessions: number;
  };
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

interface DashboardData {
  usage: UsageMetrics;
  performance: PerformanceMetrics;
  business: BusinessMetrics;
  realTimeStats: {
    activeUsers: number;
    requestsPerMinute: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

const BusinessDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState(3600000); // 1 hour default
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [timeWindow, refreshInterval]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/analytics/dashboard?timeWindow=${timeWindow}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Ellie Analytics Dashboard
          </h1>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refresh Rate
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
              </select>
            </div>
            
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-6"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-blue-600">
              {dashboardData.realTimeStats.activeUsers}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Requests/Min</h3>
            <p className="text-3xl font-bold text-green-600">
              {dashboardData.realTimeStats.requestsPerMinute.toFixed(1)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Error Rate</h3>
            <p className="text-3xl font-bold text-red-600">
              {formatPercentage(dashboardData.realTimeStats.errorRate)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Response</h3>
            <p className="text-3xl font-bold text-purple-600">
              {formatDuration(dashboardData.realTimeStats.averageResponseTime)}
            </p>
          </div>
        </div>

        {/* Usage Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sessions</span>
                <span className="font-semibold">{formatNumber(dashboardData.usage.totalSessions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Interactions</span>
                <span className="font-semibold">{formatNumber(dashboardData.usage.totalInteractions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Session Duration</span>
                <span className="font-semibold">{formatDuration(dashboardData.usage.averageSessionDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response Time</span>
                <span className="font-semibold">{formatDuration(dashboardData.usage.averageResponseTime)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Features</h3>
            <div className="space-y-3">
              {dashboardData.usage.popularFeatures.slice(0, 5).map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600 capitalize">{feature.feature}</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(feature.count / dashboardData.usage.popularFeatures[0].count) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="font-semibold text-sm">{feature.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Response Times</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">OpenAI</span>
                  <span className="text-sm font-semibold">{formatDuration(dashboardData.performance.apiResponseTimes.openai.average)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  P95: {formatDuration(dashboardData.performance.apiResponseTimes.openai.p95)} | 
                  P99: {formatDuration(dashboardData.performance.apiResponseTimes.openai.p99)}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Groq</span>
                  <span className="text-sm font-semibold">{formatDuration(dashboardData.performance.apiResponseTimes.groq.average)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  P95: {formatDuration(dashboardData.performance.apiResponseTimes.groq.p95)} | 
                  P99: {formatDuration(dashboardData.performance.apiResponseTimes.groq.p99)}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">TTS</span>
                  <span className="text-sm font-semibold">{formatDuration(dashboardData.performance.apiResponseTimes.tts.average)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  P95: {formatDuration(dashboardData.performance.apiResponseTimes.tts.p95)} | 
                  P99: {formatDuration(dashboardData.performance.apiResponseTimes.tts.p99)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Hit Rates</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">AI Responses</span>
                <span className="font-semibold text-green-600">
                  {formatPercentage(dashboardData.performance.cacheHitRates.aiResponses)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">TTS Audio</span>
                <span className="font-semibold text-green-600">
                  {formatPercentage(dashboardData.performance.cacheHitRates.ttsAudio)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">User Sessions</span>
                <span className="font-semibold text-green-600">
                  {formatPercentage(dashboardData.performance.cacheHitRates.userSessions)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-semibold">{dashboardData.performance.systemMetrics.memoryUsage}MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Connections</span>
                <span className="font-semibold">{dashboardData.performance.systemMetrics.activeConnections}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Consultation Requests</span>
                <span className="font-semibold text-blue-600">{dashboardData.business.consultationRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Conversation Length</span>
                <span className="font-semibold">{dashboardData.business.averageConversationLength.toFixed(1)} messages</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Topic Distribution</h3>
            <div className="space-y-3">
              {dashboardData.business.legalTopicDistribution.slice(0, 5).map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600 capitalize">{topic.topic}</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${topic.percentage}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-sm">{formatPercentage(topic.percentage)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;