import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionListPage } from './QuestionListPage';

const fixtureQuestions = [
  { id: 1, type: 'multiple_choice', difficulty: 'easy', promptMdx: 'Qual é o valor de $1+1$?' },
  { id: 2, type: 'multiple_response', difficulty: 'hard', promptMdx: 'Quais são verdadeiras?' },
];

describe('QuestionListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders every question and calls onEditQuestion when one is clicked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(fixtureQuestions), { status: 200 }));
    const onEditQuestion = vi.fn();
    const user = userEvent.setup();

    render(<QuestionListPage onEditQuestion={onEditQuestion} onNewQuestion={() => {}} />);

    expect(await screen.findByText('Qual é o valor de $1+1$?')).toBeInTheDocument();
    await user.click(screen.getByText('Quais são verdadeiras?'));

    expect(onEditQuestion).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('calls onNewQuestion when the new-question button is clicked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    const onNewQuestion = vi.fn();
    const user = userEvent.setup();

    render(<QuestionListPage onEditQuestion={() => {}} onNewQuestion={onNewQuestion} />);
    await user.click(screen.getByRole('button', { name: 'Nova questão' }));

    expect(onNewQuestion).toHaveBeenCalledOnce();
  });
});
