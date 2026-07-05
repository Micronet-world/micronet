# AGENTS.md

Guidance for agents working in `micronet/` (the Vue 3 lock-screen prototype). Run all commands from this directory.

> `CLAUDE.md` in this dir is **stale** on two points: it claims "no test runner" (vitest is configured) and describes navigation as a simple `lock`/`home` ref (it's now a screen stack). Trust this file where they differ.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build (also the only typecheck) | `npm run build` → `vue-tsc -b && vite build` |
| Preview prod build | `npm run preview` |
| Run all tests | `npm run test` (`vitest run`) |
| Watch tests | `npm run test:watch` |
| Single test file | `npx vitest run src/components/LockScreen.spec.ts` |
| Single test by name | `npx vitest run -t "unlocks to home"` |

- **No `typecheck`, `lint`, or `format` scripts exist.** `npm run build` is the typecheck gate (a `vue-tsc -b` project-referenced build). No ESLint/Prettier is configured — don't add one unless asked.
- TS is strict: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `verbatimModuleSyntax` (in `tsconfig.node.json`). Use `import type` for type-only imports in `vite.config.ts` / `vitest.config.ts`.

## Architecture

- **No router, no state library.** Screens are registered as plugins; navigation is a stack state machine.
- **Screen registry** (`src/screens/`): `types.ts` defines `ScreenId`, `ScreenMeta`, `NavIntent`, and `ScreenPlugin`; `registry.ts` holds one `ScreenPlugin` per screen — its `component`, display metadata (`label`/`color`/`icon`), and an `events` map from each emitted event name to a `NavIntent`. **Adding a screen = add one plugin entry** (no edits to `App.vue`).
- **`useScreenStack`** (`src/composables/useScreenStack.ts`) owns `screenStack: ref<ScreenId[]>`, `currentScreen` (stack top), and a single `dispatch(intent: NavIntent)` reducer covering `push`/`lock`/`home`/`back`/`navigate`. `App.vue` calls this and otherwise has no navigation logic.
- `App.vue` renders the current screen with `<component :is="currentPlugin.component" :key="currentScreen" v-on="screenListeners">` — there is **no per-screen `v-if` chain**; `screenListeners` is built from the plugin's `events` map.
- Feature screens live in `src/components/{camera,home,photos,settings}/*Screen.vue`. Lock-screen subcomponents (`StatusBar`, `TimeDisplay`, `BottomActions`, `SwipeIndicator`) sit directly in `src/components/`.
- Shared logic is in `src/composables/`: `useScreenStack` (navigation), `useSwipeGestures` (gestures), and `usePhotoStore` (a module-scope singleton persisted to `localStorage` under key `micronet-photos`, auto-saving via `watch`).

## Gesture system

- **`hammerjs` is in `package.json` but is NOT used.** Gestures are hand-rolled in `useSwipeGestures` with native `touch*`/`mouse*` events. Default swipe threshold is 80px; it axis-locks and attaches mouse move/end to `window`. It exposes a **stable `targetRef` function** (not an inline arrow) with a same-element idempotency guard — Vue re-invokes template ref functions on reactive re-renders, so without the guard `attach()→detach()` would strip the window listeners `onStart()` adds mid-gesture. Keep that guard when reusing the composable.
- `onEnd` resolves the swipe from the **last-known pointer position** tracked in `onMove`, not the end event — `touchend` carries no coordinates, so reading the event yields `NaN` deltas.
- **Hold gesture (`onHoldUp`/`holdDelay`):** an upward swipe past `threshold` that then *pauses* (no pointer movement for `holdDelay`, default 250ms) fires `onHoldUp` once mid-press and sets a `holdFired` flag, which suppresses the matching `onSwipeUp` on release. The timer is restarted on every qualifying `onMove`, so a continuous swipe never fires it — only a genuine hold does. `onEnd`/`detach` clear the timer. Currently no screen wires `onHoldUp` — it's a dormant capability.

## Testing

- Vitest with `jsdom`, `@vue/test-utils`, and `globals: true` (`vitest.config.ts`). Specs are `*.spec.ts` co-located in `__tests__/` dirs beside the code; whole-app integration tests are in `src/__tests__/App.integration.spec.ts`.
- Integration tests mount the full `App` and drive gestures by dispatching raw `MouseEvent`/`TouchEvent` on `window` (see the `swipeUp`/`swipeDown` helpers). Reuse that pattern — don't try to simulate hammerjs.
- **`TimeDisplay` polls `new Date()` every second**, so App integration tests wrap each case in `vi.useFakeTimers()` / `vi.useRealTimers()`. Do the same for any test that mounts `App` or `TimeDisplay`, or it will hang or advance real time.

## Repo context

- This directory is one self-contained project inside a larger git repo (the `open-game` monorepo at the parent). It has its own `package.json`/`node_modules` and is **not** part of a shared JS workspace — install and run everything from `micronet/`.
- Pure static Vite SPA: `npm run build` emits `dist/`. There's no SSR or backend here; Cloudflare Workers/Wrangler config elsewhere in the monorepo is unrelated to this project.
