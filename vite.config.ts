import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Reads APP_VERSION directly from the single source of truth (src/config/appVersion.ts)
 * so version numbers are never duplicated across build configs.
 */
function readSingleAppVersion(): string {
  const versionFile = path.resolve(__dirname, 'src/config/appVersion.ts');
  const source = fs.readFileSync(versionFile, 'utf8');
  const match = source.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!match || !match[1]) {
    throw new Error('APP_VERSION constant not found in src/config/appVersion.ts');
  }
  return match[1].trim().replace(/^v/i, '');
}

function syncVersionArtifactsPlugin(appVersion: string): Plugin {
  const syncPublicFiles = () => {
    const versionJsonPath = path.resolve(__dirname, 'public/version.json');
    const expectedJson = `${JSON.stringify({ version: appVersion }, null, 2)}\n`;
    if (
      !fs.existsSync(versionJsonPath) ||
      fs.readFileSync(versionJsonPath, 'utf8') !== expectedJson
    ) {
      fs.writeFileSync(versionJsonPath, expectedJson, 'utf8');
    }

    const swVersionPath = path.resolve(__dirname, 'public/sw-version.js');
    const expectedSwVersion = `self.__RIHLAT_APP_VERSION__ = ${JSON.stringify(appVersion)};\n`;
    if (
      !fs.existsSync(swVersionPath) ||
      fs.readFileSync(swVersionPath, 'utf8') !== expectedSwVersion
    ) {
      fs.writeFileSync(swVersionPath, expectedSwVersion, 'utf8');
    }
  };

  const applyNoCacheHeaders = (
    reqUrl: string | undefined,
    res: { setHeader: (name: string, value: string) => void }
  ) => {
    const cleanUrl = (reqUrl || '').split('?')[0];
    if (
      cleanUrl === '/' ||
      cleanUrl === '/index.html' ||
      cleanUrl === '/version.json' ||
      cleanUrl === '/sw.js' ||
      cleanUrl === '/sw-version.js'
    ) {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  };

  return {
    name: 'rihlat-version-sync',
    buildStart() {
      syncPublicFiles();
    },
    configureServer(server) {
      syncPublicFiles();
      server.middlewares.use((req, res, next) => {
        applyNoCacheHeaders(req.url, res);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        applyNoCacheHeaders(req.url, res);
        next();
      });
    },
  };
}

export default defineConfig(() => {
  const appVersion = readSingleAppVersion();
  const cacheId = `rihlat-alnoor-v${appVersion}`;

  return {
    plugins: [
      syncVersionArtifactsPlugin(appVersion),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'sw-version.js',
          'sw-cache-cleanup.js',
        ],
        manifest: {
          id: '/',
          name: 'رحلة النور',
          short_name: 'رحلة النور',
          description:
            'منصة تربوية ومعنوية تجمع بين رحلة 100 محطة ورياض الأدعية والزيارات والمناجاة والمسبحة النورانية',
          theme_color: '#0F3D2E',
          background_color: '#0F3D2E',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cacheId,
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          importScripts: ['/sw-version.js', '/sw-cache-cleanup.js'],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          // Keep static bundles, icons, images, and fonts cached; never long-term precache index.html or version.json
          globPatterns: ['**/*.{js,css,ico,png,svg,jpg,jpeg,woff,woff2}'],
          globIgnores: [
            '**/index.html',
            '**/version.json',
            '**/sw-version.js',
            '**/sw-cache-cleanup.js',
            '**/*.map',
          ],
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: /\/version\.json(\?.*)?$/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/raw\.githubusercontent\.com\/jafarmahmd\/rihlat-alnoor\/.*\/version\.json/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/api\.github\.com\/repos\/jafarmahmd\/rihlat-alnoor\/releases\/latest/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ request, url }) =>
                request.mode === 'navigate' ||
                url.pathname === '/' ||
                url.pathname.endsWith('/index.html'),
              handler: 'NetworkFirst',
              options: {
                cacheName: `${cacheId}-html`,
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 2,
                  maxAgeSeconds: 60,
                },
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/api\.alquran\.cloud\/v1\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'quran-surahs-api-cache',
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
