// Test setup for backend
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock external APIs for testing
jest.mock('openai');
jest.mock('groq-sdk');

// Set test timeout
jest.setTimeout(10000);