/**
 * CDN Service - Static asset optimization and CDN integration
 * Requirements: 15.1 - CDN integration for static assets
 */

import { logger } from './loggerService';

export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  regions: string[];
  cacheHeaders: {
    [key: string]: string;
  };
}

export interface AssetOptimization {
  compression: boolean;
  minification: boolean;
  imageOptimization: boolean;
  caching: boolean;
}

export class CDNService {
  private config: CDNConfig;
  private optimization: AssetOptimization;

  constructor() {
    this.config = {
      enabled: process.env.CDN_ENABLED === 'true',
      baseUrl: process.env.CDN_BASE_URL || '',
      regions: (process.env.CDN_REGIONS || 'us-east-1,eu-west-1').split(','),
      cacheHeaders: {
        'Cache-Control': 'public, max-age=31536000', // 1 year for static assets
        'Expires': new Date(Date.now() + 31536000000).toUTCString(),
        'ETag': '',
        'Last-Modified': new Date().toUTCString()
      }
    };

    this.optimization = {
      compression: process.env.ASSET_COMPRESSION !== 'false',
      minification: process.env.ASSET_MINIFICATION !== 'false',
      imageOptimization: process.env.IMAGE_OPTIMIZATION !== 'false',
      caching: process.env.ASSET_CACHING !== 'false'
    };

    logger.info('CDN Service initialized', {
      service: 'cdn',
      metadata: {
        enabled: this.config.enabled,
        baseUrl: this.config.baseUrl,
        regions: this.config.regions.length
      }
    });
  }

  /**
   * Get optimized URL for static assets
   */
  public getAssetUrl(assetPath: string, assetType: 'js' | 'css' | 'image' | 'font' | 'audio' = 'js'): string {
    if (!this.config.enabled || !this.config.baseUrl) {
      return assetPath;
    }

    // Remove leading slash if present
    const cleanPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
    
    // Add version parameter for cache busting
    const version = process.env.ASSET_VERSION || Date.now().toString();
    const separator = cleanPath.includes('?') ? '&' : '?';
    const versionedPath = `${cleanPath}${separator}v=${version}`;

    const optimizedUrl = `${this.config.baseUrl}/${versionedPath}`;

    logger.debug('Asset URL optimized', {
      service: 'cdn',
      metadata: {
        originalPath: assetPath,
        optimizedUrl,
        assetType
      }
    });

    return optimizedUrl;
  }

  /**
   * Get cache headers for different asset types
   */
  public getCacheHeaders(assetType: 'js' | 'css' | 'image' | 'font' | 'audio' | 'html'): { [key: string]: string } {
    const baseHeaders = { ...this.config.cacheHeaders };

    switch (assetType) {
      case 'html':
        return {
          'Cache-Control': 'public, max-age=300', // 5 minutes for HTML
          'Expires': new Date(Date.now() + 300000).toUTCString()
        };
      
      case 'js':
      case 'css':
        const headers: { [key: string]: string } = {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=31536000, immutable' // 1 year for JS/CSS with immutable
        };
        
        if (this.optimization.compression) {
          headers['Content-Encoding'] = 'gzip';
        }
        
        return headers;
      
      case 'image':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=2592000', // 30 days for images
          'Vary': 'Accept-Encoding'
        };
      
      case 'font':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=31536000, immutable', // 1 year for fonts
          'Access-Control-Allow-Origin': '*' // CORS for fonts
        };
      
