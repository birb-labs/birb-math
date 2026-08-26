import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt-BR', 'en-US', 'es'],
  defaultLocale: 'pt-BR',
  localePrefix: 'always',
});
