import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchingPairsEditor } from './MatchingPairsEditor';

describe('MatchingPairsEditor', () => {
  it('renders a left and right input per pair', () => {
    render(
      <MatchingPairsEditor
        pairs={[
          { leftMdx: 'Cão', rightMdx: 'Late' },
          { leftMdx: 'Gato', rightMdx: 'Mia' },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('adds a blank pair when "Adicionar par" is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<MatchingPairsEditor pairs={[{ leftMdx: 'Cão', rightMdx: 'Late' }]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Adicionar par' }));

    expect(onChange).toHaveBeenLastCalledWith([
      { leftMdx: 'Cão', rightMdx: 'Late' },
      { leftMdx: '', rightMdx: '' },
    ]);
  });
});
