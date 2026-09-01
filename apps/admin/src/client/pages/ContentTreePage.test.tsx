import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTreePage } from './ContentTreePage';

const fixtureTree = [
  {
    slug: 'calculo',
    name: 'Cálculo',
    topics: [
      {
        slug: 'limites',
        name: 'Limites',
        sections: [
          {
            slug: 'intro',
            name: 'Introdução',
            lessons: [{ id: 1, slug: 'o-que-e-um-limite', title: 'O que é um limite?' }],
          },
        ],
      },
    ],
  },
];

describe('ContentTreePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the fetched hierarchy and calls onEditLesson when a lesson is clicked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(fixtureTree), { status: 200 }));
    const onEditLesson = vi.fn();
    const user = userEvent.setup();

    render(<ContentTreePage onEditLesson={onEditLesson} />);

    expect(await screen.findByText('Cálculo')).toBeInTheDocument();
    expect(screen.getByText('Limites')).toBeInTheDocument();
    expect(screen.getByText('Introdução')).toBeInTheDocument();

    await user.click(screen.getByText('O que é um limite?'));
    expect(onEditLesson).toHaveBeenCalledExactlyOnceWith(1);
  });
});
