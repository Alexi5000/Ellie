// Test setup for backend
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock external APIs for testing
jest.mock('openai');
jest.mock('groq-sdk');

// Mock Redis to prevent connection attempts during tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    isReady: false,
    isOpen: false
  }))
}));

// Set test timeout
jest.setTimeout(10000);

// Global test cleanup
afterAll(async () => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Wait a bit for any pending async operations
  await new Promise(resolve => setTimeout(resolve, 100));
});