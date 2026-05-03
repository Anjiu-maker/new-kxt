import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('element-plus') || id.includes('@element-plus')) return 'element-plus'
          if (id.includes('echarts')) return 'echarts'
          if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) return 'vue-vendor'
          if (id.includes('axios') || id.includes('lodash') || id.includes('dayjs')) return 'shared-vendor'
          return 'vendor'
        }
      }
    },
    chunkSizeWarningLimit: 1200
  }
})
