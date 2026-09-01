import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonEditorPage } from './LessonEditorPage';

describe('LessonEditorPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the lesson, lets it be edited, and saves via PATCH', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1, title: 'Título', bodyMdx: '# Corpo' }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<h1>Corpo</h1>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<LessonEditorPage lessonId={1} onDone={onDone} />);

    expect(await screen.findByDisplayValue('Título')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDone).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenLastCalledWith(
      '/api/lessons/lessons/1',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});
