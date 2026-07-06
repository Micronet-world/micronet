# AGENTS.md

Guidance for agents working in `micronet/` (the Vue 3 lock-screen prototype). Run all commands from this directory.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build (also the only typecheck) | `npm run build` → `vue-tsc -b && vite build` |
| Preview prod build | `npm run preview` |
| Run all tests | `npm run test` (`vitest run`) |
| Watch tests | `npm run test:watch` |
| Single test file | `npx vitest run apps/src/components/__tests__/LockScreen.spec.ts` |
| Single test by name | `npx vitest run -t "unlocks to home"` |

- **No `typecheck`, `lint`, or `format` scripts exist.** `npm run build` is the typecheck gate (a `vue-tsc -b` project-referenced build). No ESLint/Prettier is configured — don't add one unless asked.
- TS is strict: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `verbatimModuleSyntax` (in `tsconfig.node.json`). Use `import type` for type-only imports in `vite.config.ts` / `vitest.config.ts` / `aliases.ts`.
- **Package import names are `@micronet/kernel`, `@micronet/sdk`, `@micronet/apps`** (scoped). These are path-aliased to `kernel/src` / `sdk/src` / `apps/src` via the shared `aliases.ts` module consumed by both `vite.config.ts` and `vitest.config.ts` (and `paths` in `tsconfig.app.json`). Don't reintroduce the unscoped `micronet-*` spellings.

## Architecture

- **No router, no state library.** Screens are registered through a middleware layer; navigation is a stack state machine.
- **Three-package structure** (`kernel/`, `sdk/`, `apps/`): The codebase is split into three packages under `Micronet-world`:
  - **`kernel/`** (AGPL-3.0): Core runtime — middleware, composables, i18n. Published as `@micronet/kernel`.
  - **`sdk/`** (MIT): Developer tools — app loader, store, compiler, bundler, CLI, helpers. Published as `@micronet/sdk`.
  - **`apps/`** (MIT): Built-in screens — lock, home, settings, camera, photos, maps, calendar, notes, clock, files, weather. Published as `@micronet/apps`.
- **`src/`** is the composition root: `App.vue` wires kernel + sdk + apps together. Integration tests live here.
- **Middleware** (`kernel/src/middleware/`): The sole bridge between apps and the kernel runtime.
  - `types.ts`: `ScreenId`, `ScreenMeta`, `NavIntent`, `ScreenRegistration`, `NavRequest`.
  - `bus.ts`: Pub/sub message bus with two channels — `onNav` (navigation requests) and `onScreen` (screen registration).
  - `navigation.ts`: `useNavigation()` composable for apps. Returns `goTo(screen)`, `goBack()`, `goHome()`, `lock()`, `navigate(screen)`.
  - `registry.ts`: `registerScreen(meta, events)` stores screen metadata and event-to-intent mappings.
  - `kernel.ts`: `useKernelBridge()` composable for `App.vue`. Subscribes to nav messages, dispatches through `useScreenStack`.
  - `screens.ts`: `registerScreenComponents(map)` for apps to register their Vue components with the kernel.
- **Screen registration** happens at module-import time via `*.register.ts` files in `apps/src/components/`. Each calls `registerScreen(meta, events)` from `@micronet/kernel` as a side effect. The `apps/src/index.ts` barrel imports all `.register.ts` files and exports `screenComponents`.
- **`useScreenStack`** (`kernel/src/composables/useScreenStack.ts`) owns `screenStack: ref<ScreenId[]>`, `currentScreen` (stack top), and a single `dispatch(intent: NavIntent)` reducer covering `push`/`lock`/`home`/`back`/`navigate`.
- `src/App.vue` renders the current screen with `<component :is="activeComponent" :key="currentScreen">`. It imports from all three packages and calls `registerScreenComponents(appComponents)` to wire apps into the kernel.
- **Shared components** (`apps/src/components/`): `StatusBar`, `TimeDisplay`, `BottomActions`, `SwipeIndicator` are co-located with the screen components; their unit tests live in `apps/src/components/__tests__/`.
- **Shared composables** (`kernel/src/composables/`): `useScreenStack`, `useSwipeGestures`, `usePhotoStore`, `useCalendarStore`, `useNotesStore`, `useFileStore`, `useBluetooth`, `storage`.

## Gesture system

- Gestures are hand-rolled in `useSwipeGestures` with native `touch*`/`mouse*` events (no gesture library is used). Default swipe threshold is 80px; it axis-locks and attaches mouse move/end to `window`. It exposes a **stable `targetRef` function** (not an inline arrow) with a same-element idempotency guard — Vue re-invokes template ref functions on reactive re-renders, so without the guard `attach()→detach()` would strip the window listeners `onStart()` adds mid-gesture. Keep that guard when reusing the composable.
- `onEnd` resolves the swipe from the **last-known pointer position** tracked in `onMove`, not the end event — `touchend` carries no coordinates, so reading the event yields `NaN` deltas.
- **Hold gesture (`onHoldUp`/`holdDelay`):** an upward swipe past `threshold` that then *pauses* (no pointer movement for `holdDelay`, default 250ms) fires `onHoldUp` once mid-press and sets a `holdFired` flag, which suppresses the matching `onSwipeUp` on release. The timer is restarted on every qualifying `onMove`, so a continuous swipe never fires it — only a genuine hold does. `onEnd`/`detach` clear the timer. Currently no screen wires `onHoldUp` — it's a dormant capability.

## Testing

- Vitest with `jsdom`, `@vue/test-utils`, and `globals: true` (`vitest.config.ts`). Specs are `*.spec.ts` co-located in `__tests__/` dirs beside the code; whole-app integration tests are in `src/__tests__/App.integration.spec.ts`.
- **Unit tests for screens** use `onNav` from the middleware to capture navigation requests instead of checking `wrapper.emitted()`. Subscribe in `beforeEach`, assert on `navLog`, and call `resetBus()` in `afterEach`. See `LockScreen.spec.ts` for the pattern.
- Integration tests mount the full `App` and drive gestures by dispatching raw `MouseEvent`/`TouchEvent` on `window` (see the `swipeUp`/`swipeDown` helpers). Reuse that pattern — don't try to simulate a gesture library.
- **`TimeDisplay` polls `new Date()` every second**, so App integration tests wrap each case in `vi.useFakeTimers()` / `vi.useRealTimers()`. Do the same for any test that mounts `App` or `TimeDisplay`, or it will hang or advance real time.

## Repo context

- This directory is one self-contained project inside a larger git repo (the `open-game` monorepo at the parent). It has its own `package.json`/`node_modules` and is **not** part of a shared JS workspace — install and run everything from `micronet/`.
- Pure static Vite SPA: `npm run build` emits `dist/`. There's no SSR or backend here; Cloudflare Workers/Wrangler config elsewhere in the monorepo is unrelated to this project.
