/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  // NOTE: No CSP headers configured - allows Cashfree SDK to load
  // If you need to add CSP later, ensure it includes:
  // "script-src 'self' https://sdk.cashfree.com 'unsafe-inline';"
  webpack: (config, { isServer }) => {
    // Exclude firebase-admin from client-side bundling
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "firebase-admin/app": false,
        "firebase-admin/firestore": false,
        "firebase-admin": false,
      };
    }
    return config;
  },
};

export default nextConfig;

