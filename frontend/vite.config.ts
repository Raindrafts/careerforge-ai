import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const realRoot = 'C:\\Users\\admin\\OneDrive\\Desktop\\SkillSync Ai\\careerforge-ai\\frontend'

export default defineConfig({
  root: realRoot,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(realRoot, 'src'),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  build: {
    outDir: path.join(realRoot, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
