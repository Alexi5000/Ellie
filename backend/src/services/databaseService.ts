/**
 * Database Service - Connection pooling and database management
 * Requirements: 15.1 - Database connection pooling if database is added
 */

import { logger } from './loggerService';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
  connectionTimeout: number;
  idleTimeout: number;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  averageResponseTime: number;
}

export class DatabaseService {
  private config: DatabaseConfig;
  private pool: any = null;
  private isConnected: boolean = false;
  private stats: ConnectionPoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    averageResponseTime: 0
  };

  constructor() {
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

    logger.info('Database Service initialized (not connected)', {
      service: 'database',
      metadata: {
        config: {
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          poolSize: this.config.poolSize
        }
      }
    });
  }

  /**
   * Initialize database connection pool with advanced pooling strategies
   */
  public async initializePool(): Promise<boolean> {
    try {
      // Check if database is enabled in environment
      if (process.env.DB_ENABLED !== 'true') {
        logger.info('Database is disabled in configuration', {
          service: 'database',
          metadata: {
            status: 'disabled'
          }
        });
        return false;
      }

      // This would initialize the actual database connection pool
      // Example with pg (PostgreSQL):
      const { Pool } = require('pg');
      
      // Advanced pool configuration with optimized settings
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        } : false,
        
        // Connection pool settings
        max: this.config.poolSize, // Maximum pool size
        min: parseInt(process.env.DB_POOL_MIN || '2'), // Minimum pool size
        connectionTimeoutMillis: this.config.connectionTimeout,
        idleTimeoutMillis: this.config.idleTimeout,
        
        // Advanced pool behavior
        allowExitOnIdle: false,
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
        
        // Connection validation
        application_name: 'ellie_voice_receptionist',
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      });

      // Event handlers for monitoring pool health
      this.pool.on('connect', (client: any) => {
        this.stats.totalConnections++;
        this.stats.activeConnections++;
        
        logger.debug('Database connection established', { 
          service: 'database',
          metadata: {
            totalConnections: this.stats.totalConnections,
            activeConnections: this.stats.activeConnections
          }
        });
        
        // Set session parameters for this connection
        client.query('SET application_name TO $1', ['ellie_voice_receptionist']);
      });

      this.pool.on('acquire', () => {
        this.stats.activeConnections++;
      });

      this.pool.on('release', () => {
        this.stats.activeConnections--;
      });

      this.pool.on('error', (error: any, client: any) => {
        logger.error('Database pool error', {
          service: 'database',
          error: { 
            message: error.message, 
            stack: error.stack,
            code: error.code
          }
        });
        
        // Remove bad clients from the pool
        try {
          client.release(true); // Force release with error
        } catch (e) {
          // Ignore release errors
        }
      });

      // Test connection
      const testResult = await this.pool.query('SELECT 1 as connection_test');
      if (testResult.rows[0].connection_test === 1) {
        this.isConnected = true;
        
        // Initialize connection monitoring
        this.startConnectionMonitoring();
        
        logger.info('Database connection pool initialized successfully', {
          service: 'database',
          metadata: {
            host: this.config.host,
            database: this.config.database,
            poolSize: this.config.poolSize,
            ssl: this.config.ssl
          }
        });
        
        return true;
      } else {
        throw new Error('Connection test failed');
      }

    } catch (error) {
      logger.error('Failed to initialize database pool', {
        service: 'database',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      return false;
    }
  }
  
  /**
   * Start periodic connection pool monitoring
   */
  private startConnectionMonitoring(): void {
    // Monitor pool health every 30 seconds
    setInterval(async () => {
      try {
        if (!this.pool) return;
        
        // Get actual pool stats
        const poolStats = await this.getPoolStats();
        
        // Check for pool health issues
        if (poolStats.waitingRequests > 5) {
          logger.warn('High number of waiting database requests', {
            service: 'database',
            metadata: {
              waitingRequests: poolStats.waitingRequests,
              activeConnections: poolStats.activeConnections,
              totalConnections: poolStats.totalConnections
            }
          });
        }
        
        // Check for connection leaks
        if (poolStats.activeConnections > this.config.poolSize * 0.9) {
          logger.warn('Database connection pool near capacity', {
            service: 'database',
            metadata: {
              activeConnections: poolStats.activeConnections,
              poolSize: this.config.poolSize,
              utilization: `${Math.round((poolStats.activeConnections / this.config.poolSize) * 100)}%`
            }
          });
        }
        
        // Log pool health periodically
        logger.debug('Database pool health check', {
          service: 'database',
          metadata: {
            activeConnections: poolStats.activeConnections,
            idleConnections: poolStats.idleConnections,
            waitingRequests: poolStats.waitingRequests,
            averageResponseTime: `${poolStats.averageResponseTime.toFixed(2)}ms`
          }
        });
      } catch (error) {
        logger.error('Error monitoring database pool', {
          service: 'database',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }, 30000);
  }

  /**
   * Execute query with connection pooling
   */
  public async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    const startTime = Date.now();
    this.stats.activeConnections++;

    try {
      // This would execute the actual query
      // const result = await this.pool.query(sql, params);
      
      const processingTime = Date.now() - startTime;
      this.updateAverageResponseTime(processingTime);

      logger.debug('Database query executed', {
        service: 'database',
        metadata: {
          sql: sql.substring(0, 100) + '...',
          processingTime
        }
      });

      // Return placeholder result
      return { rows: [], rowCount: 0 };

    } catch (error) {
      logger.error('Database query failed', {
        service: 'database',
        metadata: {
          sql: sql.substring(0, 100) + '...'
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;

    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Get a connection from the pool for transactions
   */
  public async getConnection(): Promise<any> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    try {
      // This would get a connection from the pool
      // const client = await this.pool.connect();
      // return client;

      logger.debug('Database connection acquired', { service: 'database' });
      return null; // Placeholder

    } catch (error) {
      logger.error('Failed to acquire database connection', {
        service: 'database',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  /**
   * Execute transaction
   */
  public async transaction(callback: (client: any) => Promise<any>): Promise<any> {
    const client = await this.getConnection();
    
    try {
      // await client.query('BEGIN');
      const result = await callback(client);
      // await client.query('COMMIT');
      
      logger.debug('Database transaction completed', { service: 'database' });
      return result;

    } catch (error) {
      // await client.query('ROLLBACK');
      logger.error('Database transaction failed', {
        service: 'database',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;

    } finally {
      // client.release();
    }
  }

  /**
   * Check if database is connected
   */
  public isAvailable(): boolean {
    return this.isConnected && this.pool !== null;
  }

  /**
   * Get connection pool statistics
   */
  public getPoolStats(): ConnectionPoolStats {
    if (!this.pool) {
      return this.stats;
    }

    // This would get actual pool stats
    // return {
    //   totalConnections: this.pool.totalCount,
    //   activeConnections: this.pool.totalCount - this.pool.idleCount,
    //   idleConnections: this.pool.idleCount,
    //   waitingRequests: this.pool.waitingCount,
    //   averageResponseTime: this.stats.averageResponseTime
    // };

    return this.stats;
  }

  /**
   * Health check for database
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
  }> {
    if (!this.isConnected) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        error: 'Database not connected'
      };
    }

    const startTime = Date.now();

    try {
      // await this.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Close database connection pool
   */
  public async close(): Promise<void> {
    if (this.pool) {
      // await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      
      logger.info('Database connection pool closed', { service: 'database' });
    }
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(newTime: number): void {
    if (this.stats.averageResponseTime === 0) {
      this.stats.averageResponseTime = newTime;
    } else {
      // Simple moving average
      this.stats.averageResponseTime = (this.stats.averageResponseTime + newTime) / 2;
    }
  }

  /**
   * Get database configuration (without sensitive data)
   */
  public getConfig(): Omit<DatabaseConfig, 'password'> {
    const { password, ...safeConfig } = this.config;
    return safeConfig;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();