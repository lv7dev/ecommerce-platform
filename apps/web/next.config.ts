import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    return [
      {
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
        ],
        source: '/verify-email',
      },
      {
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
        ],
        source: '/reset-password',
      },
    ];
  },
};

export default nextConfig;
