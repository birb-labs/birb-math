import { describe, expect, it } from 'vitest';
import ptBR from './pt-BR.json';
import enUS from './en-US.json';
import es from './es.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('translation message parity', () => {
  it('has the same keys in pt-BR, en-US and es', () => {
    const ptKeys = flattenKeys(ptBR).sort();
    const enKeys = flattenKeys(enUS).sort();
    const esKeys = flattenKeys(es).sort();

    expect(enKeys).toEqual(ptKeys);
    expect(esKeys).toEqual(ptKeys);
  });
});
