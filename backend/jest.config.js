module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Environment configuration
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test/env-setup.ts'],
  // Improved async handling and cleanup
  testTimeout: 30000, // Increased timeout for async operations
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1, // Use single worker to prevent race conditions
  // Ensure proper cleanup between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Better error handling
  verbose: false,
  silent: false,
  // Improved test isolation
  resetModules: true,
  isolateModules: false,
  // Handle unhandled promise rejections
  testFailureExitCode: 1,
};