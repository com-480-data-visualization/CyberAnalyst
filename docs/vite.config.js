import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const devIndexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CyberAnalyst</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`

// After build: save the production index.html as index.prod.html,
// then restore the dev index.html so the dev server keeps working.
function manageIndex() {
  return {
    name: 'manage-index',
    closeBundle() {
      const root = path.resolve(__dirname)
      const built = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
      fs.writeFileSync(path.join(root, 'index.prod.html'), built)
      fs.writeFileSync(path.join(root, 'index.html'), devIndexHtml)
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'build' ? [manageIndex()] : [])],
  base: command === 'serve' ? '/' : '/CyberAnalyst/',
  build: {
    outDir: './',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
}))
