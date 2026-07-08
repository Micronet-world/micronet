/**
 * build-apps.mjs — Compiles each built-in app into the standard .mnapp format.
 *
 * For every app:
 *   1. Generates a temporary entry that wires the Vue component + manifest.
 *   2. Bundles with esbuild — vue / vue-i18n / @micronet/sdk / maplibre-gl
 *      are external (the host provides them at runtime via the SDK loader's
 *      require resolver).
 *   3. .vue files are compiled with @vue/compiler-sfc (script setup →
 *      defineComponent, template → render function, styles → scoped CSS).
 *   4. Wraps the compiled JS + CSS into a MnAppBundle and encodes to the
 *      binary .mnapp format (magic header + JSON payload).
 *   5. Writes public/apps/<id>.mnapp so the files ship with the web page.
 */
import * as esbuild from 'esbuild'
import { parse, compileScript, compileTemplate, compileStyle } from '@vue/compiler-sfc'
import { fileURLToPath } from 'node:url'
import { resolve, dirname, relative } from 'node:path'
import { mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')

const apps = [
  { id: 'lock', dir: 'apps/src/components', name: 'LockScreen' },
  { id: 'home', dir: 'apps/src/components/home', name: 'HomeScreen' },
  { id: 'settings', dir: 'apps/src/components/settings', name: 'SettingsScreen' },
  { id: 'camera', dir: 'apps/src/components/camera', name: 'CameraScreen' },
  { id: 'photos', dir: 'apps/src/components/photos', name: 'PhotosScreen' },
  { id: 'maps', dir: 'apps/src/components/maps', name: 'MapsScreen' },
  { id: 'calendar', dir: 'apps/src/components/calendar', name: 'CalendarScreen' },
  { id: 'notes', dir: 'apps/src/components/notes', name: 'NotesScreen' },
  { id: 'clock', dir: 'apps/src/components/clock', name: 'ClockScreen' },
  { id: 'files', dir: 'apps/src/components/files', name: 'FilesScreen' },
  { id: 'weather', dir: 'apps/src/components/weather', name: 'WeatherScreen' },
  { id: 'calculator', dir: 'apps/src/components/calculator', name: 'CalculatorScreen' },
  { id: 'compass', dir: 'apps/src/components/compass', name: 'CompassScreen' },
]

const externalPatterns = ['vue', 'vue-i18n', '@micronet/sdk', 'maplibre-gl']

// ── esbuild plugin: mark runtime deps as external (exact match only) ───────
const externalPlugin = {
  name: 'runtime-externals',
  setup(build) {
    const filter = new RegExp('^(' + externalPatterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$')
    build.onResolve({ filter }, (args) => ({ path: args.path, external: true }))
  },
}

// ── .mnapp binary encoder (inlined from sdk/src/build.ts) ──────────────────
function encodeBundle(bundle) {
  const json = JSON.stringify(bundle)
  const data = new TextEncoder().encode(json)
  const headerSize = 14 // MNAPP(5) + version(1) + pad(4) + len(4)
  const buf = new ArrayBuffer(headerSize + data.length)
  const view = new DataView(buf)
  const header = new Uint8Array(buf)
  header[0] = 0x4d // M
  header[1] = 0x4e // N
  header[2] = 0x41 // A
  header[3] = 0x50 // P
  header[4] = 0x50 // P
  header[5] = 1 // MNAPP_VERSION
  view.setUint32(10, data.length, false)
  header.set(data, headerSize)
  return header
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function hashPath(path) {
  let hash = 0
  for (let i = 0; i < path.length; i++) {
    hash = ((hash << 5) - hash) + path.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).substring(0, 8)
}

// ── esbuild plugin: compile .vue SFCs with @vue/compiler-sfc ───────────────
const vuePlugin = {
  name: 'vue-sfc',
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async (args) => {
      const source = await readFile(args.path, 'utf-8')
      const filename = args.path
      const scopeId = hashPath(filename)

      const { descriptor, errors: parseErrors } = parse(source, { filename })
      if (parseErrors.length) {
        return { errors: parseErrors.map((e) => ({ text: e.message })) }
      }

      const hasScoped = descriptor.styles.some((s) => s.scoped)

      let code
      if (descriptor.script || descriptor.scriptSetup) {
        const script = compileScript(descriptor, { id: scopeId })
        code = script.content
          // Replace `export default` with a named binding so we can attach
          // render + scopeId afterwards.
          .replace(/export\s+default\s+/, 'const _sfc_main = ')
      } else {
        // No script block — create a bare component object.
        code = 'const _sfc_main = {}\n'
      }

      // Compile template → render function
      if (descriptor.template) {
        const tpl = compileTemplate({
          source: descriptor.template.content,
          filename,
          id: scopeId,
          scoped: hasScoped,
        })
        if (tpl.errors.length) {
          return { errors: tpl.errors.map((e) => ({ text: typeof e === 'string' ? e : e.message })) }
        }
        // Remove the `export` from `export function render`
        const renderCode = tpl.code.replace(/export\s+function\s+render/, 'function render')
        code += '\n' + renderCode
        code += '\n_sfc_main.render = render;'
      }

      if (hasScoped) {
        code += `\n_sfc_main.__scopeId = "data-v-${scopeId}";`
      }

      // Compile and inject styles
      let css = ''
      for (const style of descriptor.styles) {
        const result = compileStyle({
          source: style.content,
          filename,
          id: scopeId,
          scoped: style.scoped,
        })
        if (result.errors.length) {
          return { errors: result.errors.map((e) => ({ text: e.message })) }
        }
        css += result.code + '\n'
      }
      if (css) {
        code += `\nif (typeof document !== "undefined" && !document.querySelector('style[data-v-${scopeId}]')) {`
        code += `\n  var __s = document.createElement("style");`
        code += `\n  __s.setAttribute("data-v-${scopeId}");`
        code += `\n  __s.textContent = ${JSON.stringify(css)};`
        code += `\n  document.head.appendChild(__s);`
        code += `\n}`
      }

      code += '\nexport default _sfc_main;'

      return {
        contents: code,
        loader: 'ts',
        resolveDir: dirname(args.path),
      }
    })
  },
}

// ── esbuild plugin: convert .css imports to runtime style injection ────────
const cssPlugin = {
  name: 'css-inject',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await readFile(args.path, 'utf-8')
      return {
        contents: `if (typeof document !== "undefined") { var __s = document.createElement("style"); __s.textContent = ${JSON.stringify(css)}; document.head.appendChild(__s); }`,
        loader: 'js',
      }
    })
  },
}

