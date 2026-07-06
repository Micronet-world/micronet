import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { aliases } from './aliases.ts'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: aliases,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./kernel/src/test-setup.ts'],
  },
})
