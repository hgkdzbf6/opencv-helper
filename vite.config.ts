import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // 允许访问上层目录
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['@techstark/opencv-js']
  }
})
