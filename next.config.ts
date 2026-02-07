import type { NextConfig } from "next";

/**
 * Headers de securite pour l'application
 * @security Protection contre diverses attaques web
 */
const securityHeaders = [
  // Prefetch DNS pour ameliorer les performances
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // Force HTTPS pendant 2 ans + preload
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Empeche le clickjacking en interdisant l'affichage dans des iframes
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Empeche le sniffing MIME (protection XSS)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Controle les informations envoyees dans le header Referer
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Content Security Policy - Protection XSS et injection
  // Note: 'unsafe-inline' et 'unsafe-eval' necessaires pour Next.js dev mode
  // A restreindre davantage en production si possible
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Autoriser le CDN Workbox pour le Service Worker
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://storage.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      // Permettre au Service Worker de charger Workbox
      "worker-src 'self' blob:",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // Controle les fonctionnalites du navigateur
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()", // Desactive FLoC
    ].join(", "),
  },
  // Protection XSS supplementaire (deprecie mais encore utile pour vieux navigateurs)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig: NextConfig = {
  // Routes typees desactivees (certaines routes dynamiques ne sont pas compatibles)
  // typedRoutes: true,

  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Configuration pour la production
  reactStrictMode: true,

  // Timezone pour les dates (Gabon)
  env: {
    TZ: "Africa/Libreville",
  },

  // Headers de securite appliques a toutes les routes
  async headers() {
    const headers = [
      {
        // Appliquer les headers de sécurité à toutes les routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];

    // En développement, désactiver le cache pour éviter les problèmes de Server Actions
    if (process.env.NODE_ENV === "development") {
      headers.push({
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      });
    }

    return headers;
  },

  // Redirections de securite (désactivé temporairement pour debug)
  // async redirects() {
  //   return [
  //     // Forcer la suppression du trailing slash pour coherence
  //     {
  //       source: "/:path*(/)",
  //       destination: "/:path*",
  //       permanent: true,
  //     },
  //   ];
  // },

  // Configuration experimentale
  experimental: {
    // Optimisation des Server Actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
