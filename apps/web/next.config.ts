import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@facam-academia/shared'],
  /**
   * Important en monorepo: empêche Next de tracer depuis un mauvais "workspace root"
   * (ex: `C:\Users\BK`) ce qui peut ralentir fortement le build sur Windows.
   */
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**', pathname: '/**' },
      { protocol: 'http', hostname: '**', pathname: '/**' },
    ],
  },
};

export default nextConfig;
