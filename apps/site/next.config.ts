import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['@birb-math/theme', '@birb-math/content-schema', '@birb-math/math-input'],
};

export default withNextIntl(nextConfig);
