/**
 * build-mnapp.mjs — Compile all built-in apps into .mnapp binary bundles.
 *
 * Self-contained: works both from the monorepo root and from the apps/
 * sub-repo.  Only depends on esbuild and @vue/compiler-sfc (listed as
 * devDependencies of @micronet/apps).
 *
 * Usage:
 *   node scripts/build-mnapp.mjs              # from apps/
 *   node apps/scripts/build-mnapp.mjs         # from monorepo root
 *
 * Output:
 *   apps/dist/           — compiled JS bundles
 *   apps/dist/*.mnapp    — binary .mnapp files
 */
import * as esbuild from 'esbuild'
import { parse, compileScript, compileTemplate, compileStyle } from '@vue/compiler-sfc'
import { fileURLToPath } from 'node:url'
import { resolve, dirname, relative } from 'node:path'
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'

// ── Path resolution ──────────────────────────────────────────────────────
// Detect whether we're running from apps/ or from the monorepo root.
const scriptDir = dirname(fileURLToPath(import.meta.url))
const appsRoot = resolve(scriptDir, '..')
const isSubrepo = appsRoot.endsWith('/apps') || appsRoot.endsWith('\\apps')
const root = isSubrepo ? appsRoot : resolve(appsRoot, '..')
const srcDir = resolve(appsRoot, 'src', 'components')

// ── App manifest ─────────────────────────────────────────────────────────
const apps = [
  { id: 'lock', dir: srcDir, name: 'LockScreen' },
  { id: 'home', dir: resolve(srcDir, 'home'), name: 'HomeScreen' },
  { id: 'settings', dir: resolve(srcDir, 'settings'), name: 'SettingsScreen' },
  { id: 'camera', dir: resolve(srcDir, 'camera'), name: 'CameraScreen' },
  { id: 'photos', dir: resolve(srcDir, 'photos'), name: 'PhotosScreen' },
  { id: 'maps', dir: resolve(srcDir, 'maps'), name: 'MapsScreen' },
  { id: 'calendar', dir: resolve(srcDir, 'calendar'), name: 'CalendarScreen' },
  { id: 'notes', dir: resolve(srcDir, 'notes'), name: 'NotesScreen' },
  { id: 'clock', dir: resolve(srcDir, 'clock'), name: 'ClockScreen' },
  { id: 'files', dir: resolve(srcDir, 'files'), name: 'FilesScreen' },
  { id: 'weather', dir: resolve(srcDir, 'weather'), name: 'WeatherScreen' },
  { id: 'calculator', dir: resolve(srcDir, 'calculator'), name: 'CalculatorScreen' },
  { id: 'compass', dir: resolve(srcDir, 'compass'), name: 'CompassScreen' },
]

const externalPatterns = ['vue', 'vue-i18n', '@micronet/sdk', 'maplibre-gl']

// ── esbuild plugin: mark runtime deps as external ────────────────────────
const externalPlugin = {
  name: 'runtime-externals',
  setup(build) {
    const filter = new RegExp(
      '^(' + externalPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$',
    )
    build.onResolve({ filter }, args => ({ path: args.path, external: true }))
  },
}

// ── esbuild plugin: compile .vue SFCs ────────────────────────────────────
function hashPath(path) {
  let hash = 0
  for (let i = 0; i < path.length; i++) {
    hash = ((hash << 5) - hash) + path.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).substring(0, 8)
}

const vuePlugin = {
  name: 'vue-sfc',
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async args => {
      const source = await readFile(args.path, 'utf-8')
      const filename = args.path
      const scopeId = hashPath(filename)

      const { descriptor, errors: parseErrors } = parse(source, { filename })
      if (parseErrors.length) {
        return { errors: parseErrors.map(e => ({ text: e.message })) }
      }

      const hasScoped = descriptor.styles.some(s => s.scoped)

      let code
      if (descriptor.script || descriptor.scriptSetup) {
        const script = compileScript(descriptor, { id: scopeId })
        code = script.content.replace(/export\s+default\s+/, 'const _sfc_main = ')
      } else {
        code = 'const _sfc_main = {}\n'
      }

      if (descriptor.template) {
        const tpl = compileTemplate({
          source: descriptor.template.content,
          filename,
          id: scopeId,
          scoped: hasScoped,
        })
        if (tpl.errors.length) {
          return { errors: tpl.errors.map(e => ({ text: typeof e === 'string' ? e : e.message })) }
        }
        const renderCode = tpl.code.replace(/export\s+function\s+render/, 'function render')
        code += '\n' + renderCode
        code += '\n_sfc_main.render = render;'
      }

      if (hasScoped) {
        code += `\n_sfc_main.__scopeId = "data-v-${scopeId}";`
      }

      let css = ''
      for (const style of descriptor.styles) {
        const result = compileStyle({
          source: style.content,
          filename,
          id: scopeId,
          scoped: style.scoped,
        })
        if (result.errors.length) {
          return { errors: result.errors.map(e => ({ text: e.message })) }
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

      return { contents: code, loader: 'ts', resolveDir: dirname(args.path) }
    })
  },
}

// ── esbuild plugin: convert .css imports to runtime style injection ──────
const cssPlugin = {
  name: 'css-inject',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async args => {
      const css = await readFile(args.path, 'utf-8')
      return {
        contents: `if (typeof document !== "undefined") { var __s = document.createElement("style"); __s.textContent = ${JSON.stringify(css)}; document.head.appendChild(__s); }`,
        loader: 'js',
      }
    })
  },
}

// ── .mnapp binary encoder ────────────────────────────────────────────────
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
  header[5] = 1    // MNAPP_VERSION
  view.setUint32(10, data.length, false)
  header.set(data, headerSize)
  return header
}

// ── Build helpers ────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Build one app ────────────────────────────────────────────────────────
async function buildApp(app) {
  const tmpDir = resolve(appsRoot, '.build-tmp', app.id)
  await mkdir(tmpDir, { recursive: true })

  const componentPath = resolve(app.dir, `${app.name}.vue`)
  const manifestPath = resolve(app.dir, `${app.name}.manifest.json`)
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

  const bundle = { manifest, code }
  const bytes = encodeBundle(bundle)

  // Write to dist/ directory
  const distDir = resolve(appsRoot, 'dist')
  await mkdir(distDir, { recursive: true })
  const mnappPath = resolve(distDir, `${app.id}.mnapp`)
  await writeFile(mnappPath, bytes)

  return bytes.length
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('Building .mnapp bundles…\n')
  const outDir = resolve(appsRoot, 'dist')
  await mkdir(outDir, { recursive: true })

  let total = 0
  for (const app of apps) {
    const size = await buildApp(app)
    total += size
    console.log(`  ${app.id.padEnd(12)} ${formatSize(size)}`)
  }

  // Clean up temp directory
  await rm(resolve(appsRoot, '.build-tmp'), { recursive: true, force: true })

  console.log(`\n${apps.length} apps → dist/ (${formatSize(total)} total)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
