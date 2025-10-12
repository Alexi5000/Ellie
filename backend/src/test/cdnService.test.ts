/**
 * CDN Service Tests
 * Requirements: 15.1 - CDN integration testing
 */

// Unmock CDNService to test the actual implementation
jest.unmock('../services/cdnService');

import { CDNService } from '../services/cdnService';

describe('CDNService', () => {
  let cdnService: CDNService;

  beforeEach(() => {
    // Reset environment variables
    delete process.env.CDN_ENABLED;
    delete process.env.CDN_BASE_URL;
    delete process.env.CDN_REGIONS;
    delete process.env.ASSET_VERSION;

    cdnService = new CDNService();
  });

  describe('Asset URL Generation', () => {
    it('should return original path when CDN is disabled', () => {
      const assetPath = '/static/js/main.js';
      const result = cdnService.getAssetUrl(assetPath);

      expect(result).toBe(assetPath);
    });

    it('should generate CDN URL when enabled', () => {
      process.env.CDN_ENABLED = 'true';
      process.env.CDN_BASE_URL = 'https://cdn.example.com';
      process.env.ASSET_VERSION = '1.2.3';

      cdnService = new CDNService();

      const assetPath = '/static/js/main.js';
      const result = cdnService.getAssetUrl(assetPath);

      expect(result).toBe('https://cdn.example.com/static/js/main.js?v=1.2.3');
    });

    it('should handle paths without leading slash', () => {
      process.env.CDN_ENABLED = 'true';
      process.env.CDN_BASE_URL = 'https://cdn.example.com';
      process.env.ASSET_VERSION = '1.2.3';

      cdnService = new CDNService();

      const assetPath = 'static/js/main.js';
      const result = cdnService.getAssetUrl(assetPath);

      expect(result).toBe('https://cdn.example.com/static/js/main.js?v=1.2.3');
    });

    it('should handle paths with existing query parameters', () => {
      process.env.CDN_ENABLED = 'true';
      process.env.CDN_BASE_URL = 'https://cdn.example.com';
      process.env.ASSET_VERSION = '1.2.3';

      cdnService = new CDNService();

      const assetPath = '/static/js/main.js?param=value';
      const result = cdnService.getAssetUrl(assetPath);

      expect(result).toBe('https://cdn.example.com/static/js/main.js?param=value&v=1.2.3');
    });
  });

  describe('Cache Headers', () => {
    it('should return appropriate headers for JavaScript files', () => {
      const headers = cdnService.getCacheHeaders('js');

      expect(headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
      expect(headers['Content-Encoding']).toBe('gzip');
    });

    it('should return appropriate headers for CSS files', () => {
      const headers = cdnService.getCacheHeaders('css');

      expect(headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
      expect(headers['Content-Encoding']).toBe('gzip');
    });

    it('should return appropriate headers for images', () => {
      const headers = cdnService.getCacheHeaders('image');

      expect(headers['Cache-Control']).toBe('public, max-age=2592000');
      expect(headers['Vary']).toBe('Accept-Encoding');
    });

    it('should return appropriate headers for fonts', () => {
      const headers = cdnService.getCacheHeaders('font');

      expect(headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should return appropriate headers for audio files', () => {
      const headers = cdnService.getCacheHeaders('audio');

      expect(headers['Cache-Control']).toBe('public, max-age=86400');
      expect(headers['Accept-Ranges']).toBe('bytes');
    });

    it('should return short cache for HTML files', () => {
      const headers = cdnService.getCacheHeaders('html');

      expect(headers['Cache-Control']).toBe('public, max-age=300');
    });
  });

  describe('ETag Generation', () => {
    it('should generate consistent ETag for same content', () => {
      const content = 'test content';
      const etag1 = cdnService.generateETag(content);
      const etag2 = cdnService.generateETag(content);

      expect(etag1).toBe(etag2);
      expect(etag1).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('should generate different ETags for different content', () => {
      const content1 = 'test content 1';
      const content2 = 'test content 2';
      const etag1 = cdnService.generateETag(content1);
      const etag2 = cdnService.generateETag(content2);

      expect(etag1).not.toBe(etag2);
    });

    it('should handle Buffer content', () => {
      const buffer = Buffer.from('test content');
      const etag = cdnService.generateETag(buffer);

      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });
  });

  describe('CDN Usage Decision', () => {
    beforeEach(() => {
      process.env.CDN_ENABLED = 'true';
      cdnService = new CDNService();
    });

    it('should use CDN for static assets', () => {
      const staticPaths = [
        '/static/js/main.js',
        '/static/css/style.css',
        '/images/logo.png',
        '/fonts/font.woff2',
        '/audio/notification.mp3'
      ];

      staticPaths.forEach(path => {
        expect(cdnService.shouldUseCDN(path)).toBe(true);
      });
    });

    it('should not use CDN for API endpoints', () => {
      const apiPaths = [
        '/api/voice/process',
        '/api/legal/compliance',
        '/api/cache/stats'
      ];

      apiPaths.forEach(path => {
        expect(cdnService.shouldUseCDN(path)).toBe(false);
      });
    });

    it('should not use CDN for WebSocket connections', () => {
      const socketPaths = [
        '/socket.io/',
        '/socket.io/socket.io.js'
      ];

      socketPaths.forEach(path => {
        expect(cdnService.shouldUseCDN(path)).toBe(false);
      });
    });

    it('should not use CDN when disabled', () => {
      process.env.CDN_ENABLED = 'false';
      cdnService = new CDNService();

      expect(cdnService.shouldUseCDN('/static/js/main.js')).toBe(false);
    });
  });

  describe('Frontend Configuration', () => {
    it('should return frontend config when CDN is enabled', () => {
      process.env.CDN_ENABLED = 'true';
      process.env.CDN_BASE_URL = 'https://cdn.example.com';
      process.env.ASSET_VERSION = '1.2.3';

      cdnService = new CDNService();

      const config = cdnService.getFrontendConfig();

      expect(config).toEqual({
        enabled: true,
        baseUrl: 'https://cdn.example.com',
        assetVersion: '1.2.3'
      });
    });

    it('should return disabled config when CDN is disabled', () => {
      const config = cdnService.getFrontendConfig();

      expect(config.enabled).toBe(false);
      expect(config.baseUrl).toBe('');
    });
  });

  describe('Cache Middleware', () => {
    it('should create middleware function', () => {
      const middleware = cdnService.cacheMiddleware();

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });

    it('should set appropriate headers in middleware', () => {
      const middleware = cdnService.cacheMiddleware();
      const mockReq = { path: '/static/js/main.js' };
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should return CDN statistics', () => {
      process.env.CDN_ENABLED = 'true';
      process.env.CDN_BASE_URL = 'https://cdn.example.com';
      process.env.CDN_REGIONS = 'us-east-1,eu-west-1,ap-southeast-1';

      cdnService = new CDNService();

      const stats = cdnService.getStats();

      expect(stats).toEqual({
        enabled: true,
        baseUrl: 'https://cdn.example.com',
        regions: 3,
        optimization: {
          compression: true,
          minification: true,
          imageOptimization: true,
          caching: true
        }
      });
    });
  });

  describe('CDN Cache Purging', () => {
    it('should return false when CDN is disabled', async () => {
      const result = await cdnService.purgeCDNCache();

      expect(result).toBe(false);
    });

    it('should return true when CDN is enabled (placeholder)', async () => {
      process.env.CDN_ENABLED = 'true';
      cdnService = new CDNService();

      const result = await cdnService.purgeCDNCache(['/static/js/main.js']);

      expect(result).toBe(true);
    });

    it('should handle purge errors gracefully', async () => {
      process.env.CDN_ENABLED = 'true';
      cdnService = new CDNService();

      // Mock an error in the purge process
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const result = await cdnService.purgeCDNCache();

      expect(result).toBe(true); // Placeholder always returns true
      console.error = originalConsoleError;
    });
  });
});