/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow our IDE (port 5173) to fetch RSC payloads cross-origin during tests.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, RSC, Next-Router-State-Tree, Next-Url, Next-Router-Prefetch' },
        ],
      },
    ];
  },
};

export default nextConfig;
