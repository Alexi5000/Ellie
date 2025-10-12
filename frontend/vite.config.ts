import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      // Custom plugin to handle health endpoint
      {
        name: 'health-endpoint',
        configureServer(server) {
          server.middlewares.use('/health', (req, res, next) => {
            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                status: 'OK',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                service: 'frontend'
              }));
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      env: {
        // Load test environment variables
        ...env,
        VITE_TEST_MODE: 'true',
        VITE_MOCK_AUDIO: 'true',
        VITE_SKIP_PERMISSIONS: 'true',
      },
      // Improved test isolation and timeout handling
      testTimeout: 20000, // Increased timeout for async operations
      hookTimeout: 15000, // Increased hook timeout
      teardownTimeout: 10000, // Increased teardown timeout
      // Better error handling
      bail: 0,
      // Improved async handling - use forks for better isolation
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true, // Use single fork to prevent race conditions
        },
      },
      // Better cleanup
      clearMocks: true,
      restoreMocks: true,
      mockReset: true,
      // Improved reporting
      reporter: ['verbose'],
      // Handle unhandled rejections
      onUnhandledRejection: 'strict',
      // Improved test isolation
      isolate: true,
      // Retry flaky tests once
      retry: 1,
    },
    // Define environment variables for the app
    define: {
      __TEST_MODE__: mode === 'test',
    },
  }
})