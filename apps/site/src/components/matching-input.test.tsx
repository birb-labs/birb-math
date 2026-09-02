import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchingInput } from './matching-input';
import type { ExportedMatchingPair } from '@/lib/simulado-selection';

const pairs: ExportedMatchingPair[] = [
  { id: 1, leftHtml: '<p>Removível</p>', rightHtml: '<p>Descrição A</p>' },
  { id: 2, leftHtml: '<p>Salto</p>', rightHtml: '<p>Descrição B</p>' },
];

describe('MatchingInput', () => {
  it('renders both left items and both right items', () => {
    render(<MatchingInput pairs={pairs} onChange={() => {}} />);

    expect(screen.getByText('Removível')).toBeInTheDocument();
    expect(screen.getByText('Salto')).toBeInTheDocument();
    expect(screen.getByText('Descrição A')).toBeInTheDocument();
    expect(screen.getByText('Descrição B')).toBeInTheDocument();
  });
});