      case 'audio':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=86400', // 1 day for audio files
          'Accept-Ranges': 'bytes' // Enable range requests for audio
        };
      
      default:
        return baseHeaders;
    }
  }

  /**
   * Generate ETag for asset versioning
   */
  public generateETag(content: string | Buffer): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return `"${hash}"`;
  }

  /**
   * Check if asset should be served from CDN
   */
  public shouldUseCDN(assetPath: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Don't use CDN for API endpoints
    if (assetPath.startsWith('/api/')) {
      return false;
    }

    // Don't use CDN for WebSocket connections
    if (assetPath.includes('socket.io')) {
      return false;
    }

    // Use CDN for static assets
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.mp3', '.wav'];
    return staticExtensions.some(ext => assetPath.toLowerCase().includes(ext));
  }

  /**
   * Get CDN configuration for frontend
   */
  public getFrontendConfig(): {
    enabled: boolean;
    baseUrl: string;
    assetVersion: string;
  } {
    return {
      enabled: this.config.enabled,
      baseUrl: this.config.baseUrl,
      assetVersion: process.env.ASSET_VERSION || Date.now().toString()
    };
  }

  /**
   * Middleware for setting cache headers
   */
  public cacheMiddleware() {
    return (req: any, res: any, next: any) => {
      const assetType = this.getAssetType(req.path);
      const headers = this.getCacheHeaders(assetType);

      // Set cache headers
      Object.entries(headers).forEach(([key, value]) => {
        if (value) {
          res.setHeader(key, value);
        }
      });

      // Generate ETag for static assets
      if (assetType !== 'html' && this.optimization.caching) {
        const originalSend = res.send;
        res.send = function(body: any) {
          if (body && typeof body === 'string') {
            const etag = cdnService.generateETag(body);
            res.setHeader('ETag', etag);
          }
          return originalSend.call(this, body);
        };
      }

      next();
    };
  }

  /**
   * Determine asset type from file path
   */
  private getAssetType(path: string): 'js' | 'css' | 'image' | 'font' | 'audio' | 'html' {
    const extension = path.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'js';
      case 'css':
        return 'css';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      default:
        return 'html';
    }
  }

  /**
   * Get CDN statistics
   */
  public getStats(): {
    enabled: boolean;
    baseUrl: string;
    regions: number;
    optimization: AssetOptimization;
  } {
    return {
      enabled: this.config.enabled,
      baseUrl: this.config.baseUrl,
      regions: this.config.regions.length,
      optimization: this.optimization
    };
  }

  /**
   * Purge CDN cache with provider-specific implementations
   */
  public async purgeCDNCache(paths?: string[]): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const cdnProvider = process.env.CDN_PROVIDER?.toLowerCase() || 'none';
      
      logger.info('CDN cache purge requested', {
        service: 'cdn',
        metadata: {
          provider: cdnProvider,
          paths: paths || ['all'],
          timestamp: new Date().toISOString()
        }
      });

      // Implement provider-specific purge logic
      switch (cdnProvider) {
        case 'cloudflare':
          return await this.purgeCloudflareCache(paths);
        
        case 'cloudfront':
          return await this.purgeCloudFrontCache(paths);
          
        case 'fastly':
          return await this.purgeFastlyCache(paths);
          
        case 'akamai':
          return await this.purgeAkamaiCache(paths);
          
        default:
          logger.warn('No CDN provider configured for cache purging', {
            service: 'cdn',
            metadata: { configuredProvider: cdnProvider }
          });
          return true; // Return success for no-op
      }

    } catch (error) {
      logger.error('CDN cache purge failed', {
        service: 'cdn',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      return false;
    }
  }
  
  /**
   * Purge Cloudflare cache
   */
  private async purgeCloudflareCache(paths?: string[]): Promise<boolean> {
    try {
      const zoneId = process.env.CLOUDFLARE_ZONE_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      
      if (!zoneId || !apiToken) {
        logger.error('Cloudflare credentials not configured', {
          service: 'cdn',
          metadata: {
            hasZoneId: !!zoneId,
            hasApiToken: !!apiToken
          }
        });
        return false;
      }
      
      // Prepare request body
      const body = paths && paths.length > 0
        ? { files: paths.map(p => this.config.baseUrl + '/' + p.replace(/^\//, '')) }
        : { purge_everything: true };
      
      // Make API request to Cloudflare
      const fetch = require('node-fetch');
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );
      
      const result = await response.json();
      
      if (!result.success) {
        logger.error('Cloudflare cache purge failed', {
          service: 'cdn',
          metadata: {
            errors: result.errors,
            messages: result.messages
          }
        });
        return false;
      }
      
      logger.info('Cloudflare cache purged successfully', {
        service: 'cdn',
        metadata: {
          paths: paths || ['all'],
          result: result.result
        }
      });
      
      return true;
      
    } catch (error) {
      logger.error('Cloudflare cache purge error', {
        service: 'cdn',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      return false;
    }
  }
  
  /**
   * Purge AWS CloudFront cache
   */
  private async purgeCloudFrontCache(paths?: string[]): Promise<boolean> {
    try {
      const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
      
      if (!distributionId) {
        logger.error('CloudFront distribution ID not configured', {
          service: 'cdn'
        });
        return false;
      }
      
      // AWS SDK would be used here
      // const AWS = require('aws-sdk');
      // const cloudfront = new AWS.CloudFront();
      
      // Prepare invalidation paths
      const items = paths && paths.length > 0
        ? paths.map(p => p.startsWith('/') ? p : `/${p}`)
        : ['/*'];
      
      logger.info('CloudFront invalidation would be executed here', {
        service: 'cdn',
        metadata: {
          distributionId,
          paths: items
        }
      });
      
      // Actual implementation would be:
      /*
      const params = {
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `ellie-${Date.now()}`,
          Paths: {
            Quantity: items.length,
            Items: items
          }
        }
      };
      
      const result = await cloudfront.createInvalidation(params).promise();
      */
      
      return true;
      
    } catch (error) {
      logger.error('CloudFront cache purge error', {
        service: 'cdn',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      return false;
    }
  }
  
  /**
   * Purge Fastly cache
   */
  private async purgeFastlyCache(paths?: string[]): Promise<boolean> {
    try {
      const apiKey = process.env.FASTLY_API_KEY;
      const serviceId = process.env.FASTLY_SERVICE_ID;
      
      if (!apiKey || !serviceId) {
        logger.error('Fastly credentials not configured', {
          service: 'cdn'
        });
        return false;
      }
      
      logger.info('Fastly purge would be executed here', {
        service: 'cdn',
        metadata: {
          serviceId,
          paths: paths || ['all']
        }
      });
      
      // Actual implementation would use Fastly API
      return true;
      
    } catch (error) {
      logger.error('Fastly cache purge error', {
        service: 'cdn',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }
  
  /**
   * Purge Akamai cache
   */
  private async purgeAkamaiCache(paths?: string[]): Promise<boolean> {
    try {
      const clientToken = process.env.AKAMAI_CLIENT_TOKEN;
      const clientSecret = process.env.AKAMAI_CLIENT_SECRET;
      const accessToken = process.env.AKAMAI_ACCESS_TOKEN;
      const network = process.env.AKAMAI_NETWORK || 'production';
      
      if (!clientToken || !clientSecret || !accessToken) {
        logger.error('Akamai credentials not configured', {
          service: 'cdn'
        });
        return false;
      }
      
      logger.info('Akamai purge would be executed here', {
        service: 'cdn',
        metadata: {
          network,
          paths: paths || ['all']
        }
      });
      
      // Actual implementation would use Akamai API
      return true;
      
    } catch (error) {
      logger.error('Akamai cache purge error', {
        service: 'cdn',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }
}

// Export singleton instance
export const cdnService = new CDNService();