# Architecture

**English** | [日本語](architecture.ja.md)

Workrate is a macOS-first Tauri 2 application with a React/TypeScript frontend and a Rust backend.

## Design goals

1. Keep idle/background resource usage small.
2. Keep timer state recoverable after app termination or system restart.
3. Keep all user work data local.
4. Avoid infrastructure that is unnecessary for a single-user timer.

## Timer model

Each timer stores:

- `id`
- `name`
- `hourlyRateUsd`
- `accumulatedSeconds`
- `isRunning`
- `startedAt`

When stopped, elapsed time is `accumulatedSeconds`.

When running, elapsed time is derived as:

```text
accumulatedSeconds + (now - startedAt)
```

There is no backend interval that increments timer state once per second. This also means an active timer can recover naturally after Workrate has been closed or the Mac has been asleep.

Changing an hourly rate does not change elapsed time. Earnings are always derived from the timer's current hourly rate and current elapsed time.

## Frontend

The React frontend is responsible for presentation and derived display values. While the window is visible and focused, `useVisibleClock` updates a display timestamp once per second. The interval is removed when the window loses focus or becomes hidden.

The frontend never treats its one-second interval as authoritative timer state. It only triggers re-rendering; elapsed time is recalculated from persisted timer data.

## Rust backend

The backend owns persisted state mutations:

- create/update/delete timer
- start/stop timer
- reset timer
- exchange-rate refresh

`model.rs` contains state transitions that do not depend on Tauri and are unit tested separately.

## Persistence

State is stored as JSON in Tauri's application-data directory. Writes use a temporary file followed by rename so a partially written JSON file is not left behind during a normal interrupted write.

State is written on mutations, not every second.

## Exchange rate

Workrate requests the USD base-rate payload from ExchangeRate-API and reads the JPY rate. The rate is refreshed when the app starts if the saved rate is stale, and then once per hour.

A failed refresh does not erase the previous valid rate.

## Window and menu bar lifecycle

Closing the main macOS window hides it rather than terminating the process. The menu bar icon can show/focus the window again. Choosing **終了** from the menu bar menu terminates the app.

This allows active timers to remain conceptually running while Workrate is out of the way, without continuously updating timer state.

## Release packaging

Tauri produces a macOS DMG containing Workrate and an Applications-folder shortcut. GitHub Actions builds a universal macOS binary for tagged releases and attaches the DMG to the GitHub Release.
