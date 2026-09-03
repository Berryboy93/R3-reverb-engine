# Fix App to Load and Run Correctly

## What & Why
The app has three bugs stopping it from working properly:

1. **Vite HMR WebSocket fails** — Replit proxies the preview through HTTPS/WSS on port 443, but Vite tries to open a WebSocket on port 80. This makes the browser console throw an error and prevents hot-reload. Fix by adding `server.hmr: { clientPort: 443 }` to `vite.config.ts`.

2. **TypeScript compile errors** — `Knob.tsx` declares two constants (`CHROME_MID`, `CHROME_LO`) that are never used. Because `tsconfig.json` has `noUnusedLocals: true`, this causes `tsc` to error. Remove the two unused constants.

3. **Plugin invisible at startup** — The root div has `opacity: 0.42` until the user clicks the Power button. First-time visitors see a nearly invisible interface. Change the default power state to `true` (powered on) in the store so the plugin renders fully visible on load.

## Done looks like
- Browser console has no WebSocket or TypeScript errors
- `npx tsc --noEmit` exits with code 0
- Visiting the preview shows the full R3V4 plugin at full opacity without needing to click anything
- Hot-reload still connects (no WS error in console)

## Out of scope
- Audio wiring changes
- Visual redesign
- New features

## Steps
1. **Fix Vite HMR config** — Add `hmr: { clientPort: 443 }` inside the existing `server` block in `vite.config.ts`.
2. **Remove unused TS constants** — Delete the `CHROME_MID` and `CHROME_LO` constant declarations from `Knob.tsx`; verify `tsc --noEmit` is clean.
3. **Default power on** — In `src/lib/store.ts`, set the initial `isProcessing` value to `true` so the plugin shows at full opacity when first loaded.
4. **Restart and verify** — Restart the workflow, take a screenshot confirming the plugin renders fully and the browser console is clean.

## Relevant files
- `vite.config.ts`
- `src/ui/components/Knob.tsx:1-10`
- `src/lib/store.ts`
