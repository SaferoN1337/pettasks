import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  define: {
    '__VUE_PROD_DEVTOOLS__': false,
    '__VUE_OPTIONS_API__': false,
    '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': false,
  },
  build: {
    modulePreload: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks: () => 'index',
      },
    },
  },
})
