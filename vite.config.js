import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // @base44/vite-plugin previously injected this alias automatically.
    // Now that it's removed, it must be declared explicitly.
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
