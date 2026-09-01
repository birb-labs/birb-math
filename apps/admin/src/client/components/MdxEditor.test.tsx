import { useState } from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MdxEditor } from './MdxEditor';

// MdxEditor is a fully controlled component (mirroring how LessonEditorPage uses it:
// value/onChange backed by its own state). Rendering it with a fixed `value` prop and a bare
// vi.fn() `onChange` would make every keystroke revert the textarea back to that fixed value
// before the next one lands, since nothing ever feeds the typed characters back in as `value`.
// This harness echoes onChange into state, like a real caller would, while still letting the
// test assert on every call the spy received.
function ControlledHarness({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('');
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
});
