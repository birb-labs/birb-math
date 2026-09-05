import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    expect(body.acceptedAnswersShared).toEqual([]);
    expect(body.acceptedAnswersByLocale).toEqual({});
    expect(body.translations['pt-BR'].matchingPairs).toEqual([]);
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
    expect(body.acceptedAnswersByLocale['pt-BR']).toEqual(['Oxigênio']);
    expect(body.acceptedAnswersShared).toEqual([]);
    expect(body.correctAnswer).toBeNull();
    expect(body.translations['pt-BR'].options).toEqual([]);
  });

  it('creates a math-mode short_text question with a LaTeX accepted answer', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 12 }), { status: 201 }));

    const onDone = vi.fn();
    const user = userEvent.setup();

    const { container } = render(<QuestionEditorPage questionId={null} onDone={onDone} />);

    await user.selectOptions(await screen.findByLabelText('Tipo'), 'short_text');
    await user.type(screen.getByLabelText('Enunciado'), 'Quanto é a derivada de x^2?');
    await user.type(screen.getByLabelText('Resolução'), '2x.');
    await user.selectOptions(screen.getByLabelText('Modo de resposta'), 'math');

    const field = await waitFor(() => {
      const el = container.querySelector('math-field');
      if (!el) throw new Error('math-field not mounted yet');
      return el as HTMLElement & { value: string };
    });
    field.value = '2x';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDone).toHaveBeenCalledOnce();
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions' && (init as RequestInit)?.method === 'POST',
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.answerFormat).toBe('math');
    expect(body.acceptedAnswersShared).toEqual(['2x']);
    expect(body.acceptedAnswersByLocale).toEqual({});
  });

  it('creates a new ordering question via POST', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 12 }), { status: 201 }));

    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<QuestionEditorPage questionId={null} onDone={onDone} />);

    await user.selectOptions(await screen.findByLabelText('Tipo'), 'ordering');
    await user.type(screen.getByLabelText('Enunciado'), 'Ordene.');
    await user.type(screen.getByLabelText('Resolução'), 'Ver resolução.');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDone).toHaveBeenCalledOnce();
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions' && (init as RequestInit)?.method === 'POST',
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.translations['pt-BR'].options).toHaveLength(2); // the default 2 blank options QuestionEditorPage starts with
    expect(body.acceptedAnswersShared).toEqual([]);
    expect(body.acceptedAnswersByLocale).toEqual({});
    expect(body.translations['pt-BR'].matchingPairs).toEqual([]);
  });

  it('creates a new matching question via POST', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 13 }), { status: 201 }));

    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<QuestionEditorPage questionId={null} onDone={onDone} />);

    await user.selectOptions(await screen.findByLabelText('Tipo'), 'matching');
    await user.type(screen.getByLabelText('Enunciado'), 'Associe.');
    await user.type(screen.getByLabelText('Resolução'), 'Ver resolução.');
    await user.type(screen.getByLabelText('Esquerda 1'), 'Cão');
    await user.type(screen.getByLabelText('Direita 1'), 'Late');
    await user.type(screen.getByLabelText('Esquerda 2'), 'Gato');
    await user.type(screen.getByLabelText('Direita 2'), 'Mia');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDone).toHaveBeenCalledOnce();
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions' && (init as RequestInit)?.method === 'POST',
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.translations['pt-BR'].matchingPairs).toEqual([
      { leftMdx: 'Cão', rightMdx: 'Late' },
      { leftMdx: 'Gato', rightMdx: 'Mia' },
    ]);
    expect(body.translations['pt-BR'].options).toEqual([]);
    expect(body.acceptedAnswersShared).toEqual([]);
    expect(body.acceptedAnswersByLocale).toEqual({});
  });

  it('loads an existing question into the pt-BR tab and switches to en-US without losing the pt-BR draft', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })) // GET /api/tags
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            type: 'multiple_choice',
            difficulty: 'easy',
            correctAnswer: null,
            answerFormat: 'text',
            tagIds: [],
            translations: {
              'pt-BR': {
                promptMdx: 'Qual é o valor de 1 + 1?',
                resolutionMdx: 'A soma é 2.',
                options: [
                  { id: 1, textMdx: '1', isCorrect: false, order: 1 },
                  { id: 2, textMdx: '2', isCorrect: true, order: 2 },
                ],
                matchingPairs: [],
              },
            },
            acceptedAnswersShared: [],
            acceptedAnswersByLocale: {},
          }),
          { status: 200 },
        ),
      ) // GET /api/questions/:id
      .mockResolvedValue(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 })); // preview requests

    const user = userEvent.setup();
    render(<QuestionEditorPage questionId={1} onDone={() => {}} />);

    expect(await screen.findByDisplayValue('Qual é o valor de 1 + 1?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'en-US' }));
    expect(screen.getByLabelText('Enunciado')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'pt-BR' }));
    expect(screen.getByLabelText('Enunciado')).toHaveValue('Qual é o valor de 1 + 1?');
  });
});
