import { describe, expect, it } from 'vitest';
import { parseSelectedOptionIds, toggleOptionId } from './multi-response-answer';

describe('parseSelectedOptionIds', () => {
  it('returns an empty array for an undefined answer', () => {
    expect(parseSelectedOptionIds(undefined)).toEqual([]);
  });

  it('returns an empty array for a blank answer', () => {
    expect(parseSelectedOptionIds('')).toEqual([]);
  });

  it('parses a single id', () => {
    expect(parseSelectedOptionIds('3')).toEqual([3]);
  });

  it('parses and sorts multiple ids numerically', () => {
    expect(parseSelectedOptionIds('12,3,7')).toEqual([3, 7, 12]);
  });
});

describe('toggleOptionId', () => {
  it('adds an id to an undefined answer', () => {
    expect(toggleOptionId(undefined, 3)).toBe('3');
  });

  it('adds an id to a blank answer', () => {
    expect(toggleOptionId('', 3)).toBe('3');
  });

  it('adds an id, keeping the result sorted numerically', () => {
    expect(toggleOptionId('12,3', 7)).toBe('3,7,12');
  });

  it('removes an id that is already selected', () => {
    expect(toggleOptionId('3,7,12', 7)).toBe('3,12');
  });

  it('returns a blank answer when removing the only selected id', () => {
    expect(toggleOptionId('3', 3)).toBe('');
  });
});
