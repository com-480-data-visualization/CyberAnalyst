import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Local dev at root, production deployed under /CyberAnalyst/ on GitHub Pages.
  base: command === 'serve' ? '/' : '/CyberAnalyst/',
  build: {
    // Build directly into docs so GitHub Pages can serve the generated assets.
    outDir: './',
    emptyOutDir: false,
  },
}))