async function buildApp(app) {
  const tmpDir = resolve(root, '.build-tmp', app.id)
  await mkdir(tmpDir, { recursive: true })

  const componentPath = resolve(root, app.dir, `${app.name}.vue`)
  const manifestPath = resolve(root, app.dir, `${app.name}.manifest.json`)
  const entryPath = resolve(tmpDir, 'entry.mjs')

  const componentRel = relative(tmpDir, componentPath)
  const manifestRel = relative(tmpDir, manifestPath)

  await writeFile(
    entryPath,
    `import Component from './${componentRel}'\n` +
    `import manifest from './${manifestRel}'\n` +
    `export default { manifest, component: Component }\n`,
  )

  const outPath = resolve(tmpDir, 'app.cjs')

  await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    format: 'cjs',
    target: 'es2020',
    platform: 'browser',
    outfile: outPath,
    plugins: [externalPlugin, vuePlugin, cssPlugin],
    logLevel: 'warning',
    sourcemap: false,
    minify: false,
  })

  const code = await readFile(outPath, 'utf-8')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))

  const bundle = {
    manifest,
    code,
  }

  const bytes = encodeBundle(bundle)
  const mnappPath = resolve(root, 'public/apps', `${app.id}.mnapp`)
  await mkdir(dirname(mnappPath), { recursive: true })
  await writeFile(mnappPath, bytes)

  await rm(resolve(root, '.build-tmp'), { recursive: true, force: true })

  return bytes.length
}

async function main() {
  console.log('Building .mnapp bundles…\n')
  const outDir = resolve(root, 'public/apps')
  await mkdir(outDir, { recursive: true })

  let total = 0
  for (const app of apps) {
    const size = await buildApp(app)
    total += size
    console.log(`  ${app.id.padEnd(12)} ${formatSize(size)}`)
  }

  console.log(`\n${apps.length} apps → public/apps/ (${formatSize(total)} total)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
