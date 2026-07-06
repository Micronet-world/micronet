import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))

export const aliases: Record<string, string> = {
  'vue-i18n': resolve(root, 'node_modules/vue-i18n/dist/vue-i18n.esm-browser.js'),
  '@micronet/kernel': resolve(root, 'kernel/src'),
  '@micronet/sdk': resolve(root, 'sdk/src'),
  '@micronet/apps': resolve(root, 'apps/src'),
}
