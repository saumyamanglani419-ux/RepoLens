import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // In development the React app calls /api on its own origin; Vite forwards it to Express.
      // This keeps the auth cookie first-party and avoids CORS entirely.
      proxy: {
        '/api': { target: env.VITE_DEV_API_PROXY || 'http://localhost:5000', changeOrigin: true },
      },
    },
  };
});
