import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
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
    },
    // Define environment variables for the app
    define: {
      __TEST_MODE__: mode === 'test',
    },
  }
})