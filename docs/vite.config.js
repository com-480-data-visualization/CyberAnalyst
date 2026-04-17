import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use root base for local dev to avoid 404s, keep repo base for production deploy.
  base: '/CyberAnalyst/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}))
