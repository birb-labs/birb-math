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

  it('saving one locale tab of a short_text question preserves the other locale\'s accepted answers', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })) // GET /api/tags
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            type: 'short_text',
            difficulty: 'easy',
            correctAnswer: null,
            answerFormat: 'text',
            tagIds: [],
            translations: {
              'pt-BR': {
                promptMdx: 'Qual gás?',
                resolutionMdx: 'Oxigênio.',
                options: [],
                matchingPairs: [],
              },
              'en-US': {
                promptMdx: 'Which gas?',
                resolutionMdx: 'Oxygen.',
                options: [],
                matchingPairs: [],
              },
            },
            acceptedAnswersShared: [],
            acceptedAnswersByLocale: {
              'pt-BR': ['resposta'],
              'en-US': ['answer'],
            },
          }),
          { status: 200 },
        ),
      ) // GET /api/questions/:id
      .mockResolvedValue(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 })); // preview + PATCH

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<QuestionEditorPage questionId={1} onDone={onDone} />);

    await screen.findByDisplayValue('Qual gás?');

    // Switch to the en-US tab (do not touch the accepted answers there) and save.
    await user.click(screen.getByRole('button', { name: 'en-US' }));
    expect(screen.getByDisplayValue('Which gas?')).toBeInTheDocument();

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());

    const patchCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions/1' && (init as RequestInit)?.method === 'PATCH',
    );
    expect(patchCall).toBeDefined();
    const body = JSON.parse((patchCall![1] as RequestInit).body as string);
    expect(body.acceptedAnswersByLocale['pt-BR']).toEqual(['resposta']);
    expect(body.acceptedAnswersByLocale['en-US']).toEqual(['answer']);
  });

  it("saving one locale tab preserves the other locale's option text", async () => {
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
                promptMdx: 'Qual gás as plantas absorvem?',
                resolutionMdx: 'CO2.',
                options: [
                  { id: 1, textMdx: 'Oxigênio', isCorrect: false, order: 1 },
                  { id: 2, textMdx: 'Dióxido de carbono', isCorrect: true, order: 2 },
                ],
                matchingPairs: [],
              },
              'en-US': {
                promptMdx: 'Which gas do plants absorb?',
                resolutionMdx: 'CO2.',
                options: [
                  { id: 1, textMdx: 'Oxygen', isCorrect: false, order: 1 },
                  { id: 2, textMdx: 'Carbon dioxide', isCorrect: true, order: 2 },
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
      .mockResolvedValue(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 })); // preview + PATCH

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<QuestionEditorPage questionId={1} onDone={onDone} />);

    await screen.findByDisplayValue('Qual gás as plantas absorvem?');

    // Edit only the en-US tab, then save.
    await user.click(screen.getByRole('button', { name: 'en-US' }));
    expect(screen.getByDisplayValue('Which gas do plants absorb?')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Enunciado'), '!');

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());

    const patchCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions/1' && (init as RequestInit)?.method === 'PATCH',
    );
    expect(patchCall).toBeDefined();
    const body = JSON.parse((patchCall![1] as RequestInit).body as string);

    // The backend rebuilds the shared option rows from scratch whenever
    // `translations` is present, so every locale must be in the body or its
    // option text is lost — and a missing pt-BR breaks every later read.
    expect(Object.keys(body.translations)).toEqual(['pt-BR', 'en-US']);
    expect(body.translations['pt-BR'].promptMdx).toBe('Qual gás as plantas absorvem?');
    expect(body.translations['pt-BR'].options.map((o: { textMdx: string }) => o.textMdx)).toEqual([
      'Oxigênio',
      'Dióxido de carbono',
    ]);
    expect(body.translations['en-US'].promptMdx).toBe('Which gas do plants absorb?!');
    expect(body.translations['en-US'].options.map((o: { textMdx: string }) => o.textMdx)).toEqual([
      'Oxygen',
      'Carbon dioxide',
    ]);
    // `isCorrect` is structural (shared across locales), so it must agree everywhere.
    expect(body.translations['pt-BR'].options.map((o: { isCorrect: boolean }) => o.isCorrect)).toEqual([false, true]);
    expect(body.translations['en-US'].options.map((o: { isCorrect: boolean }) => o.isCorrect)).toEqual([false, true]);
  });

  it("toggling an option's correctness on a non-pt-BR tab applies to every locale", async () => {
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
                promptMdx: 'Qual gás?',
                resolutionMdx: 'CO2.',
                options: [
                  { id: 1, textMdx: 'Oxigênio', isCorrect: false, order: 1 },
                  { id: 2, textMdx: 'Dióxido de carbono', isCorrect: true, order: 2 },
                ],
                matchingPairs: [],
              },
              'en-US': {
                promptMdx: 'Which gas?',
                resolutionMdx: 'CO2.',
                options: [
                  { id: 1, textMdx: 'Oxygen', isCorrect: false, order: 1 },
                  { id: 2, textMdx: 'Carbon dioxide', isCorrect: true, order: 2 },
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
      .mockResolvedValue(new Response(JSON.stringify({ html: '<p></p>' }), { status: 200 }));

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<QuestionEditorPage questionId={1} onDone={onDone} />);

    await screen.findByDisplayValue('Qual gás?');
    await user.click(screen.getByRole('button', { name: 'en-US' }));

    // Move the correct answer to the first option from the en-US tab.
    await user.click(screen.getAllByRole('radio')[0]);

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());

    const patchCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/questions/1' && (init as RequestInit)?.method === 'PATCH',
    );
    const body = JSON.parse((patchCall![1] as RequestInit).body as string);
    expect(body.translations['en-US'].options.map((o: { isCorrect: boolean }) => o.isCorrect)).toEqual([true, false]);
    expect(body.translations['pt-BR'].options.map((o: { isCorrect: boolean }) => o.isCorrect)).toEqual([true, false]);
    // ...without disturbing pt-BR's own text.
    expect(body.translations['pt-BR'].options.map((o: { textMdx: string }) => o.textMdx)).toEqual([
      'Oxigênio',
      'Dióxido de carbono',
    ]);
  });
});
