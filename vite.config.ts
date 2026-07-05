import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cloudflare()],
  resolve: {
    alias: {
      'vue-i18n': resolve(__dirname, 'node_modules/vue-i18n/dist/vue-i18n.esm-browser.js'),
    },
  },
})