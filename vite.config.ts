import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isPlugin = mode === 'plugin';
  const isStandalone = mode === 'standalone';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@dsp': resolve(__dirname, 'src/dsp'),
        '@ui': resolve(__dirname, 'src/ui'),
        '@types': resolve(__dirname, 'src/types'),
        '@lib': resolve(__dirname, 'src/lib'),
        '@assets': resolve(__dirname, 'src/assets'),
      },
    },
    build: {
      outDir: isPlugin ? 'dist/plugin' : isStandalone ? 'dist/standalone' : 'dist',
      lib: isPlugin ? {
        entry: resolve(__dirname, 'src/plugin-entry.ts'),
        name: 'R3V4ReverbEngine',
        fileName: 'r3v4-reverb',
        formats: ['es', 'umd'],
      } : undefined,
      rollupOptions: isStandalone ? {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      } : undefined,
      sourcemap: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    define: {
      __R3V4_VERSION__: JSON.stringify('1.0.0'),
      __R3V4_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
    optimizeDeps: {
      exclude: ['@dsp/*'],
    },
  };
});
