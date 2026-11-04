import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from './MultiSelect';

const options = [
  { value: 'acao', label: 'Ação' },
  { value: 'comedia', label: 'Comédia' },
  { value: 'drama', label: 'Drama' },
];

function Harness() {
  const [selected, setSelected] = useState<string[]>([]);
  return <MultiSelect label="Gêneros" options={options} selected={selected} onChange={setSelected} />;
}

describe('<MultiSelect>', () => {
  it('busca sem acento, mostra "N selecionados" e limpa a seleção', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /gêneros/i }));
    await user.type(screen.getByRole('searchbox'), 'COMEDIA');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.clear(screen.getByRole('searchbox'));
    await user.click(screen.getByRole('option', { name: /ação/i }));
    await user.click(screen.getByRole('option', { name: /drama/i }));
    expect(screen.getByRole('button', { name: /2 selecionados/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar seleção' }));
    expect(screen.getByRole('button', { name: /^gêneros/i })).toBeInTheDocument();
  });

  it('fecha ao clicar fora e com Esc', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Harness />
        <p>fora</p>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: /gêneros/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByText('fora'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /gêneros/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
