# R3V4 Reverb Engine

**R3V4** is the flagship spatial processor of the R3 NATIVE ecosystem — a React + TypeScript audio plugin UI with an 8×8 Feedback Delay Network (FDN) reverb DSP core.

## Stack

- **Frontend**: React 18, TypeScript, Framer Motion, Zustand
- **Build tool**: Vite 5
- **DSP**: Custom FDN reverb engine (`src/dsp/`)

## Running the app

```bash
npm run dev
```

Served on port 5000. The workflow `Start application` runs this automatically.

## Build modes

| Command | Output |
|---|---|
| `npm run build:plugin` | Library build (`dist/plugin/`) for VST3/AU/AAX JUCE wrapper |
| `npm run build:standalone` | Standalone web app (`dist/standalone/`) |
| `npm run build:all` | Both of the above |

## Project structure

```
src/
  dsp/         — FDN reverb processor & DSP core
  ui/          — React plugin UI & components
  lib/         — Audio engine, presets, Zustand store
  types/       — Shared TypeScript types
docs/
  R3V4-Manual.md — Full parameter & architecture reference
```

## Notes

- `vitest` was removed from devDependencies (blocked by Replit security policy) — tests can be re-added via a compatible test runner if needed.
- Vite server configured for `host: 0.0.0.0`, `port: 5000`, `allowedHosts: true` for Replit preview compatibility.
