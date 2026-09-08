import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
const apiOrigin = getApiOrigin(process.env.NEXT_PUBLIC_API_URL);

const globalSecurityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: buildContentSecurityPolicy(),
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Permissions-Policy',
    value: ['camera=()', 'geolocation=()', 'microphone=()', 'payment=()', 'usb=()'].join(', '),
  },
  ...(isProduction
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    return [
      {
        headers: globalSecurityHeaders,
        source: '/:path*',
      },
      {
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
        ],
        source: '/login',
      },
    ];
  },
};

export default nextConfig;

function buildContentSecurityPolicy(): string {
  const connectSources = [
    "'self'",
    apiOrigin,
    ...(isProduction ? [] : ['http://localhost:*', 'https://localhost:*', 'ws:', 'wss:']),
  ].filter(Boolean);

  const directives = [
    ['default-src', "'self'"],
    ['base-uri', "'self'"],
    ['connect-src', ...connectSources],
    ['font-src', "'self'", 'data:'],
    ['form-action', "'self'"],
    ['frame-ancestors', "'none'"],
    ['img-src', "'self'", 'data:', 'blob:', 'https:', 'http:'],
    ['object-src', "'none'"],
    ['script-src', "'self'", "'unsafe-inline'", ...(isProduction ? [] : ["'unsafe-eval'"])],
    ['style-src', "'self'", "'unsafe-inline'"],
  ];

  return directives.map((directive) => directive.join(' ')).join('; ');
}

function getApiOrigin(apiUrl?: string): string | undefined {
  if (!apiUrl) {
    return undefined;
  }

  try {
    return new URL(apiUrl).origin;
  } catch {
    return undefined;
  }
}
