import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MathField } from './MathField';

function getField(container: HTMLElement): HTMLElement & { value: string } {
  const el = container.querySelector('math-field');
  if (!el) throw new Error('math-field not mounted yet');
  return el as HTMLElement & { value: string };
}

describe('MathField', () => {
  it('mounts a math-field element and sets its initial value', async () => {
    const { container } = render(<MathField value="x^2" onChange={() => {}} />);

    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());
    expect(getField(container).value).toBe('x^2');
  });

  it('calls onChange with the new LaTeX when the field emits a real input event', async () => {
    const onChange = vi.fn();
    const { container } = render(<MathField value="" onChange={onChange} />);

    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());
    const field = getField(container);

    field.value = '\\frac{1}{2}';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith('\\frac{1}{2}');
  });

  it('re-syncs the field when the value prop changes externally', async () => {
    const { container, rerender } = render(<MathField value="1" onChange={() => {}} />);
    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());

    rerender(<MathField value="2" onChange={() => {}} />);

    await waitFor(() => expect(getField(container).value).toBe('2'));
  });

  it('applies ariaLabel, placeholder, and readOnly to the field', async () => {
    const { container } = render(
      <MathField value="" onChange={() => {}} ariaLabel="Sua resposta" placeholder="Digite aqui" readOnly />,
    );

    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());
    const field = getField(container);
    expect(field.getAttribute('aria-label')).toBe('Sua resposta');
    expect(field.getAttribute('placeholder')).toBe('Digite aqui');
    expect(field.getAttribute('read-only')).toBe('true');
  });

  it('removes the field on unmount', async () => {
    const { container, unmount } = render(<MathField value="" onChange={() => {}} />);
    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());

    unmount();

    expect(container.querySelector('math-field')).toBeNull();
  });
});
