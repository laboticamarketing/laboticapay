import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const appName = 'La Botica — Farmapay';
  const appShortName = 'La Botica Pay';
  const appDescription = 'Sistema de pagamentos La Botica (Farmapay)';

  return {
    server: {
      port: 5174,
      host: '0.0.0.0',
    },
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'logo-checkout.png', 'favicon.svg'],
        manifest: {
          name: appName,
          short_name: appShortName,
          description: appDescription,
          theme_color: '#6b2139',
          background_color: '#fdf7f5',
          display: 'standalone',
          orientation: 'portrait',
          // Focado no uso diário do atendente (painel admin)
          start_url: '/admin',
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
