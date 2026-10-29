import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { handleScanReceipt, handleSpendingInsights } from './server/geminiHandler.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;

  const geminiDevServerPlugin = () => ({
    name: 'gemini-api-dev-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url, 'http://localhost');

        if (url.pathname === '/api/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'ok',
            app: 'AI EXPENSE TRACKING',
            hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY),
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
          }));
          return;
        }

        if (url.pathname === '/api/scan-receipt' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { base64Image, mimeType } = JSON.parse(body || '{}');
              if (!base64Image) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Missing base64Image in request body.' }));
                return;
              }
              const data = await handleScanReceipt(base64Image, mimeType);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data }));
            } catch (err: any) {
              res.statusCode = err.status || 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Failed to scan receipt' }));
            }
          });
          return;
        }

        if (url.pathname === '/api/spending-insights' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { transactions } = JSON.parse(body || '{}');
              const insights = await handleSpendingInsights(transactions);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, insights }));
            } catch (err: any) {
              res.statusCode = err.status || 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Failed to generate insights' }));
            }
          });
          return;
        }

        next();
      });
    }
  });

  return {
    server: {
      port: 3000,
      host: '127.0.0.1', // Loopback binding for security
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      react(),
      geminiDevServerPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'AI EXPENSE TRACKING',
          short_name: 'AI Expense',
          description: 'Smart personal expense tracking with AI receipt scanning, insights, and gamified budgeting',
          theme_color: '#0ea5e9',
          background_color: '#f9fafb',
          display: 'standalone',
          start_url: '/',
          orientation: 'portrait-primary',
          icons: [
            {
              src: '/web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
          categories: ['finance', 'productivity'],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\/.*/],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
