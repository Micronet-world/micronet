# Contributing to Micronet

Thank you for your interest in contributing to Micronet! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [License](#license)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** >= 2.0.0

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/<your-username>/micronet.git
cd micronet
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Run the tests to ensure everything is working:

```bash
npm run test
```

## Development Workflow

### Branch Naming

Use descriptive branch names that follow this pattern:

- `feature/description` — for new features
- `fix/description` — for bug fixes
- `docs/description` — for documentation changes
- `refactor/description` — for code refactoring
- `test/description` — for adding or updating tests

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation
- `style` — formatting, missing semicolons, etc.
- `refactor` — code refactoring
- `test` — adding or updating tests
- `chore` — maintenance tasks

Examples:
```
feat(kernel): add new navigation intent type
fix(gestures): resolve swipe threshold calculation
docs(readme): update installation instructions
test(lockscreen): add unlock gesture test
```

### Working with Packages

The project is a monorepo with three packages:

- `kernel/` — Core runtime
- `sdk/` — Development tools
- `apps/` — Built-in screens

When making changes to a package:

1. Make changes in the appropriate package directory
2. Run tests for that package: `npx vitest run kernel/src/`
3. Update type definitions if needed
4. Update documentation if needed

## Code Style

### TypeScript

- Use strict TypeScript with all strict options enabled
- Avoid using `any` type — use `unknown` if the type is truly unknown
- Use explicit return types for public APIs
- Use `import type` for type-only imports in `vite.config.ts` and `vitest.config.ts`

### Vue Components

- Use `<script setup>` syntax for all components
- Use Composition API over Options API
- Keep components focused and single-purpose
- Use props validation with TypeScript interfaces

### Naming Conventions

- **Files**: PascalCase for components (`LockScreen.vue`), camelCase for utilities (`useSwipeGestures.ts`)
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **CSS Classes**: kebab-case

### Imports

```typescript
// Types first
import type { ScreenMeta, NavIntent } from '@micronet/kernel'

// Then values
import { useNavigation, registerScreen } from '@micronet/kernel'

// Vue imports
import { ref, computed } from 'vue'
import type { Component } from 'vue'
```

## Testing

### Writing Tests

Tests are written with [Vitest](https://vitest.dev/) and [Vue Test Utils](https://test-utils.vuejs.org/).

#### Unit Tests

Place unit tests in `__tests__/` directories beside the code:

```
src/
  components/
    LockScreen.vue
    __tests__/
      LockScreen.spec.ts
```

#### Test Patterns

For screen components, use the `onNav` middleware to capture navigation requests:

```typescript
import { onNav, resetBus } from '@micronet/kernel'
import { mount } from '@vue/test-utils'
import LockScreen from '../LockScreen.vue'

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

For integration tests, mount the full `App` and drive gestures:

```typescript
import { mount } from '@vue/test-utils'
import App from '../App.vue'

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

### Running Tests

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

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `npm run test`
2. Run type checking: `npm run build`
3. Update documentation if needed
4. Add tests for new features
5. Ensure your code follows the style guidelines

### PR Template

```markdown
## Description

Brief description of the changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Test addition/update

## Testing

Describe the tests you ran to verify your changes.

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] I have updated the documentation accordingly
- [ ] I have added appropriate labels to this PR
```

### Review Process

1. All PRs require at least one review
2. CI must pass (tests, type checking)
3. Code must follow style guidelines
4. Documentation must be updated if needed

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Numbered steps to reproduce the behavior
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: 
   - OS and version
   - Node.js version
   - npm version
   - Browser (if applicable)
6. **Screenshots**: If applicable
7. **Additional Context**: Any other relevant information

### Feature Requests

When requesting features, please include:

1. **Description**: Clear description of the feature
2. **Use Case**: Why this feature would be useful
3. **Proposed Solution**: Your proposed implementation (if any)
4. **Alternatives**: Any alternative solutions you've considered

## License

By contributing to Micronet, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

## Questions?

If you have questions about contributing, please:

1. Check the [documentation](README.md)
2. Search [existing issues](https://github.com/Micronet-world/micronet/issues)
3. Create a new issue if needed

Thank you for contributing to Micronet!
