import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderingInput } from './ordering-input';
import { serializeOrderingAnswer } from '@/lib/ordering-answer';
import type { ExportedOption } from '@/lib/simulado-selection';

const options: ExportedOption[] = [
  { id: 1, textHtml: '<p>Fatorar</p>', isCorrect: false },
  { id: 2, textHtml: '<p>Cancelar</p>', isCorrect: false },
  { id: 3, textHtml: '<p>Substituir</p>', isCorrect: false },
];

describe('OrderingInput', () => {
  it('renders every item exactly once', () => {
    render(<OrderingInput options={options} onChange={() => {}} shuffleFn={(items) => items} />);

    expect(screen.getByText('Fatorar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Substituir')).toBeInTheDocument();
  });

  it('renders items in the order shuffleFn returns, not the authored order', () => {
    render(
      <OrderingInput
        options={options}
        onChange={() => {}}
        shuffleFn={(items) => [items[2], items[0], items[1]]}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Substituir');
    expect(items[1]).toHaveTextContent('Fatorar');
    expect(items[2]).toHaveTextContent('Cancelar');
  });

  it('emits the initial shuffled order on mount, without any drag', () => {
    // A student who agrees with the initial order and never drags anything
    // must still have an answer recorded — otherwise it stays `undefined`
    // and grades as incorrect even when the untouched order is correct.
    const onChange = vi.fn();

    render(
      <OrderingInput
        options={options}
        onChange={onChange}
        shuffleFn={(items) => [items[2], items[0], items[1]]}
      />,
    );

    expect(onChange).toHaveBeenCalledExactlyOnceWith(serializeOrderingAnswer([3, 1, 2]));
  });
});
