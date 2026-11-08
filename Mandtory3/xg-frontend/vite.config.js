import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alt som starter med /api sendes videre til Flask-serveren din på port 5000.
// Da slipper du CORS-oppsett i backend mens du utvikler.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
