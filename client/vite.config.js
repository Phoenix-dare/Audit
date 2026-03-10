import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "print-preview.html",
        "print-preview.css"
      ],
      manifest: {
        name: "Audit App",
        short_name: "Audit",
        start_url: "/",
        display: "standalone",
        background_color: "#f5f0e8",
        theme_color: "#2a3442",
        icons: []
      },
      workbox: {
        // Precache all generated build assets (js/css/html) + common static files
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,woff,ttf,otf,json}"],
        runtimeCaching: [
          {
            // Network-first for API calls so we can show cached data when offline.
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            method: "GET",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
});
