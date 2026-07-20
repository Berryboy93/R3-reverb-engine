---
name: Vite HMR on Replit
description: How to configure Vite HMR so it connects through Replit's proxy, and where the post-merge script lives.
---

# Vite HMR on Replit

## Rule
Add `hmr: { clientPort: 443 }` inside the `server` block in `vite.config.ts`.

**Why:** Replit proxies the preview through its own domain on port 443 (WSS). Without this, Vite's HMR client tries to open a WebSocket to localhost:80 and fails. The screenshot/internal tool accesses via `127.0.0.1:5000` and will still show a WS error — that is expected and not a real user-facing problem.

**How to apply:** Any time Vite is added or reconfigured in this project. The full working block is:
```js
server: {
  host: '0.0.0.0',
  port: 5000,
  allowedHosts: true,
  hmr: { clientPort: 443 },
}
```

## Post-merge script
Located at `scripts/post-merge.sh`. Runs `npm install --legacy-peer-deps` then `npm run build:processor`. Registered in `.replit` with a 120s timeout.
