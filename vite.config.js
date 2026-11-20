import { defineConfig } from 'vite';

// ffmpeg.wasm starts its own Web Worker from inside the @ffmpeg/ffmpeg package.
// Vite must NOT pre-bundle these packages, otherwise the worker file cannot be
// found in `npm run dev` and FFmpeg never loads. (Official ffmpeg.wasm + Vite setup.)
export default defineConfig({
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core']
  },
  worker: {
    format: 'es'
  }
});
