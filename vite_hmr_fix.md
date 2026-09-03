// Fix for Vite HMR WebSocket connection error
// Replace the hmr.clientPort: 443 line with one of these options:

// Option A: Let Vite auto-detect (recommended for local dev)
export default defineConfig({
  server: {
    port: 5000,
    // hmr: { clientPort: 443 },  // REMOVE THIS LINE
  }
});

// Option B: If you need HMR on a specific port behind a proxy
export default defineConfig({
  server: {
    port: 5000,
    hmr: {
      // Only set clientPort if you have a reverse proxy (nginx, etc.)
      // pointing ws://localhost:443 → ws://localhost:5000
      // For local dev, leave this out entirely
      protocol: 'ws',
      host: 'localhost',
      port: 5000,
      clientPort: 5000,  // Match the server port
    }
  }
});
