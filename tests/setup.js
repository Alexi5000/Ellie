// Jest setup file for Docker integration tests

// Increase timeout for Docker operations
jest.setTimeout(180000);

// Global test configuration
global.testConfig = {
  baseUrl: 'http://localhost',
  frontendPort: 3000,
  backendPort: 5000,
  nginxPort: 80,
  httpsPort: 443,
  prometheusPort: 9090,
  maxRetries: 60,
  retryDelay: 2000
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup function for tests
global.cleanup = () => {
  // Any global cleanup logic can go here
  console.log('Test cleanup completed');
};

// Setup console logging for better test debugging
const originalConsoleLog = console.log;
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  originalConsoleLog(`[${timestamp}]`, ...args);
};