# Contributing

**English** | [日本語](CONTRIBUTING.ja.md)

Contributions are welcome.

## Local development

```bash
npm install
npm run dev:app
```

Before opening a pull request, run:

```bash
npm run check
```

Please keep Workrate focused. Features that turn it into project management, employee monitoring, task management, or productivity analytics are outside the current scope.

## Code organization

- Keep timer state transitions in the Rust model when they affect persisted state.
- Keep display-only calculations in `src/lib/`.
- Avoid background polling when a value can be derived from timestamps.
- Prefer small focused components over adding more responsibilities to `App.tsx`.

## Releases

Release builds are created by pushing a version tag such as `v0.1.0`. The GitHub Actions release workflow builds the macOS DMG and publishes it to GitHub Releases.
