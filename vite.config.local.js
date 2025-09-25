import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend/src')
    }
  },
  base: './', // 关键配置：使用相对路径
  build: {
    outDir: 'frontend/dist-fixed',
    assetsDir: 'assets',
    rollupOptions: {
      input: resolve(__dirname, 'frontend/index.html')
    }
  }
})