/**
 * Analytics Service - User interaction analytics and usage metrics
 * Requirements: 15.2 - Advanced monitoring and analytics
 */

import { logger } from './loggerService';
import { cacheService } from './cacheService';

export interface UserInteractionEvent {
  eventType: 'voice_input' | 'ai_response' | 'tts_output' | 'error' | 'session_start' | 'session_end';
  sessionId: string;
  userId?: string;
  timestamp: Date;
  duration?: number;
  metadata: {
    [key: string]: any;
  };
}

export interface UsageMetrics {
  totalSessions: number;
  totalInteractions: number;
  averageSessionDuration: number;
  averageResponseTime: number;
  errorRate: number;
  popularFeatures: Array<{ feature: string; count: number }>;
  peakUsageHours: Array<{ hour: number; count: number }>;
  userRetention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface PerformanceMetrics {
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

export interface BusinessMetrics {
  conversionRate: number;
  consultationRequests: number;
  legalTopicDistribution: Array<{ topic: string; percentage: number }>;
  userSatisfactionScore: number;
  averageConversationLength: number;
}

export class AnalyticsService {
  private events: UserInteractionEvent[] = [];
  private performanceData: Array<{ timestamp: Date; metric: string; value: number; metadata?: any }> = [];
  private readonly MAX_EVENTS = 10000; // Keep last 10k events in memory
  private readonly MAX_PERFORMANCE_DATA = 5000; // Keep last 5k performance data points

  constructor() {
    // Start periodic cleanup and aggregation
    setInterval(() => {
      this.cleanupOldData();
      this.aggregateMetrics();
    }, 300000); // Every 5 minutes

    logger.info('Analytics Service initialized', {
      service: 'analytics',
      metadata: {
        maxEvents: this.MAX_EVENTS,
        maxPerformanceData: this.MAX_PERFORMANCE_DATA
      }
    });
  }

  /**
   * Track user interaction event
   */
  public trackEvent(event: UserInteractionEvent): void {
    try {
      // Add event to memory store
      this.events.push(event);

      // Maintain memory limits
      if (this.events.length > this.MAX_EVENTS) {
        this.events = this.events.slice(-this.MAX_EVENTS);
      }

      // Cache event for persistence (optional)
      this.cacheEvent(event);

      logger.debug('User interaction tracked', {
        service: 'analytics',
        metadata: {
          eventType: event.eventType,
          sessionId: event.sessionId,
          timestamp: event.timestamp
        }
      });

    } catch (error) {
      logger.error('Failed to track user interaction', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Track performance metric
   */
  public trackPerformance(metric: string, value: number, metadata?: any): void {
    try {
      const performanceEntry = {
        timestamp: new Date(),
        metric,
        value,
        metadata
      };

      this.performanceData.push(performanceEntry);

      // Maintain memory limits
      if (this.performanceData.length > this.MAX_PERFORMANCE_DATA) {
        this.performanceData = this.performanceData.slice(-this.MAX_PERFORMANCE_DATA);
      }

      logger.debug('Performance metric tracked', {
        service: 'analytics',
        metadata: {
          metric,
          value,
          timestamp: performanceEntry.timestamp
        }
      });

    } catch (error) {
      logger.error('Failed to track performance metric', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get usage metrics for a time period
   */
  public getUsageMetrics(timeWindow: number = 3600000): UsageMetrics {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const recentEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    const sessions = new Set(recentEvents.map(event => event.sessionId));
    const interactions = recentEvents.filter(event => 
      ['voice_input', 'ai_response', 'tts_output'].includes(event.eventType)
    );

    // Calculate session durations
    const sessionDurations: number[] = [];
    sessions.forEach(sessionId => {
      const sessionEvents = recentEvents.filter(event => event.sessionId === sessionId);
      if (sessionEvents.length > 1) {
        const startTime = Math.min(...sessionEvents.map(e => e.timestamp.getTime()));
        const endTime = Math.max(...sessionEvents.map(e => e.timestamp.getTime()));
        sessionDurations.push(endTime - startTime);
      }
    });

    // Calculate response times
    const responseTimes = recentEvents
      .filter(event => event.duration !== undefined)
      .map(event => event.duration!);

    // Calculate error rate
    const errors = recentEvents.filter(event => event.eventType === 'error');
    const errorRate = interactions.length > 0 ? (errors.length / interactions.length) * 100 : 0;

    // Popular features
    const featureCounts: { [key: string]: number } = {};
    interactions.forEach(event => {
      const feature = event.metadata.feature || event.eventType;
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });

    const popularFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Peak usage hours
    const hourCounts: { [key: number]: number } = {};
    recentEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakUsageHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSessions: sessions.size,
      totalInteractions: interactions.length,
      averageSessionDuration: sessionDurations.length > 0 
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length 
        : 0,
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0,
      errorRate,
      popularFeatures,
      peakUsageHours,
      userRetention: this.calculateUserRetention(recentEvents)
    };
  }

  /**
   * Get performance metrics
   */
  public async getPerformanceMetrics(timeWindow: number = 3600000): Promise<PerformanceMetrics> {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const recentData = this.performanceData.filter(data => data.timestamp >= cutoffTime);

    // API response times
    const openaiTimes = recentData.filter(d => d.metric === 'openai_response_time').map(d => d.value);
    const groqTimes = recentData.filter(d => d.metric === 'groq_response_time').map(d => d.value);
    const ttsTimes = recentData.filter(d => d.metric === 'tts_response_time').map(d => d.value);

    // Cache hit rates
    const cacheStats = await cacheService.getCacheStats();

    return {
      apiResponseTimes: {
        openai: this.calculatePercentiles(openaiTimes),
        groq: this.calculatePercentiles(groqTimes),
        tts: this.calculatePercentiles(ttsTimes)
      },
      cacheHitRates: {
        aiResponses: cacheStats.hitRate || 0,
        ttsAudio: cacheStats.hitRate || 0,
        userSessions: 0 // Placeholder
      },
      systemMetrics: {
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpuUsage: 0, // Would need additional monitoring
        activeConnections: recentData.filter(d => d.metric === 'active_connections').slice(-1)[0]?.value || 0
      }
    };
  }

  /**
   * Get business metrics
   */
  public getBusinessMetrics(timeWindow: number = 86400000): BusinessMetrics {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const recentEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    // Consultation requests
    const consultationRequests = recentEvents.filter(event => 
      event.metadata.requiresProfessionalReferral === true
    ).length;

    // Legal topic distribution
    const topicCounts: { [key: string]: number } = {};
    recentEvents.forEach(event => {
      const topic = event.metadata.legalTopic;
      if (topic) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    });

    const totalTopics = Object.values(topicCounts).reduce((a, b) => a + b, 0);
    const legalTopicDistribution = Object.entries(topicCounts)
      .map(([topic, count]) => ({ 
        topic, 
        percentage: totalTopics > 0 ? (count / totalTopics) * 100 : 0 
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Average conversation length
    const conversationLengths = recentEvents
      .filter(event => event.metadata.conversationLength !== undefined)
      .map(event => event.metadata.conversationLength);

    const averageConversationLength = conversationLengths.length > 0
      ? conversationLengths.reduce((a, b) => a + b, 0) / conversationLengths.length
      : 0;

    return {
      conversionRate: 0, // Would need conversion tracking
      consultationRequests,
      legalTopicDistribution,
      userSatisfactionScore: 0, // Would need user feedback
      averageConversationLength
    };
  }

  /**
   * Generate analytics dashboard data
   */
  public async getDashboardData(timeWindow: number = 3600000): Promise<{
    usage: UsageMetrics;
    performance: PerformanceMetrics;
    business: BusinessMetrics;
    realTimeStats: {
      activeUsers: number;
      requestsPerMinute: number;
      errorRate: number;
      averageResponseTime: number;
    };
  }> {
    const usage = this.getUsageMetrics(timeWindow);
    const performance = await this.getPerformanceMetrics(timeWindow);
    const business = this.getBusinessMetrics(timeWindow);

    // Real-time stats (last 5 minutes)
    const realtimeWindow = 300000; // 5 minutes
    const recentEvents = this.events.filter(event => 
      event.timestamp >= new Date(Date.now() - realtimeWindow)
    );

    const activeUsers = new Set(recentEvents.map(event => event.sessionId)).size;
    const requestsPerMinute = (recentEvents.length / 5); // 5 minute window
    const recentErrors = recentEvents.filter(event => event.eventType === 'error');
    const realtimeErrorRate = recentEvents.length > 0 ? (recentErrors.length / recentEvents.length) * 100 : 0;

    const recentResponseTimes = recentEvents
      .filter(event => event.duration !== undefined)
      .map(event => event.duration!);
    const realtimeAvgResponseTime = recentResponseTimes.length > 0
      ? recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length
      : 0;

    return {
      usage,
      performance,
      business,
      realTimeStats: {
        activeUsers,
        requestsPerMinute,
        errorRate: realtimeErrorRate,
        averageResponseTime: realtimeAvgResponseTime
      }
    };
  }

  /**
   * Export analytics data for external systems
   */
  public exportData(format: 'json' | 'csv' = 'json', timeWindow: number = 86400000): string {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const exportEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    if (format === 'csv') {
      const headers = ['timestamp', 'eventType', 'sessionId', 'userId', 'duration', 'metadata'];
      const rows = exportEvents.map(event => [
        event.timestamp.toISOString(),
        event.eventType,
        event.sessionId,
        event.userId || '',
        event.duration || '',
        JSON.stringify(event.metadata)
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(exportEvents, null, 2);
  }

  /**
   * Cache event for persistence
   */
  private async cacheEvent(event: UserInteractionEvent): Promise<void> {
    try {
      const cacheKey = `analytics:event:${event.sessionId}:${event.timestamp.getTime()}`;
      await cacheService.cacheUserSession(cacheKey, event, { ttl: 86400 }); // 24 hours
      
      // Send to external analytics service if configured
      this.sendToExternalAnalytics(event);
    } catch (error) {
      // Silently fail - analytics shouldn't break the main flow
      logger.debug('Failed to cache analytics event', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * Send event to external analytics service
   */
  private sendToExternalAnalytics(event: UserInteractionEvent): void {
    try {
      const analyticsProvider = process.env.ANALYTICS_PROVIDER?.toLowerCase();
      if (!analyticsProvider) return;
      
      switch (analyticsProvider) {
        case 'google':
          this.sendToGoogleAnalytics(event);
          break;
          
        case 'mixpanel':
          this.sendToMixpanel(event);
          break;
          
        case 'segment':
          this.sendToSegment(event);
          break;
          
        case 'amplitude':
          this.sendToAmplitude(event);
          break;
      }
    } catch (error) {
      logger.debug('Failed to send to external analytics', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * Send event to Google Analytics
   */
  private sendToGoogleAnalytics(event: UserInteractionEvent): void {
    try {
      const measurementId = process.env.GA_MEASUREMENT_ID;
      const apiSecret = process.env.GA_API_SECRET;
      
      if (!measurementId || !apiSecret) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using Google Analytics 4 Measurement Protocol
      /*
      const fetch = require('node-fetch');
      
      const payload = {
        client_id: event.sessionId,
        events: [{
          name: event.eventType,
          params: {
            ...event.metadata,
            timestamp_micros: event.timestamp.getTime() * 1000
          }
        }]
      };
      
      fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      */
      
      logger.debug('Event would be sent to Google Analytics', {
        service: 'analytics',
        metadata: {
          eventType: event.eventType,
          sessionId: event.sessionId
        }
      });
    } catch (error) {
      logger.debug('Failed to send to Google Analytics', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * Send event to Mixpanel
   */
  private sendToMixpanel(event: UserInteractionEvent): void {
    try {
      const projectToken = process.env.MIXPANEL_TOKEN;
      
      if (!projectToken) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using Mixpanel HTTP API
      /*
      const Mixpanel = require('mixpanel');
      const mixpanel = Mixpanel.init(projectToken);
      
      mixpanel.track(event.eventType, {
        distinct_id: event.sessionId,
        time: event.timestamp.getTime(),
        ...event.metadata
      });
      */
      
      logger.debug('Event would be sent to Mixpanel', {
        service: 'analytics',
        metadata: {
          eventType: event.eventType,
          sessionId: event.sessionId
        }
      });
    } catch (error) {
      logger.debug('Failed to send to Mixpanel', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * Send event to Segment
   */
  private sendToSegment(event: UserInteractionEvent): void {
    try {
      const writeKey = process.env.SEGMENT_WRITE_KEY;
      
      if (!writeKey) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using Segment Node SDK
      /*
      const Analytics = require('analytics-node');
      const analytics = new Analytics(writeKey);
      
      analytics.track({
        userId: event.userId || event.sessionId,
        anonymousId: !event.userId ? event.sessionId : undefined,
        event: event.eventType,
        properties: event.metadata,
        timestamp: event.timestamp
      });
      */
      
      logger.debug('Event would be sent to Segment', {
        service: 'analytics',
        metadata: {
          eventType: event.eventType,
          sessionId: event.sessionId
        }
      });
    } catch (error) {
      logger.debug('Failed to send to Segment', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * Send event to Amplitude
   */
  private sendToAmplitude(event: UserInteractionEvent): void {
    try {
      const apiKey = process.env.AMPLITUDE_API_KEY;
      
      if (!apiKey) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using Amplitude HTTP API
      /*
      const fetch = require('node-fetch');
      
      const payload = {
        api_key: apiKey,
        events: [{
          user_id: event.userId,
          device_id: event.sessionId,
          event_type: event.eventType,
          event_properties: event.metadata,
          time: event.timestamp.getTime()
        }]
      };
      
      fetch('https://api.amplitude.com/2/httpapi', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      */
      
      logger.debug('Event would be sent to Amplitude', {
        service: 'analytics',
        metadata: {
          eventType: event.eventType,
          sessionId: event.sessionId
        }
      });
    } catch (error) {
      logger.debug('Failed to send to Amplitude', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Calculate user retention metrics
   */
  private calculateUserRetention(events: UserInteractionEvent[]): {
    daily: number;
    weekly: number;
    monthly: number;
  } {
    // This is a simplified calculation - in production, you'd want more sophisticated retention tracking
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000);
    const oneWeekAgo = new Date(now.getTime() - 604800000);
    const oneMonthAgo = new Date(now.getTime() - 2592000000);

    const dailyUsers = new Set(events.filter(e => e.timestamp >= oneDayAgo).map(e => e.sessionId));
    const weeklyUsers = new Set(events.filter(e => e.timestamp >= oneWeekAgo).map(e => e.sessionId));
    const monthlyUsers = new Set(events.filter(e => e.timestamp >= oneMonthAgo).map(e => e.sessionId));

    return {
      daily: dailyUsers.size,
      weekly: weeklyUsers.size,
      monthly: monthlyUsers.size
    };
  }

  /**
   * Calculate percentiles for response times
   */
  private calculatePercentiles(values: number[]): { average: number; p95: number; p99: number } {
    if (values.length === 0) {
      return { average: 0, p95: 0, p99: 0 };
    }

    const sorted = values.sort((a, b) => a - b);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      average,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0
    };
  }

  /**
   * Clean up old data to prevent memory leaks
   */
  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - 86400000); // Keep 24 hours of data

    this.events = this.events.filter(event => event.timestamp >= cutoffTime);
    this.performanceData = this.performanceData.filter(data => data.timestamp >= cutoffTime);

    logger.debug('Analytics data cleanup completed', {
      service: 'analytics',
      metadata: {
        eventsCount: this.events.length,
        performanceDataCount: this.performanceData.length
      }
    });
  }

  /**
   * Aggregate metrics for reporting
   */
  private aggregateMetrics(): void {
    try {
      const metrics = this.getUsageMetrics();
      
      // Track aggregated metrics as performance data
      this.trackPerformance('total_sessions', metrics.totalSessions);
      this.trackPerformance('total_interactions', metrics.totalInteractions);
      this.trackPerformance('error_rate', metrics.errorRate);
      this.trackPerformance('average_response_time', metrics.averageResponseTime);

      logger.debug('Metrics aggregation completed', {
        service: 'analytics',
        metadata: {
          totalSessions: metrics.totalSessions,
          totalInteractions: metrics.totalInteractions,
          errorRate: metrics.errorRate
        }
      });

    } catch (error) {
      logger.error('Failed to aggregate metrics', {
        service: 'analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get service statistics
   */
  public getServiceStats(): {
    eventsCount: number;
    performanceDataCount: number;
    memoryUsage: number;
    oldestEvent?: Date;
    newestEvent?: Date;
  } {
    return {
      eventsCount: this.events.length,
      performanceDataCount: this.performanceData.length,
      memoryUsage: Math.round((JSON.stringify(this.events).length + JSON.stringify(this.performanceData).length) / 1024),
      oldestEvent: this.events.length > 0 ? this.events[0].timestamp : undefined,
      newestEvent: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : undefined
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();