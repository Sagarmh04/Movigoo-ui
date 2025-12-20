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
};

export default nextConfig;

