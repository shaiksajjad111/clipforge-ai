
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/clipforge-ai/',

  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core']
  },

  worker: {
    format: 'es'
  }
});
