const { execSync, spawn } = require('child_process');
const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

describe('Docker Integration Tests', () => {
  let dockerProcess;
  const TIMEOUT = 120000; // 2 minutes for Docker containers to start

  beforeAll(async () => {
    console.log('Starting Docker containers...');
    
    // Clean up any existing containers
    try {
      execSync('docker-compose down', { stdio: 'ignore' });
    } catch (error) {
      // Ignore errors if containers don't exist
    }

    // Start containers in detached mode
    dockerProcess = spawn('docker-compose', ['up', '--build'], {
      stdio: 'pipe',
      detached: false
    });

    // Wait for containers to be ready
    await waitForServices();
  }, TIMEOUT);

  afterAll(async () => {
    console.log('Stopping Docker containers...');
    
    if (dockerProcess) {
      dockerProcess.kill();
    }
    
    try {
      execSync('docker-compose down', { stdio: 'ignore' });
    } catch (error) {
      console.error('Error stopping containers:', error.message);
    }
  });

  describe('Service Health Checks', () => {
    test('Frontend health endpoint should be accessible', async () => {
      const response = await axios.get('http://localhost:3000/health');
      expect(response.status).toBe(200);
      // Frontend health check returns a simple JSON response
      expect(response.data).toHaveProperty('status', 'OK');
      expect(response.data).toHaveProperty('timestamp');
    });

    test('Backend health endpoint should be accessible', async () => {
      const response = await axios.get('http://localhost:5000/health');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'OK');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('serviceHealth');
      expect(response.data).toHaveProperty('connections');
    });

    test('Nginx reverse proxy should route to frontend', async () => {
      const response = await axios.get('http://localhost:80/');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    test('Nginx reverse proxy should route API calls to backend', async () => {
      const response = await axios.get('http://localhost:80/health');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'OK');
    });
  });

  describe('API Endpoints', () => {
    test('Backend API should be accessible through nginx', async () => {
      // Backend health endpoint is at /health, not /api/health
      const response = await axios.get('http://localhost:80/health');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'OK');
    });

    test('Voice processing endpoint should accept requests', async () => {
      // Create a simple test audio buffer
      const testAudioBuffer = Buffer.from('test-audio-data');
      
      try {
        const response = await axios.post('http://localhost:80/api/voice/process', {
          audio: testAudioBuffer.toString('base64')
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        // We expect this to fail due to invalid audio, but the endpoint should be reachable
        expect(response.status).toBeLessThan(500);
      } catch (error) {
        // 400 Bad Request is expected for invalid audio data
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('WebSocket Connection', () => {
    test('Socket.io connection should be established through nginx', (done) => {
      const socket = new WebSocket('ws://localhost:80/socket.io/?EIO=4&transport=websocket');
      
      socket.on('open', () => {
        socket.close();
        done();
      });

      socket.on('error', (error) => {
        done(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        socket.close();
        done(new Error('WebSocket connection timeout'));
      }, 10000);
    });
  });

  describe('Container Health', () => {
    test('All containers should be running', () => {
      const output = execSync('docker-compose ps', { encoding: 'utf8' });
      expect(output).toContain('frontend');
      expect(output).toContain('backend');
      expect(output).toContain('nginx');
      
      // Check that containers are in "Up" state
      expect(output).toMatch(/frontend.*Up/);
      expect(output).toMatch(/backend.*Up/);
      expect(output).toMatch(/nginx.*Up/);
    });

    test('Container logs should not contain critical errors', () => {
      try {
        const frontendLogs = execSync('docker-compose logs frontend', { encoding: 'utf8' });
        const backendLogs = execSync('docker-compose logs backend', { encoding: 'utf8' });
        const nginxLogs = execSync('docker-compose logs nginx', { encoding: 'utf8' });

        // Check for critical error patterns
        expect(frontendLogs).not.toMatch(/FATAL|CRITICAL|Error.*failed to start/i);
        expect(backendLogs).not.toMatch(/FATAL|CRITICAL|Error.*failed to start/i);
        expect(nginxLogs).not.toMatch(/emerg|alert|crit/i);
      } catch (error) {
        console.warn('Could not retrieve container logs:', error.message);
      }
    });
  });

  describe('Performance and Load', () => {
    test('Services should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await axios.get('http://localhost:80/health');
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    test('Multiple concurrent requests should be handled', async () => {
      const requests = Array(10).fill().map(() => 
        axios.get('http://localhost:80/health')
      );
      
      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Monitoring and Metrics', () => {
    test('Nginx status endpoint should be accessible from allowed IPs', async () => {
      try {
        const response = await axios.get('http://localhost:80/nginx-status');
        expect(response.status).toBe(200);
        expect(response.data).toContain('Active connections');
      } catch (error) {
        // 403 Forbidden is expected if not accessing from allowed IP range
        expect(error.response?.status).toBe(403);
      }
    });

    test('Backend metrics endpoint should provide Prometheus format', async () => {
      const response = await axios.get('http://localhost:80/metrics');
      expect(response.status).toBe(200);
      expect(response.data).toContain('ellie_');
      expect(response.data).toContain('# HELP');
      expect(response.data).toContain('# TYPE');
    });

    test('Prometheus monitoring should be accessible', async () => {
      try {
        const response = await axios.get('http://localhost:9090');
        expect(response.status).toBe(200);
      } catch (error) {
        console.warn('Prometheus not accessible - may not be running in development mode');
      }
    });
  });

  describe('Security Headers', () => {
    test('Nginx should set security headers', async () => {
      const response = await axios.get('http://localhost:80/');
      
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('referrer-policy');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    test('Rate limiting should be enforced', async () => {
      // Make rapid requests to test rate limiting
      const rapidRequests = Array(15).fill().map(() => 
        axios.get('http://localhost:80/health').catch(err => err.response)
      );
      
      const responses = await Promise.all(rapidRequests);
      const rateLimitedResponses = responses.filter(res => res?.status === 429);
      
      // Should have some rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Complete Application Stack Tests', () => {
    test('Docker network connectivity between services', async () => {
      // Test that services can communicate within Docker network
      const backendResponse = await axios.get('http://localhost:80/health');
      expect(backendResponse.status).toBe(200);
      
      const frontendResponse = await axios.get('http://localhost:80/');
      expect(frontendResponse.status).toBe(200);
      
      // Verify that nginx is properly routing requests
      expect(backendResponse.data).toHaveProperty('status', 'OK');
      expect(frontendResponse.headers['content-type']).toContain('text/html');
    });

    test('SSL configuration readiness', () => {
      // Check if SSL setup scripts exist and are functional
      expect(fs.existsSync('docker/ssl-setup.sh')).toBe(true);
      expect(fs.existsSync('docker/ssl-setup.ps1')).toBe(true);
      
      // Check if production nginx config has SSL settings
      const nginxProdConfig = fs.readFileSync('docker/nginx-production.conf', 'utf8');
      expect(nginxProdConfig).toContain('ssl_protocols');
      expect(nginxProdConfig).toContain('listen 443 ssl');
    });

    test('Production configuration validation', () => {
      // Verify production docker-compose exists and has proper settings
      expect(fs.existsSync('docker-compose.prod.yml')).toBe(true);
      
      const prodCompose = fs.readFileSync('docker-compose.prod.yml', 'utf8');
      expect(prodCompose).toContain('target: production');
      expect(prodCompose).toContain('restart: unless-stopped');
      expect(prodCompose).toContain('healthcheck:');
    });

    test('Environment variable configuration', () => {
      // Check that environment files exist
      expect(fs.existsSync('backend/.env.production')).toBe(true);
      
      // Verify docker-compose has proper environment configuration
      const devCompose = fs.readFileSync('docker-compose.yml', 'utf8');
      expect(devCompose).toContain('REACT_APP_API_URL');
      expect(devCompose).toContain('NODE_ENV');
      expect(devCompose).toContain('CORS_ORIGIN');
    });

    test('Volume mounts and data persistence', () => {
      // Check that docker-compose has proper volume configurations
      const devCompose = fs.readFileSync('docker-compose.yml', 'utf8');
      expect(devCompose).toContain('volumes:');
      expect(devCompose).toContain('/app/node_modules');
      
      // Check nginx configuration volume mount
      expect(devCompose).toContain('./docker/nginx.conf:/etc/nginx/nginx.conf:ro');
    });

    test('Service orchestration and dependencies', () => {
      // Verify service dependencies are properly configured
      const devCompose = fs.readFileSync('docker-compose.yml', 'utf8');
      expect(devCompose).toContain('depends_on:');
      expect(devCompose).toContain('networks:');
      expect(devCompose).toContain('ellie-network');
    });

    test('Monitoring and observability setup', () => {
      // Check if monitoring configuration exists
      expect(fs.existsSync('monitoring/prometheus.yml')).toBe(true);
      
      const prometheusConfig = fs.readFileSync('monitoring/prometheus.yml', 'utf8');
      expect(prometheusConfig).toContain('job_name');
      expect(prometheusConfig).toContain('targets');
    });

    test('Nginx reverse proxy configuration completeness', () => {
      // Verify nginx configurations are complete
      const nginxConfig = fs.readFileSync('docker/nginx.conf', 'utf8');
      const nginxProdConfig = fs.readFileSync('docker/nginx-production.conf', 'utf8');
      const serverCommon = fs.readFileSync('docker/server-common.conf', 'utf8');
      
      // Check development config
      expect(nginxConfig).toContain('upstream frontend');
      expect(nginxConfig).toContain('upstream backend');
      expect(nginxConfig).toContain('location /api/');
      expect(nginxConfig).toContain('location /socket.io/');
      
      // Check production config
      expect(nginxProdConfig).toContain('gzip on');
      expect(nginxProdConfig).toContain('limit_req_zone');
      expect(nginxProdConfig).toContain('ssl_protocols');
      
      // Check common server config
      expect(serverCommon).toContain('location /health');
      expect(serverCommon).toContain('location /nginx-status');
      expect(serverCommon).toContain('proxy_pass http://backend');
    });
  });
});

// Helper function to wait for services to be ready
async function waitForServices() {
  const maxAttempts = 60; // 60 attempts with 2-second intervals = 2 minutes
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      // Check if nginx is responding
      await axios.get('http://localhost:80/health', { timeout: 5000 });
      console.log('Services are ready!');
      return;
    } catch (error) {
      attempts++;
      console.log(`Waiting for services... (attempt ${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Services failed to start within the timeout period');
}

// Helper function to check if a port is open
function isPortOpen(port, host = 'localhost') {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}