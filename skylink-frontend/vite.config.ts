import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react-dom')) return 'vendor-react';
          if (id.includes('/react/')) return 'vendor-react';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';

          if (id.includes('axios') || id.includes('json-bigint')) return 'vendor-net';
          if (id.includes('@google/genai')) return 'vendor-ai';
          if (id.includes('lucide-react')) return 'vendor-icons';

          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true
  }
})