import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: { cacheName: 'image-cache', expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 } }
    },
    {
      urlPattern: /^https?.*\.(js|css|woff2?)$/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-cache', expiration: { maxEntries: 200 } }
    },
    {
      urlPattern: /\/_next\/data\/.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'next-data-cache', networkTimeoutSeconds: 3 }
    },
    {
      urlPattern: /\/api\/.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 }
    }
  ]
})({});

export default nextConfig;
