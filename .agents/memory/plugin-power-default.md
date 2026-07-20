---
name: Plugin power default
description: isProcessing now intentionally defaults to false; the dimmed UI on load is the correct powered-off state.
---

# Plugin power default

## Rule
`isProcessing` in `src/lib/store.ts` must be initialized to `false`.

**Why:** The plugin's root div uses `opacity: store.isProcessing ? 1 : 0.42`. Since audio requires an explicit user gesture to start (browser autoplay policy), `false` is the accurate default — the UI starts dimmed with a prominent "Click anywhere to enable audio" banner. When the user enables audio, `isProcessing` is set to `true` via `store.setProcessing(true)` in `R3V4Plugin.tsx`, bringing the UI to full brightness. Setting `true` as default would show a fully-bright, apparently-active UI while audio is actually silent.

**How to apply:** Do not change this back to `true`. The dimmed state on load is intentional UX that matches the actual audio engine state. The unlock banner (`needsFirstGesture` state in `R3V4Plugin.tsx`) handles guiding the user.
