"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const loggerService_1 = require("./loggerService");
const cacheService_1 = require("./cacheService");
class AnalyticsService {
    constructor() {
        this.events = [];
        this.performanceData = [];
        this.MAX_EVENTS = 10000;
        this.MAX_PERFORMANCE_DATA = 5000;
        setInterval(() => {
            this.cleanupOldData();
            this.aggregateMetrics();
        }, 300000);
        loggerService_1.logger.info('Analytics Service initialized', {
            service: 'analytics',
            metadata: {
                maxEvents: this.MAX_EVENTS,
                maxPerformanceData: this.MAX_PERFORMANCE_DATA
            }
        });
    }
    trackEvent(event) {
        try {
            this.events.push(event);
            if (this.events.length > this.MAX_EVENTS) {
                this.events = this.events.slice(-this.MAX_EVENTS);
            }
            this.cacheEvent(event);
            loggerService_1.logger.debug('User interaction tracked', {
                service: 'analytics',
                metadata: {
                    eventType: event.eventType,
                    sessionId: event.sessionId,
                    timestamp: event.timestamp
                }
            });
        }
        catch (error) {
            loggerService_1.logger.error('Failed to track user interaction', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    trackPerformance(metric, value, metadata) {
        try {
            const performanceEntry = {
                timestamp: new Date(),
                metric,
                value,
                metadata
            };
            this.performanceData.push(performanceEntry);
            if (this.performanceData.length > this.MAX_PERFORMANCE_DATA) {
                this.performanceData = this.performanceData.slice(-this.MAX_PERFORMANCE_DATA);
            }
            loggerService_1.logger.debug('Performance metric tracked', {
                service: 'analytics',
                metadata: {
                    metric,
                    value,
                    timestamp: performanceEntry.timestamp
                }
            });
        }
        catch (error) {
            loggerService_1.logger.error('Failed to track performance metric', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    getUsageMetrics(timeWindow = 3600000) {
        const cutoffTime = new Date(Date.now() - timeWindow);
        const recentEvents = this.events.filter(event => event.timestamp >= cutoffTime);
        const sessions = new Set(recentEvents.map(event => event.sessionId));
        const interactions = recentEvents.filter(event => ['voice_input', 'ai_response', 'tts_output'].includes(event.eventType));
        const sessionDurations = [];
        sessions.forEach(sessionId => {
            const sessionEvents = recentEvents.filter(event => event.sessionId === sessionId);
            if (sessionEvents.length > 1) {
                const startTime = Math.min(...sessionEvents.map(e => e.timestamp.getTime()));
                const endTime = Math.max(...sessionEvents.map(e => e.timestamp.getTime()));
                sessionDurations.push(endTime - startTime);
            }
        });
        const responseTimes = recentEvents
            .filter(event => event.duration !== undefined)
            .map(event => event.duration);
        const errors = recentEvents.filter(event => event.eventType === 'error');
        const errorRate = interactions.length > 0 ? (errors.length / interactions.length) * 100 : 0;
        const featureCounts = {};
        interactions.forEach(event => {
            const feature = event.metadata.feature || event.eventType;
            featureCounts[feature] = (featureCounts[feature] || 0) + 1;
        });
        const popularFeatures = Object.entries(featureCounts)
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const hourCounts = {};
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
    async getPerformanceMetrics(timeWindow = 3600000) {
        const cutoffTime = new Date(Date.now() - timeWindow);
        const recentData = this.performanceData.filter(data => data.timestamp >= cutoffTime);
        const openaiTimes = recentData.filter(d => d.metric === 'openai_response_time').map(d => d.value);
        const groqTimes = recentData.filter(d => d.metric === 'groq_response_time').map(d => d.value);
        const ttsTimes = recentData.filter(d => d.metric === 'tts_response_time').map(d => d.value);
        const cacheStats = await cacheService_1.cacheService.getCacheStats();
        return {
            apiResponseTimes: {
                openai: this.calculatePercentiles(openaiTimes),
                groq: this.calculatePercentiles(groqTimes),
                tts: this.calculatePercentiles(ttsTimes)
            },
            cacheHitRates: {
                aiResponses: cacheStats.hitRate || 0,
                ttsAudio: cacheStats.hitRate || 0,
                userSessions: 0
            },
            systemMetrics: {
                memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                cpuUsage: 0,
                activeConnections: recentData.filter(d => d.metric === 'active_connections').slice(-1)[0]?.value || 0
            }
        };
    }
    getBusinessMetrics(timeWindow = 86400000) {
        const cutoffTime = new Date(Date.now() - timeWindow);
        const recentEvents = this.events.filter(event => event.timestamp >= cutoffTime);
        const consultationRequests = recentEvents.filter(event => event.metadata.requiresProfessionalReferral === true).length;
        const topicCounts = {};
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
        const conversationLengths = recentEvents
            .filter(event => event.metadata.conversationLength !== undefined)
            .map(event => event.metadata.conversationLength);
        const averageConversationLength = conversationLengths.length > 0
            ? conversationLengths.reduce((a, b) => a + b, 0) / conversationLengths.length
            : 0;
        return {
            conversionRate: 0,
            consultationRequests,
            legalTopicDistribution,
            userSatisfactionScore: 0,
            averageConversationLength
        };
    }
    async getDashboardData(timeWindow = 3600000) {
        const usage = this.getUsageMetrics(timeWindow);
        const performance = await this.getPerformanceMetrics(timeWindow);
        const business = this.getBusinessMetrics(timeWindow);
        const realtimeWindow = 300000;
        const recentEvents = this.events.filter(event => event.timestamp >= new Date(Date.now() - realtimeWindow));
        const activeUsers = new Set(recentEvents.map(event => event.sessionId)).size;
        const requestsPerMinute = (recentEvents.length / 5);
        const recentErrors = recentEvents.filter(event => event.eventType === 'error');
        const realtimeErrorRate = recentEvents.length > 0 ? (recentErrors.length / recentEvents.length) * 100 : 0;
        const recentResponseTimes = recentEvents
            .filter(event => event.duration !== undefined)
            .map(event => event.duration);
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
    exportData(format = 'json', timeWindow = 86400000) {
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
    async cacheEvent(event) {
        try {
            const cacheKey = `analytics:event:${event.sessionId}:${event.timestamp.getTime()}`;
            await cacheService_1.cacheService.cacheUserSession(cacheKey, event, { ttl: 86400 });
            this.sendToExternalAnalytics(event);
        }
        catch (error) {
            loggerService_1.logger.debug('Failed to cache analytics event', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    sendToExternalAnalytics(event) {
        try {
            const analyticsProvider = process.env.ANALYTICS_PROVIDER?.toLowerCase();
            if (!analyticsProvider)
                return;
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
        }
        catch (error) {
            loggerService_1.logger.debug('Failed to send to external analytics', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    sendToGoogleAnalytics(event) {
        try {
            const measurementId = process.env.GA_MEASUREMENT_ID;
            const apiSecret = process.env.GA_API_SECRET;
            if (!measurementId || !apiSecret) {
                return;
            }
            loggerService_1.logger.debug('Event would be sent to Google Analytics', {
                service: 'analytics',
                metadata: {
                    eventType: event.eventType,
                    sessionId: event.sessionId
                }
            });
        }
        catch (error) {
            loggerService_1.logger.debug('Failed to send to Google Analytics', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    sendToMixpanel(event) {
        try {
            const projectToken = process.env.MIXPANEL_TOKEN;
            if (!projectToken) {
                return;
            }
            loggerService_1.logger.debug('Event would be sent to Mixpanel', {
                service: 'analytics',
                metadata: {
                    eventType: event.eventType,
                    sessionId: event.sessionId
                }
            });
        }
        catch (error) {
            loggerService_1.logger.debug('Failed to send to Mixpanel', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    sendToSegment(event) {
        try {
            const writeKey = process.env.SEGMENT_WRITE_KEY;
            if (!writeKey) {
                return;
            }
            loggerService_1.logger.debug('Event would be sent to Segment', {
                service: 'analytics',
                metadata: {
                    eventType: event.eventType,
                    sessionId: event.sessionId
                }
            });
        }
        catch (error) {
            loggerService_1.logger.debug('Failed to send to Segment', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    sendToAmplitude(event) {
        try {
            const apiKey = process.env.AMPLITUDE_API_KEY;
            if (!apiKey) {
                return;
            }
            loggerService_1.logger.debug('Event would be sent to Amplitude', {
                service: 'analytics',
                metadata: {
                    eventType: event.eventType,
                    sessionId: event.sessionId
                }
            });
        }
        catch (error) {
            loggerService_1.logger.debug('Failed to send to Amplitude', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    calculateUserRetention(events) {
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
    calculatePercentiles(values) {
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
    cleanupOldData() {
        const cutoffTime = new Date(Date.now() - 86400000);
        this.events = this.events.filter(event => event.timestamp >= cutoffTime);
        this.performanceData = this.performanceData.filter(data => data.timestamp >= cutoffTime);
        loggerService_1.logger.debug('Analytics data cleanup completed', {
            service: 'analytics',
            metadata: {
                eventsCount: this.events.length,
                performanceDataCount: this.performanceData.length
            }
        });
    }
    aggregateMetrics() {
        try {
            const metrics = this.getUsageMetrics();
            this.trackPerformance('total_sessions', metrics.totalSessions);
            this.trackPerformance('total_interactions', metrics.totalInteractions);
            this.trackPerformance('error_rate', metrics.errorRate);
            this.trackPerformance('average_response_time', metrics.averageResponseTime);
            loggerService_1.logger.debug('Metrics aggregation completed', {
                service: 'analytics',
                metadata: {
                    totalSessions: metrics.totalSessions,
                    totalInteractions: metrics.totalInteractions,
                    errorRate: metrics.errorRate
                }
            });
        }
        catch (error) {
            loggerService_1.logger.error('Failed to aggregate metrics', {
                service: 'analytics',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    getServiceStats() {
        return {
            eventsCount: this.events.length,
            performanceDataCount: this.performanceData.length,
            memoryUsage: Math.round((JSON.stringify(this.events).length + JSON.stringify(this.performanceData).length) / 1024),
            oldestEvent: this.events.length > 0 ? this.events[0].timestamp : undefined,
            newestEvent: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : undefined
        };
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analyticsService.js.map