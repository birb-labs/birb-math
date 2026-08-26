import { describe, expect, it } from 'vitest';
import { resolveMode } from './resolve-mode';

describe('resolveMode', () => {
  it('returns dark when mode is system and the OS prefers dark', () => {
    expect(resolveMode('system', true)).toBe('dark');
  });

  it('returns light when mode is system and the OS prefers light', () => {
    expect(resolveMode('system', false)).toBe('light');
  });

  it('returns the explicit mode unchanged when it is not system', () => {
    expect(resolveMode('dark', false)).toBe('dark');
    expect(resolveMode('light', true)).toBe('light');
  });
});
