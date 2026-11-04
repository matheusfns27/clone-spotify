import { describe, expect, it } from 'vitest';
import { filterOptions, summarizeSelection, toggleValue } from './combobox';

const options = [
  { value: 'acao', label: 'Ação' },
  { value: 'ficcao', label: 'Ficção científica' },
  { value: 'comedia', label: 'Comédia' },
];

describe('combobox', () => {
  it('filtra opções sem acento nem maiúsculas', () => {
    expect(filterOptions(options, 'ACAO').map((o) => o.value)).toEqual(['acao']);
    expect(filterOptions(options, 'cient').map((o) => o.value)).toEqual(['ficcao']);
    expect(filterOptions(options, '')).toHaveLength(3);
  });
  it('liga e desliga valores sem duplicar', () => {
    expect(toggleValue([], 'a')).toEqual(['a']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
  });
  it('resume a seleção', () => {
    expect(summarizeSelection('Gêneros', [], options)).toBe('Gêneros');
    expect(summarizeSelection('Gêneros', ['acao'], options)).toBe('Ação');
    expect(summarizeSelection('Gêneros', ['acao', 'comedia'], options)).toBe('2 selecionados');
  });
});
