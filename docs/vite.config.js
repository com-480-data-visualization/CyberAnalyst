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
    // Clean only the assets folder on each build to avoid stale hashed bundles
    // while preserving public/, src/, sketches/, etc.
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
}))
