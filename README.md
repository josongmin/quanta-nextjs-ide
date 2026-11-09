# Quanta Next.js IDE

An IDE interface for exploring Next.js development workflows and diagnostics. The application shell itself uses Vite, React, and TypeScript; Next.js execution and inspection are separate integration paths.

## What it does

- Inspect project, file, and diagnostic information through feature-oriented screens.
- Explore developer tools including secret-scanner and webhook-testing interfaces.
- Develop components with Storybook and browser workflows with Playwright.
- Use the optional Tauri shell and the VS Code extension package.

## Repository map

| Path | Responsibility |
| --- | --- |
| [src/app](src/app) | Application composition. |
| [src/pages](src/pages) | Screen-level entry points. |
| [src/features](src/features) | Diagnostics and developer tools. |
| [src/entities](src/entities) | Domain models. |
| [src/shared](src/shared) | Shared UI, types, and demonstration data. |
| [packages/vscode-extension](packages/vscode-extension) | Editor integration. |
| [docs](docs) | Catalog and architecture review material. |

## Run locally

Use Node.js. Run these commands from the repository root.

```sh
npm ci
npm run dev
```

## Development checks

```sh
npm run typecheck
npm run lint
npm run build
```

```sh
npm run storybook
npm run test:e2e
npm run test:e2e:real
npm run tauri:dev
```

Playwright requires its browser environment. Desktop development additionally requires Rust and platform-specific dependencies.

## Scope and status

Mock findings, masked credentials, and sample diagnostics support UI development. They must be distinguished from results obtained from a real project. `test:e2e:real` selects the actual Next.js integration path; a regular UI build does not verify that path.

## Documentation

- [Feature catalog](docs/CATALOG.md)
- [Domain architecture](docs/AUDIT-DOMAIN.md)
- [Layer review](docs/AUDIT-FSD.md)
- [Script reference](package.json)
