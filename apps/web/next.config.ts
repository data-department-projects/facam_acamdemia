import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@facam-academia/shared'],
  /**
   * Évite les erreurs runtime du type
   * `Cannot find module './vendor-chunks/tailwind-merge.js'` en dev (Webpack) lorsque
   * le cache `.next` est partiellement invalide : ces paquets sont résolus depuis
   * `node_modules` au lieu d’être découpés en vendor chunks.
   */
  serverExternalPackages: ['tailwind-merge', 'clsx'],
  /**
   * Important en monorepo: empêche Next de tracer depuis un mauvais "workspace root"
   * (ex: `C:\Users\BK`) ce qui peut ralentir fortement le build sur Windows.
   */
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  /**
   * Next 15 affiche parfois un warning "The Next.js plugin was not detected..."
   * dans les monorepos utilisant la config ESLint "flat" (`eslint.config.*`),
   * même quand `@next/eslint-plugin-next` est bien présent.
   *
   * On garde `npm run lint` pour faire appliquer ESLint,
   * et on évite de bloquer/parasiter le `next build` avec ce check.
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**', pathname: '/**' },
      { protocol: 'http', hostname: '**', pathname: '/**' },
    ],
  },
};

export default nextConfig;
