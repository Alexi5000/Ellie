"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cdnService = exports.CDNService = void 0;
const loggerService_1 = require("./loggerService");
class CDNService {
    constructor() {
        this.config = {
            enabled: process.env.CDN_ENABLED === 'true',
            baseUrl: process.env.CDN_BASE_URL || '',
            regions: (process.env.CDN_REGIONS || 'us-east-1,eu-west-1').split(','),
            cacheHeaders: {
                'Cache-Control': 'public, max-age=31536000',
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
        loggerService_1.logger.info('CDN Service initialized', {
            service: 'cdn',
            metadata: {
                enabled: this.config.enabled,
                baseUrl: this.config.baseUrl,
                regions: this.config.regions.length
            }
        });
    }
    getAssetUrl(assetPath, assetType = 'js') {
        if (!this.config.enabled || !this.config.baseUrl) {
            return assetPath;
        }
        const cleanPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
        const version = process.env.ASSET_VERSION || Date.now().toString();
        const separator = cleanPath.includes('?') ? '&' : '?';
        const versionedPath = `${cleanPath}${separator}v=${version}`;
        const optimizedUrl = `${this.config.baseUrl}/${versionedPath}`;
        loggerService_1.logger.debug('Asset URL optimized', {
            service: 'cdn',
            metadata: {
                originalPath: assetPath,
                optimizedUrl,
                assetType
            }
        });
        return optimizedUrl;
    }
    getCacheHeaders(assetType) {
        const baseHeaders = { ...this.config.cacheHeaders };
        switch (assetType) {
            case 'html':
                return {
                    'Cache-Control': 'public, max-age=300',
                    'Expires': new Date(Date.now() + 300000).toUTCString()
                };
            case 'js':
            case 'css':
                const headers = {
                    ...baseHeaders,
                    'Cache-Control': 'public, max-age=31536000, immutable'
                };
                if (this.optimization.compression) {
                    headers['Content-Encoding'] = 'gzip';
                }
                return headers;
            case 'image':
                return {
                    ...baseHeaders,
                    'Cache-Control': 'public, max-age=2592000',
                    'Vary': 'Accept-Encoding'
                };
            case 'font':
                return {
                    ...baseHeaders,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*'
                };
            case 'audio':
                return {
                    ...baseHeaders,
                    'Cache-Control': 'public, max-age=86400',
                    'Accept-Ranges': 'bytes'
                };
            default:
                return baseHeaders;
        }
    }
    generateETag(content) {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(content).digest('hex');
        return `"${hash}"`;
    }
    shouldUseCDN(assetPath) {
        if (!this.config.enabled) {
            return false;
        }
        if (assetPath.startsWith('/api/')) {
            return false;
        }
        if (assetPath.includes('socket.io')) {
            return false;
        }
        const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.mp3', '.wav'];
        return staticExtensions.some(ext => assetPath.toLowerCase().includes(ext));
    }
    getFrontendConfig() {
        return {
            enabled: this.config.enabled,
            baseUrl: this.config.baseUrl,
            assetVersion: process.env.ASSET_VERSION || Date.now().toString()
        };
    }
    cacheMiddleware() {
        return (req, res, next) => {
            const assetType = this.getAssetType(req.path);
            const headers = this.getCacheHeaders(assetType);
            Object.entries(headers).forEach(([key, value]) => {
                if (value) {
                    res.setHeader(key, value);
                }
            });
            if (assetType !== 'html' && this.optimization.caching) {
                const originalSend = res.send;
                res.send = function (body) {
                    if (body && typeof body === 'string') {
                        const etag = exports.cdnService.generateETag(body);
                        res.setHeader('ETag', etag);
                    }
                    return originalSend.call(this, body);
                };
            }
            next();
        };
    }
    getAssetType(path) {
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
    getStats() {
        return {
            enabled: this.config.enabled,
            baseUrl: this.config.baseUrl,
            regions: this.config.regions.length,
            optimization: this.optimization
        };
    }
    async purgeCDNCache(paths) {
        if (!this.config.enabled) {
            return false;
        }
        try {
            const cdnProvider = process.env.CDN_PROVIDER?.toLowerCase() || 'none';
            loggerService_1.logger.info('CDN cache purge requested', {
                service: 'cdn',
                metadata: {
                    provider: cdnProvider,
                    paths: paths || ['all'],
                    timestamp: new Date().toISOString()
                }
            });
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
                    loggerService_1.logger.warn('No CDN provider configured for cache purging', {
                        service: 'cdn',
                        metadata: { configuredProvider: cdnProvider }
                    });
                    return true;
            }
        }
        catch (error) {
            loggerService_1.logger.error('CDN cache purge failed', {
                service: 'cdn',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });
            return false;
        }
    }
    async purgeCloudflareCache(paths) {
        try {
            const zoneId = process.env.CLOUDFLARE_ZONE_ID;
            const apiToken = process.env.CLOUDFLARE_API_TOKEN;
            if (!zoneId || !apiToken) {
                loggerService_1.logger.error('Cloudflare credentials not configured', {
                    service: 'cdn',
                    metadata: {
                        hasZoneId: !!zoneId,
                        hasApiToken: !!apiToken
                    }
                });
                return false;
            }
            const body = paths && paths.length > 0
                ? { files: paths.map(p => this.config.baseUrl + '/' + p.replace(/^\//, '')) }
                : { purge_everything: true };
            const fetch = require('node-fetch');
            const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (!result.success) {
                loggerService_1.logger.error('Cloudflare cache purge failed', {
                    service: 'cdn',
                    metadata: {
                        errors: result.errors,
                        messages: result.messages
                    }
                });
                return false;
            }
            loggerService_1.logger.info('Cloudflare cache purged successfully', {
                service: 'cdn',
                metadata: {
                    paths: paths || ['all'],
                    result: result.result
                }
            });
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('Cloudflare cache purge error', {
                service: 'cdn',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });
            return false;
        }
    }
    async purgeCloudFrontCache(paths) {
        try {
            const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
            if (!distributionId) {
                loggerService_1.logger.error('CloudFront distribution ID not configured', {
                    service: 'cdn'
                });
                return false;
            }
            const items = paths && paths.length > 0
                ? paths.map(p => p.startsWith('/') ? p : `/${p}`)
                : ['/*'];
            loggerService_1.logger.info('CloudFront invalidation would be executed here', {
                service: 'cdn',
                metadata: {
                    distributionId,
                    paths: items
                }
            });
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('CloudFront cache purge error', {
                service: 'cdn',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });
            return false;
        }
    }
    async purgeFastlyCache(paths) {
        try {
            const apiKey = process.env.FASTLY_API_KEY;
            const serviceId = process.env.FASTLY_SERVICE_ID;
            if (!apiKey || !serviceId) {
                loggerService_1.logger.error('Fastly credentials not configured', {
                    service: 'cdn'
                });
                return false;
            }
            loggerService_1.logger.info('Fastly purge would be executed here', {
                service: 'cdn',
                metadata: {
                    serviceId,
                    paths: paths || ['all']
                }
            });
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('Fastly cache purge error', {
                service: 'cdn',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return false;
        }
    }
    async purgeAkamaiCache(paths) {
        try {
            const clientToken = process.env.AKAMAI_CLIENT_TOKEN;
            const clientSecret = process.env.AKAMAI_CLIENT_SECRET;
            const accessToken = process.env.AKAMAI_ACCESS_TOKEN;
            const network = process.env.AKAMAI_NETWORK || 'production';
            if (!clientToken || !clientSecret || !accessToken) {
                loggerService_1.logger.error('Akamai credentials not configured', {
                    service: 'cdn'
                });
                return false;
            }
            loggerService_1.logger.info('Akamai purge would be executed here', {
                service: 'cdn',
                metadata: {
                    network,
                    paths: paths || ['all']
                }
            });
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('Akamai cache purge error', {
                service: 'cdn',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return false;
        }
    }
}
exports.CDNService = CDNService;
exports.cdnService = new CDNService();
//# sourceMappingURL=cdnService.js.map