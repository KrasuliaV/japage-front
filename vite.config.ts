import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Auth proxy service (port 8082)
      '/api/auth': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/token': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/users': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // Game backend (port 8080)
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
