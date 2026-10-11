import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In development the React app calls /api/* and Vite forwards it to the Node backend.
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:4000'
  const proxy = { '/api': { target: apiTarget, changeOrigin: true } }

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    build: { chunkSizeWarningLimit: 1800 },
  }
})
