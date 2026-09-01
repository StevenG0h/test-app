import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optional: avoid CORS in development by proxying API calls to your real
  // endpoints. If you enable this, point VITE_REQUEST_TOKEN_URL,
  // VITE_VALIDATE_TOKEN_URL and VITE_INVALIDATE_TOKEN_URL at same-origin
  // paths (e.g. "/api/token/request") instead of absolute URLs.
  //
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:8787',
  //       changeOrigin: true,
  //     },
  //   },
  // },
})
