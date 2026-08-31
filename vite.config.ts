import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optional: avoid CORS in development by proxying API calls to your real
  // endpoints. If you enable this, point VITE_VALIDATE_URL and
  // VITE_REVOKE_URL at same-origin paths (e.g. "/api/session/validate")
  // instead of absolute URLs.
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
