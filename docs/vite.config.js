import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use root base for local dev, repo base for GitHub Pages builds.
  base: command === 'serve' ? '/' : '/CyberAnalyst/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}))
