import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin"

export default defineConfig(({ mode }) => {
  // Load .env files from workspace root (one level up from client/) so we can
  // share SENTRY_AUTH_TOKEN with the worker deploy script.
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Source map upload runs only when an auth token is present (build environments).
      // Skipped in dev to avoid blocking on missing creds.
      ...(env.SENTRY_AUTH_TOKEN
        ? [sentryVitePlugin({
            org: env.SENTRY_ORG || 'creative-machines',
            project: env.SENTRY_PROJECT || 'javascript-react',
            authToken: env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              // Delete .map files from dist after upload so they don't ship to users
              filesToDeleteAfterUpload: ['dist/**/*.map'],
            },
          })]
        : []),
    ],
    build: {
      // 'hidden' generates source maps but doesn't reference them in the bundle.
      // Sentry uses them server-side; users don't see them in DevTools.
      sourcemap: 'hidden',
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      watch: {
        ignored: ['**/tsconfig.json', '**/.env'],
      },
      port: 5173,
      proxy: {
        '/ws': {
          target: 'http://localhost:3001',
          ws: true,
        },
        '/api': {
          target: 'http://localhost:3001',
        },
        '/images': {
          target: 'http://localhost:3001',
        },
        '/sessions': {
          target: 'http://localhost:3001',
        },
        '/health': {
          target: 'http://localhost:3001',
        },
      },
    },
  }
})
