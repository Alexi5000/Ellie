/**
 * Business Metrics Dashboard Component
 * Requirements: 15.2 - Create custom dashboards for business metrics
 */

import React, { useState, useEffect } from 'react';

interface BusinessMetricsProps {
  timeWindow?: number;
  refreshInterval?: number;
  title?: string;
  showHeader?: boolean;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'gray';
  icon?: string;
}

const BusinessMetricsDashboard: React.FC<BusinessMetricsProps> = ({
  timeWindow = 86400000, // 24 hours default
  refreshInterval = 300000, // 5 minutes default
  title = 'Business Metrics',
  showHeader = true
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [timeWindow, refreshInterval]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/business?timeWindow=${timeWindow}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getMetricCards = (): MetricCard[] => {
    if (!metrics) return [];
    
    return [
      {
        title: 'Consultation Requests',
        value: metrics.consultationRequests,
        change: 5.2, // Example change value
        changeLabel: 'vs. previous period',
        color: 'blue',
        icon: 'calendar'
      },
      {
        title: 'Conversion Rate',
        value: formatPercentage(metrics.conversionRate),
        change: 0.8, // Example change value
        changeLabel: 'vs. previous period',
        color: 'green',
        icon: 'chart-line'
      },
      {
        title: 'Avg. Conversation Length',
        value: metrics.averageConversationLength.toFixed(1),
        change: -0.3, // Example change value
        changeLabel: 'vs. previous period',
        color: 'purple',
        icon: 'comments'
      },
      {
        title: 'User Satisfaction',
        value: formatPercentage(metrics.userSatisfactionScore),
        change: 2.1, // Example change value
        changeLabel: 'vs. previous period',
        color: 'yellow',
        icon: 'smile'
      }
    ];
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
          onClick={fetchMetrics}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const metricCards = getMetricCards();

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
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metricCards.map((card, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                  <p className={`text-2xl font-bold mt-1 text-${card.color}-600`}>
                    {card.value}
                  </p>
                </div>
                {card.icon && (
                  <div className={`p-2 rounded-full bg-${card.color}-100 text-${card.color}-600`}>
                    <span className={`fas fa-${card.icon}`}></span>
                  </div>
                )}
              </div>
              {card.change !== undefined && (
                <div className="mt-2 flex items-center">
                  <span className={`text-xs ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}%
                  </span>
                  {card.changeLabel && (
                    <span className="text-xs text-gray-500 ml-1">{card.changeLabel}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Topic Distribution */}
        {metrics && metrics.legalTopicDistribution && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Legal Topic Distribution</h3>
            <div className="space-y-3">
              {metrics.legalTopicDistribution.slice(0, 5).map((topic: any, index: number) => (
                <div key={index} className="flex items-center">
                  <span className="text-sm text-gray-600 w-32 truncate">{topic.topic}</span>
                  <div className="flex-1 mx-2">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{ width: `${topic.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {formatPercentage(topic.percentage)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={fetchMetrics}
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

export default BusinessMetricsDashboard;