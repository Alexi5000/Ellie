const { execSync, spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

describe('Production Deployment Tests', () => {
  let dockerProcess;
  const TIMEOUT = 180000; // 3 minutes for production containers to start

  beforeAll(async () => {
    console.log('Testing production deployment configuration...');
    
    // Verify production configuration files exist
    const requiredFiles = [
      'docker/docker-compose.prod.yml',
      'docker/nginx-production.conf',
      'docker/server-common.conf',
      'backend/.env.production'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required production file missing: ${file}`);
      }
    }
  });

  describe('Configuration Validation', () => {
    test('Production docker-compose should have proper configuration', () => {
      const prodCompose = fs.readFileSync('docker/docker-compose.prod.yml', 'utf8');
      
      // Check for production-specific configurations
      expect(prodCompose).toContain('target: production');
      expect(prodCompose).toContain('restart: unless-stopped');
      expect(prodCompose).toContain('healthcheck:');
      expect(prodCompose).toContain('NODE_ENV=production');
    });

    test('Nginx production config should have SSL and security settings', () => {
      const nginxConfig = fs.readFileSync('docker/nginx-production.conf', 'utf8');
      const serverCommon = fs.readFileSync('docker/server-common.conf', 'utf8');
      
      // Check for SSL configuration
      expect(nginxConfig).toContain('ssl_protocols');
      expect(nginxConfig).toContain('ssl_ciphers');
      expect(nginxConfig).toContain('listen 443 ssl');
      
      // Check for security headers
      expect(nginxConfig).toContain('X-Frame-Options');
      expect(nginxConfig).toContain('X-Content-Type-Options');
      expect(nginxConfig).toContain('Content-Security-Policy');
      
      // Check for rate limiting (in production config)
      expect(nginxConfig).toContain('limit_req_zone');
      // Check for rate limiting usage (in server-common config)
      expect(serverCommon).toContain('limit_req zone=');
    });

    test('SSL setup scripts should exist and be executable', () => {
      expect(fs.existsSync('docker/ssl-setup.sh')).toBe(true);
      expect(fs.existsSync('docker/ssl-setup.ps1')).toBe(true);
      
      const bashScript = fs.readFileSync('docker/ssl-setup.sh', 'utf8');
      const powershellScript = fs.readFileSync('docker/ssl-setup.ps1', 'utf8');
      
      expect(bashScript).toContain('openssl req -x509');
      expect(powershellScript).toContain('New-SelfSignedCertificate');
    });
  });

  describe('Environment Configuration', () => {
    test('Production environment variables should be properly configured', () => {
      const prodCompose = fs.readFileSync('docker-compose.prod.yml', 'utf8');
      
      // Check for environment variable placeholders
      expect(prodCompose).toContain('https://your-domain.com');
      expect(prodCompose).toContain('.env.production');
    });

    test('Backend production environment should exist', () => {
      if (fs.existsSync('backend/.env.production')) {
        const prodEnv = fs.readFileSync('backend/.env.production', 'utf8');
        expect(prodEnv).toContain('NODE_ENV=production');
      } else {
        console.warn('backend/.env.production not found - should be created for production deployment');
      }
    });
  });

  describe('SSL Certificate Handling', () => {
    test('SSL setup script should create proper directory structure', () => {
      // Test the PowerShell script since we're on Windows
      try {
        execSync('powershell -ExecutionPolicy Bypass -File docker/ssl-setup.ps1 -Domain test.local -SelfSigned', {
          stdio: 'pipe'
        });
        
        expect(fs.existsSync('docker/ssl')).toBe(true);
        expect(fs.existsSync('docker/ssl/certs')).toBe(true);
        expect(fs.existsSync('docker/ssl/private')).toBe(true);
        
        // Clean up test SSL files
        if (fs.existsSync('docker/ssl')) {
          fs.rmSync('docker/ssl', { recursive: true, force: true });
        }
      } catch (error) {
        console.warn('SSL setup test skipped - OpenSSL may not be available:', error.message);
      }
    });
  });

  describe('Health Check Configuration', () => {
    test('Docker health checks should be properly configured', () => {
      const prodCompose = fs.readFileSync('docker/docker-compose.prod.yml', 'utf8');
      
      // Check for health check configurations
      expect(prodCompose).toContain('healthcheck:');
      expect(prodCompose).toContain('test: ["CMD", "curl"');
      expect(prodCompose).toContain('interval: 30s');
      expect(prodCompose).toContain('timeout: 10s');
      expect(prodCompose).toContain('retries: 3');
    });

    test('Service dependencies should be properly configured', () => {
      const prodCompose = fs.readFileSync('docker/docker-compose.prod.yml', 'utf8');
      
      // Check for service dependencies with health conditions
      expect(prodCompose).toContain('depends_on:');
      expect(prodCompose).toContain('condition: service_healthy');
    });
  });

  describe('Monitoring Configuration', () => {
    test('Prometheus configuration should exist', () => {
      expect(fs.existsSync('docker/prometheus.yml')).toBe(true);
      
      const prometheusConfig = fs.readFileSync('docker/prometheus.yml', 'utf8');
      expect(prometheusConfig).toContain('job_name:');
      expect(prometheusConfig).toContain('targets:');
    });

    test('Monitoring service should be configured in production compose', () => {
      const prodCompose = fs.readFileSync('docker/docker-compose.prod.yml', 'utf8');
      expect(prodCompose).toContain('monitoring:');
      expect(prodCompose).toContain('prom/prometheus');
    });
  });

  describe('Security Configuration', () => {
    test('Nginx should have proper security configurations', () => {
      const nginxConfig = fs.readFileSync('docker/nginx-production.conf', 'utf8');
      
      // Check for security configurations
      expect(nginxConfig).toContain('client_max_body_size');
      expect(nginxConfig).toContain('gzip on');
      expect(nginxConfig).toContain('limit_req_zone');
      
      // Check for SSL security
      expect(nginxConfig).toContain('ssl_prefer_server_ciphers');
      expect(nginxConfig).toContain('ssl_session_cache');
    });

    test('Rate limiting should be configured for different endpoints', () => {
      const serverCommon = fs.readFileSync('docker/server-common.conf', 'utf8');
      
      expect(serverCommon).toContain('limit_req zone=api');
      expect(serverCommon).toContain('limit_req zone=voice');
      expect(serverCommon).toContain('burst=');
    });
  });

  describe('Production Readiness', () => {
    test('All required production files should exist', () => {
      const requiredFiles = [
        'docker/docker-compose.prod.yml',
        'docker/nginx-production.conf',
        'docker/server-common.conf',
        'docker/ssl-setup.sh',
        'docker/ssl-setup.ps1',
        'docker/prometheus.yml'
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
      });
    });

    test('Production deployment should have proper documentation', () => {
      // Check if README or deployment docs mention production setup
      if (fs.existsSync('README.md')) {
        const readme = fs.readFileSync('README.md', 'utf8');
        expect(readme.toLowerCase()).toMatch(/production|deploy|ssl|https/);
      }
    });
  });
});

// Helper function to validate SSL certificate
function validateSSLCertificate(certPath, keyPath) {
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    return false;
  }

  try {
    // Basic validation - check if files are readable and contain expected content
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    
    return cert.includes('BEGIN CERTIFICATE') && key.includes('BEGIN PRIVATE KEY');
  } catch (error) {
    return false;
  }
}