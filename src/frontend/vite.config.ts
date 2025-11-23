import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import environment from 'vite-plugin-environment';

export default defineConfig({
  root: '.',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
        'process.env': '{}',
      },
    },
  },
  resolve: {
    // Allow resolving declarations from outside the frontend directory
    alias: {
      '@declarations': '../../declarations',
      buffer: 'buffer',
    },
  },
  define: {
    'process.env': '{}',
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4943',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    environment('all', { prefix: 'CANISTER_' }),
    environment('all', { prefix: 'DFX_' }),
  ],
});
