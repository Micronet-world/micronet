import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-i18n': resolve(__dirname, 'node_modules/vue-i18n/dist/vue-i18n.esm-browser.js'),
      '@micronet/kernel': resolve(__dirname, 'kernel/src'),
      '@micronet/sdk': resolve(__dirname, 'sdk/src'),
      '@micronet/apps': resolve(__dirname, 'apps/src'),
      'micronet-kernel': resolve(__dirname, 'kernel/src'),
      'micronet-sdk': resolve(__dirname, 'sdk/src'),
      'micronet-apps': resolve(__dirname, 'apps/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./kernel/src/test-setup.ts'],
  },
})
