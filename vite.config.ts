import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  root: '.', // Important: specify root directory
  publicDir: false, // We'll handle static files ourselves
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
