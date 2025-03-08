import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      external: ['bcryptjs', '@cloudflare/workers-types'],
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          style: ['element-plus/es'],
          icons: ['@element-plus/icons-vue']
        }
      }
    }
  }
})