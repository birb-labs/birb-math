import { describe, expect, it } from 'vitest';
import { insertAtCursor } from './insert-at-cursor';

describe('insertAtCursor', () => {
  it('inserts the snippet at the cursor position when there is no selection', () => {
    expect(insertAtCursor('ab', 1, 1, 'X')).toBe('aXb');
  });

  it('replaces a selected range with the snippet', () => {
    expect(insertAtCursor('hello world', 6, 11, 'there')).toBe('hello there');
  });

  it('inserts at the very start when start and end are both 0', () => {
    expect(insertAtCursor('rest', 0, 0, 'pre-')).toBe('pre-rest');
  });

  it('inserts at the very end when start and end equal the text length', () => {
    expect(insertAtCursor('abc', 3, 3, 'd')).toBe('abcd');
  });
});
