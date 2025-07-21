/**
 * Docker Integration Tests
 * Tests the complete application stack running in Docker containers
 * Requirements: 4.3, 4.4
 */

const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

describe('Docker Integration Tests', () => {
  const BASE_URL = 'http://localhost';
  const BACKEND_URL = 'http://localhost:5000';
  const FRONTEND_URL = 'http://localhost:3000';
  
  let containersStarted = false;

  beforeAll(async () => {
    // Start Docker containers
    console.log('Starting Docker containers...');
    try {
      await execAsync('docker-compose up -d');
      containersStarted = true;
      
      // Wait for services to be ready
      await waitForServices();
    } catch (error) {
      console.error('Failed to start Docker containers:', error);
      throw error;
    }
  }, 120000); // 2 minute timeout

  afterAll(async () => {
    if (containersStarted) {
      console.log('Stopping Docker containers...');
      try {
        await execAsync('docker-compose down');
      } catch (error) {
        console.error('Failed to stop Docker containers:', error);
      }
    }
  }, 60000);

  describe('Container Health Checks', () => {
    test('should have all containers running', async () => {
      const { stdout } = await execAsync('docker-compose ps --services --filter "status=running"');
      const runningServices = stdout.trim().split('\n').filter(line => line.trim());
      
      expect(runningServices).toContain('frontend');
      expect(runningServices).toContain('backend');
      expect(runningServices).toContain('nginx');
    });

    test('should have healthy containers', async () => {
      const { stdout } = await execAsync('docker-compose ps --format json');
      const containers = stdout.trim().split('\n').map(line => JSON.parse(line));
      
      containers.forEach(container => {
        expect(container.State).toBe('running');
        if (container.Health) {
          expect(container.Health).toBe('healthy');
        }
      });
    });
  });

  describe('Nginx Reverse Proxy', () => {
    test('should serve frontend through nginx', async () => {
      const response = await axios.get(BASE_URL);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('should proxy API requests to backend', async () => {
      const response = await axios.get(`${BASE_URL}/api`);
      expect(response.status).toBe(200);
      expect(response.data.message).toContain('Ellie Voice Receptionist API');
    });

    test('should serve health check endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('OK');
      expect(response.data.services).toBeDefined();
    });

    test('should serve metrics endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/metrics`);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(response.data).toContain('ellie_uptime_seconds');
    });

    test('should handle nginx status endpoint', async () => {
      // This endpoint should be restricted to internal networks
      try {
        const response = await axios.get(`${BASE_URL}/nginx-status`);
        // Should either work (if from allowed IP) or be forbidden
        expect([200, 403]).toContain(response.status);
      } catch (error) {
        // 403 Forbidden is expected from external access
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('Backend Service', () => {
    test('should respond to health checks', async () => {
      const response = await axios.get(`${BACKEND_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('OK');
      expect(response.data.uptime).toBeGreaterThan(0);
      expect(response.data.memory).toBeDefined();
      expect(response.data.serviceHealth).toBeDefined();
    });

    test('should provide metrics endpoint', async () => {
      const response = await axios.get(`${BACKEND_URL}/metrics`);
      expect(response.status).toBe(200);
      expect(response.data).toContain('# HELP ellie_uptime_seconds');
      expect(response.data).toContain('ellie_memory_usage_bytes');
      expect(response.data).toContain('ellie_websocket_connections');
    });

    test('should handle API documentation', async () => {
      const response = await axios.get(`${BACKEND_URL}/api`);
      expect(response.status).toBe(200);
      expect(response.data.endpoints).toBeDefined();
      expect(response.data.endpoints.health).toBe('/health');
    });
  });

  describe('Frontend Service', () => {
    test('should serve React application', async () => {
      const response = await axios.get(FRONTEND_URL);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('should handle SPA routing', async () => {
      // Test that non-existent routes still serve the React app
      const response = await axios.get(`${FRONTEND_URL}/non-existent-route`);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('Network Communication', () => {
    test('should allow frontend to communicate with backend', async () => {
      // This tests that the Docker network is properly configured
      const response = await axios.get(`${BASE_URL}/api`);
      expect(response.status).toBe(200);
      expect(response.data.message).toContain('Ellie Voice Receptionist API');
    });

    test('should handle CORS properly', async () => {
      const response = await axios.options(`${BASE_URL}/api`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await axios.get(BASE_URL);
      
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('should include CSP headers', async () => {
      const response = await axios.get(BASE_URL);
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Performance and Monitoring', () => {
    test('should respond to health checks within acceptable time', async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/health`);
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    test('should provide memory usage metrics', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.data.memory.used).toBeGreaterThan(0);
      expect(response.data.memory.total).toBeGreaterThan(0);
    });

    test('should track service health', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.data.serviceHealth).toBeDefined();
      
      // Check that all expected services are tracked
      const services = Object.keys(response.data.serviceHealth);
      expect(services).toContain('openai-whisper');
      expect(services).toContain('openai-tts');
      expect(services).toContain('openai-gpt');
      expect(services).toContain('groq');
    });
  });
});

/**
 * Wait for all services to be ready
 */
async function waitForServices() {
  const maxAttempts = 30;
  const delay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Waiting for services... (attempt ${attempt}/${maxAttempts})`);
      
      // Check if nginx is responding
      await axios.get(BASE_URL, { timeout: 5000 });
      
      // Check if backend health endpoint is responding
      await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      
      console.log('All services are ready!');
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Services failed to start after ${maxAttempts} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}