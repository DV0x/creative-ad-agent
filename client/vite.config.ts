import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Local Express server for development
const LOCAL_BACKEND = 'http://localhost:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // WebSocket proxy - target must be http, ws:true handles upgrade
      '/ws': {
        target: LOCAL_BACKEND,
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
      },
      // REST API proxies
      '/generate': {
        target: LOCAL_BACKEND,
        changeOrigin: true,
      },
      '/images': {
        target: LOCAL_BACKEND,
        changeOrigin: true,
      },
      '/sessions': {
        target: LOCAL_BACKEND,
        changeOrigin: true,
      },
      '/health': {
        target: LOCAL_BACKEND,
        changeOrigin: true,
      },
    },
  },
})
