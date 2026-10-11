import { copyFile } from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/** Static hosts like GitHub Pages have no SPA rewrites: serving the app as 404.html lets deep links (/track, /order) load. */
const spaFallback = () => ({
  name: 'spa-fallback',
  apply: 'build',
  async writeBundle({ dir }) {
    await copyFile(path.join(dir, 'index.html'), path.join(dir, '404.html'))
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In development the React app calls /api/* and Vite forwards it to the Node backend.
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:4000'
  const proxy = { '/api': { target: apiTarget, changeOrigin: true } }

  return {
    plugins: [react(), spaFallback()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    build: { chunkSizeWarningLimit: 1800 },
  }
})
