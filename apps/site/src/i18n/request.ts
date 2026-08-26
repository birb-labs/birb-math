import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import * as rootParams from 'next/root-params';
import { routing } from './routing';

export default getRequestConfig(async () => {
  const paramValue = await rootParams.locale();
  const locale = hasLocale(routing.locales, paramValue) ? paramValue : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
