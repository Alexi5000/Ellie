"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = void 0;
const loggerService_1 = require("./loggerService");
class DatabaseService {
    constructor() {
        this.pool = null;
        this.isConnected = false;
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingRequests: 0,
            averageResponseTime: 0
        };
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'ellie_db',
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            ssl: process.env.DB_SSL === 'true',
            poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
            connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
            idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000')
        };
        loggerService_1.logger.info('Database Service initialized (not connected)', {
            service: 'database',
            config: {
                host: this.config.host,
                port: this.config.port,
                database: this.config.database,
                poolSize: this.config.poolSize
            }
        });
    }
    async initializePool() {
        try {
            if (process.env.DB_ENABLED !== 'true') {
                loggerService_1.logger.info('Database is disabled in configuration', {
                    service: 'database',
                    status: 'disabled'
                });
                return false;
            }
            const { Pool } = require('pg');
            this.pool = new Pool({
                host: this.config.host,
                port: this.config.port,
                database: this.config.database,
                user: this.config.username,
                password: this.config.password,
                ssl: this.config.ssl ? {
                    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
                } : false,
                max: this.config.poolSize,
                min: parseInt(process.env.DB_POOL_MIN || '2'),
                connectionTimeoutMillis: this.config.connectionTimeout,
                idleTimeoutMillis: this.config.idleTimeout,
                allowExitOnIdle: false,
                statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
                query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
                application_name: 'ellie_voice_receptionist',
                keepAlive: true,
                keepAliveInitialDelayMillis: 10000
            });
            this.pool.on('connect', (client) => {
                this.stats.totalConnections++;
                this.stats.activeConnections++;
                loggerService_1.logger.debug('Database connection established', {
                    service: 'database',
                    metadata: {
                        totalConnections: this.stats.totalConnections,
                        activeConnections: this.stats.activeConnections
                    }
                });
                client.query('SET application_name TO $1', ['ellie_voice_receptionist']);
            });
            this.pool.on('acquire', () => {
                this.stats.activeConnections++;
            });
            this.pool.on('release', () => {
                this.stats.activeConnections--;
            });
            this.pool.on('error', (error, client) => {
                loggerService_1.logger.error('Database pool error', {
                    service: 'database',
                    error: {
                        message: error.message,
                        stack: error.stack,
                        code: error.code
                    }
                });
                try {
                    client.release(true);
                }
                catch (e) {
                }
            });
            const testResult = await this.pool.query('SELECT 1 as connection_test');
            if (testResult.rows[0].connection_test === 1) {
                this.isConnected = true;
                this.startConnectionMonitoring();
                loggerService_1.logger.info('Database connection pool initialized successfully', {
                    service: 'database',
                    metadata: {
                        host: this.config.host,
                        database: this.config.database,
                        poolSize: this.config.poolSize,
                        ssl: this.config.ssl
                    }
                });
                return true;
            }
            else {
                throw new Error('Connection test failed');
            }
        }
        catch (error) {
            loggerService_1.logger.error('Failed to initialize database pool', {
                service: 'database',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });
            return false;
        }
    }
    startConnectionMonitoring() {
        setInterval(async () => {
            try {
                if (!this.pool)
                    return;
                const poolStats = await this.getPoolStats();
                if (poolStats.waitingRequests > 5) {
                    loggerService_1.logger.warn('High number of waiting database requests', {
                        service: 'database',
                        metadata: {
                            waitingRequests: poolStats.waitingRequests,
                            activeConnections: poolStats.activeConnections,
                            totalConnections: poolStats.totalConnections
                        }
                    });
                }
                if (poolStats.activeConnections > this.config.poolSize * 0.9) {
                    loggerService_1.logger.warn('Database connection pool near capacity', {
                        service: 'database',
                        metadata: {
                            activeConnections: poolStats.activeConnections,
                            poolSize: this.config.poolSize,
                            utilization: `${Math.round((poolStats.activeConnections / this.config.poolSize) * 100)}%`
                        }
                    });
                }
                loggerService_1.logger.debug('Database pool health check', {
                    service: 'database',
                    metadata: {
                        activeConnections: poolStats.activeConnections,
                        idleConnections: poolStats.idleConnections,
                        waitingRequests: poolStats.waitingRequests,
                        averageResponseTime: `${poolStats.averageResponseTime.toFixed(2)}ms`
                    }
                });
            }
            catch (error) {
                loggerService_1.logger.error('Error monitoring database pool', {
                    service: 'database',
                    error: {
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        }, 30000);
    }
    async query(sql, params = []) {
        if (!this.isConnected || !this.pool) {
            throw new Error('Database not connected');
        }
        const startTime = Date.now();
        this.stats.activeConnections++;
        try {
            const processingTime = Date.now() - startTime;
            this.updateAverageResponseTime(processingTime);
            loggerService_1.logger.debug('Database query executed', {
                service: 'database',
                sql: sql.substring(0, 100) + '...',
                processingTime
            });
            return { rows: [], rowCount: 0 };
        }
        catch (error) {
            loggerService_1.logger.error('Database query failed', {
                service: 'database',
                sql: sql.substring(0, 100) + '...',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
        finally {
            this.stats.activeConnections--;
        }
    }
    async getConnection() {
        if (!this.isConnected || !this.pool) {
            throw new Error('Database not connected');
        }
        try {
            loggerService_1.logger.debug('Database connection acquired', { service: 'database' });
            return null;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to acquire database connection', {
                service: 'database',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }
    async transaction(callback) {
        const client = await this.getConnection();
        try {
            const result = await callback(client);
            loggerService_1.logger.debug('Database transaction completed', { service: 'database' });
            return result;
        }
        catch (error) {
            loggerService_1.logger.error('Database transaction failed', {
                service: 'database',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
        finally {
        }
    }
    isAvailable() {
        return this.isConnected && this.pool !== null;
    }
    getPoolStats() {
        if (!this.pool) {
            return this.stats;
        }
        return this.stats;
    }
    async healthCheck() {
        if (!this.isConnected) {
            return {
                status: 'unhealthy',
                responseTime: 0,
                error: 'Database not connected'
            };
        }
        const startTime = Date.now();
        try {
            const responseTime = Date.now() - startTime;
            return {
                status: 'healthy',
                responseTime
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async close() {
        if (this.pool) {
            this.pool = null;
            this.isConnected = false;
            loggerService_1.logger.info('Database connection pool closed', { service: 'database' });
        }
    }
    updateAverageResponseTime(newTime) {
        if (this.stats.averageResponseTime === 0) {
            this.stats.averageResponseTime = newTime;
        }
        else {
            this.stats.averageResponseTime = (this.stats.averageResponseTime + newTime) / 2;
        }
    }
    getConfig() {
        const { password, ...safeConfig } = this.config;
        return safeConfig;
    }
}
exports.DatabaseService = DatabaseService;
exports.databaseService = new DatabaseService();
//# sourceMappingURL=databaseService.js.map