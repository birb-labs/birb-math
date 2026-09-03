import { useState } from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MdxEditor } from './MdxEditor';

// MdxEditor is a fully controlled component (mirroring how LessonEditorPage uses it:
// value/onChange backed by its own state). Rendering it with a fixed `value` prop and a bare
// vi.fn() `onChange` would make every keystroke revert the textarea back to that fixed value
// before the next one lands, since nothing ever feeds the typed characters back in as `value`.
// This harness echoes onChange into state, like a real caller would, while still letting the
// test assert on every call the spy received.
function ControlledHarness({
  onChange,
  initialValue = '',
}: {
  onChange: (value: string) => void;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <MdxEditor
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

function findMathField(container: HTMLElement): HTMLElement & { value: string } {
  const el = container.querySelector('math-field');
  if (!el) throw new Error('math-field not mounted yet');
  return el as HTMLElement & { value: string };
}

describe('MdxEditor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('calls onChange as the user types and renders the previewed HTML', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ html: '<p>preview</p>' }), { status: 200 }),
    );
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ControlledHarness onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'ola');

    expect(onChange).toHaveBeenLastCalledWith('ola');
    await waitFor(() => expect(screen.getByText('preview')).toBeInTheDocument());
  });

  it('opens a formula dialog and inserts the LaTeX wrapped in $...$ at the cursor when confirmed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ html: '' }), { status: 200 }),
    );
    const onChange = vi.fn();
    const user = userEvent.setup();

    const { container } = render(<ControlledHarness onChange={onChange} initialValue="antesdepois" />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(5, 5); // cursor right between "antes" and "depois"

    await user.click(screen.getByRole('button', { name: 'Inserir fórmula' }));

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.querySelector('math-field')).toBeTruthy());
    const field = findMathField(dialog);
    field.value = 'x^2';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    await user.click(within(dialog).getByRole('button', { name: 'Inserir' }));

    expect(onChange).toHaveBeenLastCalledWith('antes$x^2$depois');
  });

  it('inserts the formula wrapped in $$...$$ when "Bloco" is checked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ html: '' }), { status: 200 }),
    );
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ControlledHarness onChange={onChange} initialValue="" />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(0, 0);

    await user.click(screen.getByRole('button', { name: 'Inserir fórmula' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.querySelector('math-field')).toBeTruthy());
    const field = findMathField(dialog);
    field.value = 'y=x';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    await user.click(within(dialog).getByLabelText('Bloco (linha própria)'));
    await user.click(within(dialog).getByRole('button', { name: 'Inserir' }));

    expect(onChange).toHaveBeenLastCalledWith('$$y=x$$');
  });

  it('does not insert anything when "Cancelar" is clicked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ html: '' }), { status: 200 }),
    );
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ControlledHarness onChange={onChange} initialValue="original" />);

    await user.click(screen.getByRole('button', { name: 'Inserir fórmula' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables "Inserir" while the formula field is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ html: '' }), { status: 200 }),
    );
    const user = userEvent.setup();

    render(<ControlledHarness onChange={() => {}} initialValue="" />);

    await user.click(screen.getByRole('button', { name: 'Inserir fórmula' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('button', { name: 'Inserir' })).toBeDisabled();
  });
});
