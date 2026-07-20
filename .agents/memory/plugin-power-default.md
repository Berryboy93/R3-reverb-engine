---
name: Plugin power default
description: The Zustand store must default isProcessing to true or the UI renders nearly invisible.
---

# Plugin power default

## Rule
`isProcessing` in `src/lib/store.ts` must be initialized to `true`.

**Why:** `R3V4Plugin.tsx` applies `opacity: 0.42` to the entire root div when `isProcessing` is false. A `false` default means first-time visitors see a nearly blank page with no obvious way to fix it.

**How to apply:** Any time the store is reset, refactored, or re-created — confirm `isProcessing: true` is in the initial state object.
