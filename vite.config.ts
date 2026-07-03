import dotenv from 'dotenv';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import adminPromoterAccessHandler from './api/admin/promoter-access.js';
import adminUsersOverviewHandler from './api/admin/users-overview.js';
import billingCreateCheckoutSessionHandler from './api/billing/create-checkout-session.js';
import billingCreatePortalSessionHandler from './api/billing/create-portal-session.js';
import billingSubscriptionStatusHandler from './api/billing/subscription-status.js';
import stripeWebhookHandler from './api/stripe/webhook.js';
import { handleOpenMeteoProxy } from './server/open-meteo-proxy.js';
import { handleOpenWeatherProxy } from './server/openweather-proxy.js';

dotenv.config();

function augmentNodeResponse(res: any) {
  if (typeof res.status !== 'function') {
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }

  if (typeof res.json !== 'function') {
    res.json = (payload: unknown) => {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(payload));
      return res;
    };
  }

  if (typeof res.send !== 'function') {
    res.send = (payload: unknown) => {
      if (typeof payload === 'object' && payload !== null && !Buffer.isBuffer(payload)) {
        return res.json(payload);
      }

      res.end(payload);
      return res;
    };
  }

  return res;
}

function apiDevProxy() {
  const apiRoutes = new Map<string, (req: any, res: any) => Promise<void>>([
    ['/api/admin/promoter-access', adminPromoterAccessHandler],
    ['/api/admin/users-overview', adminUsersOverviewHandler],
    ['/api/billing/create-checkout-session', billingCreateCheckoutSessionHandler],
    ['/api/billing/create-portal-session', billingCreatePortalSessionHandler],
    ['/api/billing/subscription-status', billingSubscriptionStatusHandler],
    ['/api/stripe/webhook', stripeWebhookHandler],
  ]);

  return {
    name: 'api-dev-proxy',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const requestPath = req.url ? req.url.split('?')[0] : '';

        if (requestPath && apiRoutes.has(requestPath)) {
          augmentNodeResponse(res);
          await apiRoutes.get(requestPath)?.(req, res);
          return;
        }

        if (!req.url?.startsWith('/api/weather/open-meteo') && !req.url?.startsWith('/api/weather/openweather')) {
          next();
          return;
        }

        if ((req.method || 'GET').toUpperCase() !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Metodo nao permitido.' }));
          return;
        }

        const handler = req.url?.startsWith('/api/weather/open-meteo')
          ? handleOpenMeteoProxy
          : handleOpenWeatherProxy;
        const { status, payload } = await handler(`http://localhost${req.url}`);
        res.statusCode = status;
        res.setHeader('Cache-Control', 'private, max-age=0');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(payload));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      apiDevProxy(),
      VitePWA({
        registerType: 'prompt',
        useCredentials: true,
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png', 'hero_background.png'],
        manifest: {
          name: 'Granja de Bolso',
          short_name: 'GranjaBolso',
          description: 'Gestão Inteligente para Granja Caipira',
          theme_color: '#0F172A',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          icons: [
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          maximumFileSizeToCacheInBytes: 5000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://*.supabase.co https://coresg-normal.trae.ai; connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.bigdatacloud.net https://generativelanguage.googleapis.com; frame-ancestors 'self'",
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()'
      }
    },
    preview: {
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://*.supabase.co https://coresg-normal.trae.ai; connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.bigdatacloud.net https://generativelanguage.googleapis.com; frame-ancestors 'self'",
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()'
      }
    }
  };
});
