import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use root base for both dev and production (serving from repo root on GitHub Pages)
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}))
