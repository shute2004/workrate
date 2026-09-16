# Workrate

**English** | [日本語](README.ja.md)

Workrate is a lightweight macOS timer for hourly work. It keeps multiple timers independent, calculates earnings in real time, and converts USD earnings to JPY using the current exchange rate.

The app is intentionally small: no accounts, cloud sync, project management, screenshots, productivity scoring, or activity monitoring.

## Features

- Multiple independent timers can run at the same time
- Start, stop, resume, and reset each timer
- Custom name and USD hourly rate per timer
- Live `HH:MM:SS` elapsed time
- Live USD earnings and JPY conversion
- USD/JPY refresh at startup and every hour
- Local persistence across app restarts and Mac restarts
- Running timers recover elapsed wall-clock time after the app has been closed
- macOS menu bar icon for reopening the window
- Local-first: timer data stays on the Mac
- Low-background-work design: no per-timer backend tick loop

The current UI is Japanese-first.

## Install

1. Open the [GitHub Releases](https://github.com/shute2004/workrate/releases) page.
2. Download the latest `.dmg`.
3. Open the DMG and drag **Workrate** into **Applications**.
4. Launch Workrate from Applications.

### Gatekeeper

The current OSS build is not Apple-notarized. If macOS blocks the downloaded app, open **System Settings → Privacy & Security** and allow Workrate to open.

## How it works

A running timer stores only its accumulated seconds and the timestamp at which the current run started. Workrate derives elapsed time from those values instead of running a backend timer every second.

The frontend updates the visible clock once per second only while the window is visible and focused. When Workrate is in the background, that display loop stops; the correct value is recalculated immediately when the window becomes active again.

Timer state is saved locally after state-changing operations. Exchange-rate retrieval uses the public USD endpoint from [ExchangeRate-API](https://www.exchangerate-api.com/). If a refresh fails, Workrate continues using the most recently saved rate.

## Development

### Requirements

- macOS 12 or later
- Node.js
- Rust toolchain
- Tauri 2 build prerequisites

### Run

```bash
npm install
npm run dev:app
```

### Check

```bash
npm run check
```

This runs the frontend linter/build and Rust formatting/tests.

### Build a DMG

```bash
npm run build:app
```

The DMG is written under `src-tauri/target/release/bundle/dmg/`.

## Project structure

```text
src/
  components/      React UI components
  hooks/           UI lifecycle hooks
  lib/             timer/formatting domain helpers
  backend.ts       Tauri bridge + browser development mock

src-tauri/src/
  commands.rs      Tauri commands
  exchange.rs      USD/JPY retrieval and hourly refresh
  model.rs         app state and timer state transitions
  storage.rs       local JSON persistence
  tray.rs          macOS menu bar integration
  lib.rs           application wiring
```

More implementation notes are in [`docs/architecture.md`](docs/architecture.md). A Japanese version is available at [`docs/architecture.ja.md`](docs/architecture.ja.md).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). A Japanese version is available at [`CONTRIBUTING.ja.md`](CONTRIBUTING.ja.md).

## Privacy

Workrate has no login and does not send timer names, hourly rates, elapsed time, or earnings to a Workrate server. Network access is used only to retrieve the USD/JPY exchange rate.

## License

MIT
