import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // O pacote compartilhado é compilado pelo próprio Next (monorepo).
  transpilePackages: ['@mf/shared'],
  images: {
    // A API já gera as versões otimizadas (WebP grande + miniatura) no upload;
    // o next/image cuida só de lazy-load, dimensões e prioridade.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
