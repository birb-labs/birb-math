import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { SimuladoSetup } from './simulado-setup';
import type { TopicNode } from '@birb-math/content-schema';

const fixtureTagTree: TopicNode[] = [
  {
    id: 1,
    slug: 'limites',
    name: 'Limites',
    subtopics: [{ id: 2, slug: 'limites-laterais', name: 'Limites Laterais' }],
  },
];

describe('SimuladoSetup', () => {
  it('renders topic and subtopic checkboxes, difficulty options, and a question-count input', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup tagTree={fixtureTagTree} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('checkbox', { name: 'Limites' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).toBeInTheDocument();
    expect(screen.getByLabelText('Número de questões')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar simulado' })).toBeInTheDocument();
  });

  it('calls onStart with the selected configuration', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup tagTree={fixtureTagTree} onStart={onStart} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));
    await user.clear(screen.getByLabelText('Número de questões'));
    await user.type(screen.getByLabelText('Número de questões'), '5');
    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    expect(onStart).toHaveBeenCalledExactlyOnceWith({
      questionCount: 5,
      tagIds: [1, 2],
      difficulties: ['easy', 'medium', 'hard'],
    });
  });

  it('selecting a topic also selects all of its subtopics', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup tagTree={fixtureTagTree} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));

    expect(screen.getByRole('checkbox', { name: 'Limites' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).toBeChecked();
  });

  it('deselecting a subtopic also deselects its parent topic', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup tagTree={fixtureTagTree} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));
    await user.click(screen.getByRole('checkbox', { name: 'Limites Laterais' }));

    expect(screen.getByRole('checkbox', { name: 'Limites' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).not.toBeChecked();
  });

  it('deselecting a topic also deselects all of its subtopics', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup tagTree={fixtureTagTree} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));
    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));

    expect(screen.getByRole('checkbox', { name: 'Limites' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).not.toBeChecked();
  });

  it('selecting every subtopic individually also selects the parent topic', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup tagTree={fixtureTagTree} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites Laterais' }));

    expect(screen.getByRole('checkbox', { name: 'Limites' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).toBeChecked();
  });
});
