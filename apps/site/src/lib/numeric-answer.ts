function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLocaleSeparators(locale: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.';
  const group = parts.find((part) => part.type === 'group')?.value ?? ',';
  return { decimal, group };
}

export function normalizeNumericAnswer(input: string, locale: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === '') return trimmed;

  const { decimal, group } = getLocaleSeparators(locale);
  const numericPattern = new RegExp(
    `^[+-]?[0-9${escapeRegExp(group)}]*(?:${escapeRegExp(decimal)}[0-9]+)?$`,
  );

  if (!numericPattern.test(trimmed) || !/[0-9]/.test(trimmed)) {
    return trimmed;
  }

  const withoutGroups = trimmed.split(group).join('');
  return decimal === '.' ? withoutGroups : withoutGroups.replace(decimal, '.');
}

export function formatNumericAnswerForDisplay(canonical: string, locale: string): string {
  const trimmed = canonical.trim();
  const numericValue = Number(trimmed);

  if (trimmed === '' || Number.isNaN(numericValue)) {
    return canonical;
  }

  return new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }).format(numericValue);
}
