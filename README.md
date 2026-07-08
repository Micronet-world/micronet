<p align="center">
  <img src="public/favicon.svg" alt="Micronet Logo" width="80" height="80">
</p>

<h1 align="center">Micronet</h1>

<p align="center">
  A modular, plugin-based mobile interface framework built with Vue 3, TypeScript, and Vite.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#development">Development</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

Micronet is a lightweight, extensible mobile interface framework designed for building modular screen-based applications. It implements a plugin architecture where screens (apps) are registered through a middleware layer and composed at runtime via a navigation stack state machine.

The project is structured as a monorepo containing three core packages:

| Package | Description | License |
|---------|-------------|---------|
| **[@micronet/kernel](https://github.com/Micronet-world/kernel)** | Core runtime, middleware, composables, and shared components | AGPL-3.0 |
| **[@micronet/sdk](https://github.com/Micronet-world/sdk)** | App development tools, loader, compiler, and CLI | MIT |
| **[@micronet/apps](https://github.com/Micronet-world/apps)** | Built-in screens (lock, home, settings, camera, photos, maps, calendar) | MIT |

## Features

- **Plugin Architecture** — Register screens as plugins with metadata, events, and components
- **Navigation Stack** — Deterministic state machine for push, pop, home, lock, and navigate operations
- **Gesture System** — Hand-rolled touch/mouse gesture detection with axis locking and configurable thresholds
- **i18n Support** — Built-in internationalization with Vue I18n integration
- **App Store** — Persistent app registry with state management (registered, loading, enabled, disabled, error)
- **Type Safety** — Full TypeScript support with strict mode and comprehensive type definitions
- **Zero Router Dependencies** — No vue-router or external routing libraries required
- **Composable API** — Vue 3 composables for navigation, gestures, storage, photos, calendar, and Bluetooth

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.vue                                │
│                    (Composition Root)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Kernel     │  │    SDK      │  │    Apps     │             │
│  │  (Runtime)   │  │  (Tools)    │  │ (Screens)   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │     Middleware        │                          │
│              │  ┌─────────────────┐  │                          │
│              │  │ Navigation Bus  │  │                          │
│              │  │ Screen Registry │  │                          │
│              │  │ Screen Stack    │  │                          │
│              │  └─────────────────┘  │                          │
│              └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Middleware Layer

The middleware is the sole bridge between apps and the kernel runtime:

- **`types.ts`** — Core type definitions (`ScreenId`, `ScreenMeta`, `NavIntent`, `ScreenRegistration`)
- **`bus.ts`** — Pub/sub message bus with `onNav` and `onScreen` channels
- **`navigation.ts`** — `useNavigation()` composable for apps (`goTo`, `goBack`, `goHome`, `lock`, `navigate`)
- **`registry.ts`** — `registerScreen(meta, events)` stores screen metadata and event-to-intent mappings
- **`kernel.ts`** — `useKernelBridge()` composable for `App.vue` to subscribe to navigation messages
- **`screens.ts`** — `registerScreenComponents(map)` for apps to register Vue components with the kernel

### Screen Registration

Screens are registered through **`manifest.json`** files co-located with each screen component. Each manifest declares `id`, `name`, `version`, `icon`, `color`, `events` (string→intent mappings), and `permissions`:

```json
// LockScreen.manifest.json
{
  "id": "lock",
  "name": "Lock Screen",
  "version": "1.0.0",
  "icon": "🔒",
  "color": "#faf9f6",
  "events": {
    "unlock": "push:home",
    "go-camera": "push:camera"
  }
}
```

Apps are compiled into the standard **`.mnapp`** binary format by `scripts/build-apps.mjs` and deployed as static assets in `public/apps/`. At runtime, the SDK loader fetches each `.mnapp`, decodes it, and registers the screen with the kernel.

### Navigation Stack

The `useScreenStack` composable owns the navigation state:

```typescript
import { useScreenStack } from '@micronet/kernel'

const { screenStack, currentScreen, dispatch } = useScreenStack()

// Push a new screen
dispatch({ type: 'push', screen: 'settings' })

// Go back
dispatch({ type: 'back' })

// Go home
dispatch({ type: 'home' })

// Lock
dispatch({ type: 'lock' })
```

### Gesture System

Hand-rolled touch/mouse gesture detection with axis locking:

```typescript
import { useSwipeGestures } from '@micronet/kernel'

const { targetRef } = useSwipeGestures({
  onSwipeUp: () => console.log('Swiped up'),
  onSwipeDown: () => console.log('Swiped down'),
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  threshold: 80,
})

// Attach to element via template ref
// <div ref="targetRef">...</div>
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation

Clone the repository:

```bash
git clone https://github.com/Micronet-world/micronet.git
cd micronet
```

Install dependencies:

```bash
npm install
```

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Build

Build for production:

```bash
npm run build
```

The build output will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

## Development

### Project Structure

```
micronet/
├── src/                          # Composition root
│   ├── App.vue                   # Main application component
│   ├── main.ts                   # Application entry point
│   ├── style.css                 # Global styles
│   └── __tests__/                # Integration tests
├── kernel/                       # Core runtime package
│   ├── src/
│   │   ├── middleware/           # Navigation and screen registration
│   │   │   ├── types.ts          # Core type definitions
│   │   │   ├── bus.ts            # Pub/sub message bus
│   │   │   ├── navigation.ts     # Navigation composable
│   │   │   ├── registry.ts       # Screen registry
│   │   │   ├── kernel.ts         # Kernel bridge composable
│   │   │   └── screens.ts        # Screen component registration
│   │   ├── composables/          # Vue 3 composables
│   │   │   ├── useScreenStack.ts # Navigation stack state machine
│   │   │   ├── useSwipeGestures.ts # Touch/mouse gesture detection
│   │   │   ├── storage.ts        # Local storage abstraction
│   │   │   ├── usePhotoStore.ts  # Photo management
│   │   │   ├── useCalendarStore.ts # Calendar event management
│   │   │   └── useBluetooth.ts   # Bluetooth device communication
│   │   ├── components/           # Shared Vue components
│   │   │   ├── StatusBar.vue     # Device status bar
│   │   │   ├── TimeDisplay.vue   # Clock display
│   │   │   ├── BottomActions.vue # Bottom action buttons
│   │   │   └── SwipeIndicator.vue # Swipe gesture indicator
│   │   ├── i18n/                 # Internationalization
│   │   ├── injection.ts          # Runtime dependency injection
│   │   └── index.ts              # Package exports
│   ├── tsconfig.json
│   └── package.json
├── sdk/                          # App development tools
│   ├── src/
│   │   ├── types.ts              # SDK type definitions
│   │   ├── helpers.ts            # Helper functions
│   │   ├── loader.ts             # App loader
│   │   ├── store.ts              # App store management
│   │   ├── compiler.ts           # SFC and JS compiler
│   │   ├── bundler.ts            # App bundler
│   │   ├── build.ts              # Build utilities
│   │   ├── cli.ts                # CLI commands
│   │   └── utils.ts              # Utility functions
│   ├── tsconfig.json
│   └── package.json
├── apps/                         # Built-in screens
│   ├── src/
│   │   ├── components/
│   │   │   ├── LockScreen.vue    # Lock screen
│   │   │   ├── home/             # Home screen
│   │   │   ├── settings/         # Settings screen
│   │   │   ├── camera/           # Camera screen
│   │   │   ├── photos/           # Photos gallery
│   │   │   ├── maps/             # Maps screen
│   │   │   └── calendar/         # Calendar screen
│   │   ├── index.ts              # App registration
│   │   └── kernel.ts             # Kernel integration
│   ├── tsconfig.json
│   └── package.json
├── vite.config.ts                # Vite configuration
├── vitest.config.ts              # Vitest configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Root package.json
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (includes TypeScript type checking) |
| `npm run preview` | Preview production build |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npx vitest run src/components/LockScreen.spec.ts` | Run a single test file |
| `npx vitest run -t "unlocks to home"` | Run tests matching a name |

### TypeScript

This project uses strict TypeScript with the following settings:

- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `erasableSyntaxOnly: true`
- `verbatimModuleSyntax: true`

Type checking is performed during the build process via `vue-tsc`.

### Testing

Tests are written with [Vitest](https://vitest.dev/) and [Vue Test Utils](https://test-utils.vuejs.org/):

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run a specific test file
npx vitest run src/components/LockScreen.spec.ts

# Run tests matching a pattern
npx vitest run -t "unlocks to home"
```

#### Test Patterns

Unit tests for screens use the `onNav` middleware to capture navigation requests:

```typescript
import { onNav, resetBus } from '@micronet/kernel'

let navLog: NavRequest[] = []

beforeEach(() => {
  navLog = []
  onNav((msg) => navLog.push(msg))
})

afterEach(() => {
  resetBus()
})

it('navigates to home on unlock', async () => {
  const wrapper = mount(LockScreen)
  await wrapper.find('.unlock-button').trigger('click')
  expect(navLog).toContainEqual({ action: 'push', screen: 'home' })
})
```

Integration tests mount the full `App` and drive gestures with raw events:

```typescript
function swipeUp(target: Element) {
  const rect = target.getBoundingClientRect()
  const startY = rect.bottom - 10
  const endY = rect.top + 10
  
  target.dispatchEvent(new TouchEvent('touchstart', {
    touches: [new Touch({ identifier: 0, target, clientX: rect.width / 2, clientY: startY })],
  }))
  
  target.dispatchEvent(new TouchEvent('touchmove', {
    touches: [new Touch({ identifier: 0, target, clientX: rect.width / 2, clientY: endY })],
  }))
  
  target.dispatchEvent(new TouchEvent('touchend', { touches: [] }))
}
```

## API Reference

### Kernel API

The kernel provides the core runtime functionality:

```typescript
interface KernelAPI {
  useNavigation(): {
    goTo(screen: ScreenId): void
    goBack(): void
    goHome(): void
    lock(): void
    navigate(screen: ScreenId): void
  }
  registerScreen(meta: ScreenMeta, events: Record<string, NavIntent>): void
  getRegisteredScreen(id: ScreenId): ScreenRegistration | undefined
  getRegisteredScreens(): ScreenRegistration[]
  resetRegistry(): void
  onNav(handler: (msg: NavRequest) => void): () => void
  resetBus(): void
  registerScreenComponents(components: Record<string, Component>): void
}
```

### Core Types

```typescript
type ScreenId = 'lock' | 'home' | 'settings' | 'camera' | 'photos' | 'maps' | 'calendar'

interface ScreenMeta {
  id: ScreenId
  label: string
  color: string
  icon: string
}

type NavIntent =
  | { type: 'push'; screen: ScreenId }
  | { type: 'lock' }
  | { type: 'home' }
  | { type: 'back' }
  | { type: 'navigate'; screen: ScreenId }

interface NavRequest {
  action: 'push' | 'back' | 'home' | 'lock' | 'navigate'
  screen?: ScreenId
}
```

### SDK API

The SDK provides tools for app development:

```typescript
// App definition
function defineManifest(config: AppManifest): AppManifest
function defineApp(manifest: AppManifest, component: Component): AppDefinition

// App storage
function useAppStorage(appId: string): AppStorage

// App events
function useAppEvents(appId: string): AppEvents

// App i18n
function useAppI18n(appId: string, messages: Record<string, Record<string, string>>): AppI18n

// App loader
function loadApp(manifest: AppManifest, component: Component): Promise<AppInstance>
function loadAppFromString(bundleCode: string): AppInstance
function loadAppFromUrl(url: string): Promise<AppInstance>
function unloadApp(id: string): Promise<boolean>
function enableApp(id: string): Promise<void>
function disableApp(id: string): Promise<void>

// App store
function initStore(storeConfig?: AppStoreConfig): Promise<void>
function registerApp(manifest: AppManifest, source?: string): Promise<AppStoreEntry>
function exportStore(): Promise<string>
function importStore(data: string): Promise<number>
```

### Composables

#### useScreenStack

Manages the navigation stack state:

```typescript
const { screenStack, currentScreen, dispatch } = useScreenStack()
```

#### useSwipeGestures

Detects swipe gestures on touch/mouse devices:

```typescript
const { targetRef } = useSwipeGestures({
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onHoldUp?: () => void
  threshold?: number
  holdDelay?: number
})
```

#### usePhotoStore

Manages photo storage and metadata:

```typescript
const { photos, addPhoto, deletePhoto, getPhoto, clearPhotos } = usePhotoStore()
```

#### useCalendarStore

Manages calendar events:

```typescript
const { events, addEvent, deleteEvent, getEventsForDate, clearEvents } = useCalendarStore()
```

#### useBluetooth

Manages Bluetooth device communication:

```typescript
const { devices, connect, disconnect, read, write } = useBluetooth()
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing code conventions
- Use TypeScript with strict mode
- Write tests for new features
- Keep commits focused and atomic

### Reporting Issues

Please use the [GitHub Issues](https://github.com/Micronet-world/micronet/issues) page to report bugs or request features.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Individual packages have their own licenses:

| Package | License |
|---------|---------|
| kernel | AGPL-3.0 |
| sdk | MIT |
| apps | MIT |

## Acknowledgments

- [Vue.js](https://vuejs.org/) — The Progressive JavaScript Framework
- [Vite](https://vitejs.dev/) — Next Generation Frontend Tooling
- [TypeScript](https://www.typescriptlang.org/) — TypeScript is a typed superset of JavaScript
- [Vitest](https://vitest.dev/) — A blazing fast unit test framework powered by Vite

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Micronet-world">Micronet-world</a>
</p>
