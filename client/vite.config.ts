import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BACKEND_URL = 'https://creative-agent.alphasapien17.workers.dev';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/generate': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/images': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/sessions': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
    },
  },
})
