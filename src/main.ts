import { createApp } from 'vue'
import * as Vue from 'vue'
import * as VueI18n from 'vue-i18n'
import * as MicronetSDK from '@micronet/sdk'
import maplibregl from 'maplibre-gl'
import { setKernel, i18n } from '@micronet/kernel'
import { configureLoader } from '@micronet/sdk'
import './style.css'
import App from './App.vue'
import { createKernelAPI } from './kernel-setup'
import { loadAppsAsync, loadAppsSync } from './app-loader'

// The kernel must be initialised before any SDK loader call —
// registerAppInstance() inside the loader calls getKernel().registerScreen().
setKernel(createKernelAPI())

// Provide the host's runtime modules to .mnapp bundles.  Each compiled app
// does require("vue"), require("@micronet/sdk"), etc.; the resolver returns
// the same instances the host already loaded so there is no duplicate Vue.
configureLoader({
  requireResolver: (mod: string) => {
    if (mod === 'vue') return Vue
    if (mod === 'vue-i18n') return VueI18n
    if (mod === '@micronet/sdk') return MicronetSDK
    if (mod === 'maplibre-gl') return maplibregl
    return {}
  },
})

async function bootstrap(): Promise<void> {
  if (import.meta.env.PROD) {
    // Production: fetch compiled .mnapp bundles from /apps/ and load via SDK.
    await loadAppsAsync()
  } else {
    // Dev: register apps directly from source for hot-module reload support.
    const { appEntries } = await import('@micronet/apps')
    loadAppsSync(appEntries)
  }

  createApp(App).use(i18n).mount('#app')
}

bootstrap()
