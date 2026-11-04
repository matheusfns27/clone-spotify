import { describe, expect, it } from 'vitest';
import { matchesQuery, normalize } from './text';

describe('normalize', () => {
  it('remove acentos, maiúsculas e espaços extras', () => {
    expect(normalize('  Ação   DE  Ficção ')).toBe('acao de ficcao');
  });
});

describe('matchesQuery', () => {
  it('ignora acento e maiúsculas e exige todos os termos', () => {
    expect(matchesQuery('MARE cinzas', ['Maré de Cinzas'])).toBe(true);
    expect(matchesQuery('mare faro', ['Maré de Cinzas'])).toBe(false);
  });
  it('consulta vazia casa com tudo', () => {
    expect(matchesQuery('   ', ['qualquer'])).toBe(true);
  });
});
