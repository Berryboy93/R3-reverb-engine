---
name: TS config stale references
description: After removing vitest, tsconfig.json had stale references that caused tsc --noEmit to fail.
---

# TS config stale references

After removing `vitest` from `devDependencies`, `tsconfig.json` still contained two stale references that caused `tsc --noEmit` to fail:

1. `"types": ["vite/client", "vitest/globals"]` — the `vitest/globals` type definition was gone.
2. `"lib": ["ES2020", "DOM", "DOM.Iterable", "WebAudio"]` — `WebAudio` is not a valid TypeScript `lib` value; Web Audio API types are included in `DOM`/`DOM.Iterable`.

**Why:** Removing vitest without cleaning up its compiler references left the project in a non-compiling state.

**How to apply:** When swapping or removing test runners, audit `tsconfig.json` for `types` and `lib` entries that reference the removed tool. The valid configuration that resulted was `"types": ["vite/client"]` and `"lib": ["ES2020", "DOM", "DOM.Iterable"]`.
