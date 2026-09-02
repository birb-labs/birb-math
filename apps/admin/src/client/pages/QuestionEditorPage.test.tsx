import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionEditorPage } from './QuestionEditorPage';

describe('QuestionEditorPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a new numeric question via POST', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })) // GET /api/tags
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 })) // preview (prompt)
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 })) // preview (resolution)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 9 }), { status: 201 })); // POST /api/questions

    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<QuestionEditorPage questionId={null} onDone={onDone} />);

    await user.selectOptions(await screen.findByLabelText('Tipo'), 'numeric');
    await user.type(screen.getByLabelText('Enunciado'), 'Quanto é 1?');
    await user.type(screen.getByLabelText('Resolução'), 'É 1.');
    await user.type(screen.getByLabelText('Resposta correta'), '1');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDone).toHaveBeenCalledOnce();
    // Matched by URL (not just `method === 'POST'`): MdxEditor's own debounced preview requests
    // are also POSTs, and under load (e.g. this file running inside the full client suite rather
    // than alone) that 300ms debounce can fire before the Save click's real request, landing
    // earlier in `fetchSpy.mock.calls` — a method-only predicate would then match the preview
    // call instead of the intended one, failing intermittently. The question-creation endpoint is
    // the only one ever called at this exact path, so matching on it directly is deterministic.
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions' && (init as RequestInit)?.method === 'POST',
    );
    expect(postCall).toBeDefined();
  });

  it('creates a new true_false question via POST', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })) // GET /api/tags
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 })) // preview (prompt)
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 })) // preview (resolution)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 10 }), { status: 201 })); // POST /api/questions

    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<QuestionEditorPage questionId={null} onDone={onDone} />);

    await user.selectOptions(await screen.findByLabelText('Tipo'), 'true_false');
    await user.type(screen.getByLabelText('Enunciado'), 'O céu é azul?');
    await user.type(screen.getByLabelText('Resolução'), 'Sim.');
    await user.selectOptions(screen.getByLabelText('Resposta correta'), 'true');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDone).toHaveBeenCalledOnce();
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions' && (init as RequestInit)?.method === 'POST',
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.correctAnswer).toBe('true');
    expect(body.acceptedAnswers).toEqual([]);
    expect(body.matchingPairs).toEqual([]);
  });

  it('creates a new short_text question via POST', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 11 }), { status: 201 }));

    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<QuestionEditorPage questionId={null} onDone={onDone} />);

    await user.selectOptions(await screen.findByLabelText('Tipo'), 'short_text');
    await user.type(screen.getByLabelText('Enunciado'), 'Qual gás?');
    await user.type(screen.getByLabelText('Resolução'), 'Oxigênio.');
    await user.clear(screen.getAllByRole('textbox')[1]);
    await user.type(screen.getAllByRole('textbox')[1], 'Oxigênio');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDone).toHaveBeenCalledOnce();
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions' && (init as RequestInit)?.method === 'POST',
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.acceptedAnswers).toEqual(['Oxigênio']);
    expect(body.correctAnswer).toBeNull();
    expect(body.options).toEqual([]);
  });
});
