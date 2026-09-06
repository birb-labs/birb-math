import { isValidLocale } from '@birb-math/content-schema';

/**
 * Validates the locale keys of an incoming locale-keyed map (a translation map,
 * or `acceptedAnswersByLocale`) before any of it is written.
 *
 * Two things are checked:
 *
 * 1. Every key is a real `Locale`. The `locale` columns are plain SQLite `text`
 *    with a TypeScript-only enum on the Drizzle side, so an unrecognised key
 *    (`"en"` instead of `"en-US"`) would otherwise be written happily and then
 *    be invisible forever: `resolveTranslation` only ever looks for the
 *    requested locale or `pt-BR`.
 * 2. On creation, that `pt-BR` is present. `resolveTranslation` throws when an
 *    entity has no `pt-BR` row, so an entity created without one would break
 *    every read of it — including the site's production build.
 */
export function validateTranslationLocales(
  translations: Record<string, unknown>,
  { requirePtBr }: { requirePtBr: boolean },
): string | null {
  const keys = Object.keys(translations);

  const unsupported = keys.filter((key) => !isValidLocale(key));
  if (unsupported.length > 0) {
    return `Unsupported locale(s): ${unsupported.join(', ')}.`;
  }

  if (requirePtBr) {
    if (keys.length === 0) return 'At least one locale translation is required.';
    if (!keys.includes('pt-BR')) return 'A pt-BR translation is required.';
  }

  return null;
}
