import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from "@tailwindcss/vite"
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/admin',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },

  // ========== 开发服务器配置 ==========
  server: {
    port: 5173,           // 前端端口
    host: true,           // 监听所有地址

    // ★ 核心：代理配置
    proxy: {
      // 所有以 /api 开头的请求都会被代理
      '/api': {
        target: 'http://localhost:8080',  // 后端服务地址
        changeOrigin: true,                // 修改请求头中的 Origin
        secure: false,                     // 如果是 https 接口，需要配置这个参数

        // 可选：重写路径（如果后端没有 /api 前缀）
        // rewrite: (path) => path.replace(/^\/api/, ''),

      },
    },
  },
})
