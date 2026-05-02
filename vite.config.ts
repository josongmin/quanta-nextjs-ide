import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/__rsc': {
        target: process.env.VITE_NEXT_DEV_URL ?? 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/__rsc/, ''),
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      external: [
        '@tauri-apps/plugin-fs',
        '@tauri-apps/plugin-shell',
        '@tauri-apps/plugin-dialog',
      ],
      output: {
        manualChunks(id) {
          if (id.includes('monaco-editor')) return 'monaco';
          if (id.includes('@monaco-editor/react')) return 'monaco';
          if (id.includes('node_modules/@radix-ui/')) return 'radix';
          if (id.includes('node_modules/lucide-react/')) return 'icons';
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) return 'react-vendor';
          if (id.includes('node_modules/zod/')) return 'zod';
          if (id.includes('node_modules/zustand/')) return 'zustand';
          if (id.includes('node_modules/@floating-ui/')) return 'floating';
          if (id.includes('node_modules/cmdk/')) return 'cmdk';
          if (id.includes('node_modules/sonner/')) return 'sonner';
          if (id.includes('node_modules/ts-pattern/')) return 'ts-pattern';
          if (
            id.includes('node_modules/ts-morph/') ||
            id.includes('node_modules/@ts-morph/')
          )
            return 'ts-morph';
          if (id.includes('node_modules/@tanstack/')) return 'tanstack';
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    // We use only the core editor + a TypeScript syntax highlighter.
    // Pre-bundle just the editor entry; language workers/contributions are
    // stubbed out by `@shared/monaco/lightweight-setup`.
    include: ['monaco-editor/esm/vs/editor/editor.api'],
    exclude: [
      'monaco-editor/esm/vs/language/typescript/ts.worker',
      'monaco-editor/esm/vs/language/json/json.worker',
      'monaco-editor/esm/vs/language/css/css.worker',
      'monaco-editor/esm/vs/language/html/html.worker',
    ],
  },
});
