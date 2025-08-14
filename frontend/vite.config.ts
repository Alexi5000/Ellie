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
      testTimeout: 15000,
      hookTimeout: 10000,
      teardownTimeout: 5000,
      // Better error handling
      bail: 0,
      // Improved async handling
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true, // Use single thread to prevent race conditions
        },
      },
      // Better cleanup
      clearMocks: true,
      restoreMocks: true,
      // Improved reporting
      reporter: ['verbose'],
      // Handle unhandled rejections
      onUnhandledRejection: 'strict',
    },
    // Define environment variables for the app
    define: {
      __TEST_MODE__: mode === 'test',
    },
  }
})