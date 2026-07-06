# CI/CD Configuration

This document explains the CI/CD workflow configuration for the Micronet monorepo and sub-repositories.

## Overview

The CI/CD setup enables:

1. **Automated Testing** — Run tests on every PR and push to main
2. **Bidirectional Sync** — Changes flow from monorepo to sub-repos and vice versa
3. **Automated Publishing** — Packages are published to npm when changed

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Main Repository                             │
│                       (Micronet-world/micronet)                     │
├─────────────────────────────────────────────────────────────────────┤
│  PR Workflow (pr.yml)                                               │
│  └── Runs tests on pull requests                                    │
│                                                                     │
│  Deploy Workflow (deploy.yml)                                       │
│  └── On push to main:                                               │
│      ├── Detects changed packages                                   │
│      ├── Runs tests                                                 │
│      ├── Syncs to sub-repos                                         │
│      └── Publishes to npm                                           │
│                                                                     │
│  Sync Inbound (sync-inbound.yml)                                    │
│  └── Receives sync triggers from sub-repos                          │
├─────────────────────────────────────────────────────────────────────┤
│                          Sub-repos                                  │
│  kernel/ sdk/ apps/                                                 │
│  └── On push to main:                                               │
│      └── Triggers monorepo sync via repository_dispatch             │
└─────────────────────────────────────────────────────────────────────┘
```

## Required Secrets

### Main Repository Secrets

| Secret | Description | How to Obtain |
|--------|-------------|---------------|
| `SUBREPO_TOKEN` | GitHub PAT with `repo` scope for syncing to sub-repos | [Create PAT](https://github.com/settings/tokens) |
| `NPM_TOKEN` | npm publish token for package publishing | [npm tokens](https://www.npmjs.com/settings/tokens) |

### Sub-repo Secrets

| Secret | Description | How to Obtain |
|--------|-------------|---------------|
| `SYNC_TOKEN` | GitHub PAT with `repo` scope for triggering monorepo sync | [Create PAT](https://github.com/settings/tokens) |

## Setting Up Secrets

### 1. Create GitHub PAT (Personal Access Token)

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
4. Copy the generated token

### 2. Add Secrets to Repositories

**Main Repository (micronet):**
```bash
gh secret set SUBREPO_TOKEN --body "your-github-pat"
gh secret set NPM_TOKEN --body "your-npm-token"
```

**Sub-repos (kernel, sdk, apps):**
```bash
# For each sub-repo
gh secret set SYNC_TOKEN --body "your-github-pat" --repo Micronet-world/kernel
gh secret set SYNC_TOKEN --body "your-github-pat" --repo Micronet-world/sdk
gh secret set SYNC_TOKEN --body "your-github-pat" --repo Micronet-world/apps
```

## Workflow Details

### PR Workflow (`pr.yml`)

**Trigger:** Pull requests to main

**Jobs:**
1. **detect-changes** — Identifies which packages changed
2. **test** — Runs tests on Node.js 18.x, 20.x, 22.x
3. **build** — Builds the project and uploads artifacts

### Deploy Workflow (`deploy.yml`)

**Trigger:** Push to main

**Jobs:**
1. **detect-changes** — Identifies which packages changed
2. **test** — Runs tests
3. **sync-kernel/sdk/apps** — Syncs changed packages to sub-repos
4. **publish-kernel/sdk/apps** — Publishes changed packages to npm
5. **notify** — Creates summary of sync operations

### Sync Inbound (`sync-inbound.yml`)

**Trigger:** Repository dispatch events from sub-repos

**Jobs:**
- Syncs changes from sub-repos back to the monorepo

## How Sync Works

### Monorepo → Sub-repo

1. Changes are pushed to main in the monorepo
2. `deploy.yml` detects which packages changed
3. For each changed package, `git subtree split` extracts the package history
4. The extracted history is pushed to the corresponding sub-repo

### Sub-repo → Monorepo

1. Changes are pushed to main in a sub-repo
2. Sub-repo's `notify.yml` triggers a `repository_dispatch` event
3. Main repo's `sync-inbound.yml` receives the event
4. `git subtree pull` merges the sub-repo changes into the monorepo

## Manual Sync

### Sync from monorepo to sub-repo

```bash
# Sync kernel
git subtree split --prefix=kernel --branch=kernel-temp
git push kernel kernel-temp:main

# Sync sdk
git subtree split --prefix=sdk --branch=sdk-temp
git push sdk sdk-temp:main

# Sync apps
git subtree split --prefix=apps --branch=apps-temp
git push apps apps-temp:main
```

### Sync from sub-repo to monorepo

```bash
# Sync kernel
git subtree pull --prefix=kernel kernel main --allow-unrelated-histories

# Sync sdk
git subtree pull --prefix=sdk sdk main --allow-unrelated-histories

# Sync apps
git subtree pull --prefix=apps apps main --allow-unrelated-histories
```

## Troubleshooting

### Sync fails with "non-fast-forward"

This happens when the sub-repo has diverged from the monorepo. Force push:

```bash
git subtree split --prefix=kernel --branch=kernel-temp
git push kernel kernel-temp:main --force
```

### Package publish fails

1. Check if `NPM_TOKEN` is valid
2. Ensure package version hasn't been published
3. Check npm logs: `npm publish --dry-run`

### Repository dispatch not triggering

1. Verify `SYNC_TOKEN` has `repo` scope
2. Check if the workflow file is in the correct location
3. Verify the event type matches

## Monitoring

### GitHub Actions

Monitor workflow runs in the Actions tab:
- [Main repo actions](https://github.com/Micronet-world/micronet/actions)
- [Kernel actions](https://github.com/Micronet-world/kernel/actions)
- [SDK actions](https://github.com/Micronet-world/sdk/actions)
- [Apps actions](https://github.com/Micronet-world/apps/actions)

### npm Packages

Monitor published packages:
- [micronet-kernel](https://www.npmjs.com/package/micronet-kernel)
- [micronet-sdk](https://www.npmjs.com/package/micronet-sdk)
- [micronet-apps](https://www.npmjs.com/package/micronet-apps)

## Best Practices

1. **Always test locally** before pushing to main
2. **Use feature branches** for development
3. **Keep packages independent** — avoid cross-package dependencies
4. **Version packages independently** — use semantic versioning
5. **Document breaking changes** — update CHANGELOG.md
