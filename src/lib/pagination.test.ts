import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, isPageSize, PAGE_SIZES, pageWindow, paginate } from './pagination';

const items = Array.from({ length: 60 }, (_, i) => i + 1);

describe('paginate', () => {
  it('usa 25 por página por padrão e fatia corretamente', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(25);
    const p = paginate(items, 2, 25);
    expect(p.items[0]).toBe(26);
    expect(p.items).toHaveLength(25);
    expect(p).toMatchObject({ page: 2, totalPages: 3, from: 26, to: 50, total: 60 });
  });
  it('última página fica parcial', () => {
    expect(paginate(items, 3, 25).items).toHaveLength(10);
  });
  it('ajusta página fora do intervalo', () => {
    expect(paginate(items, 99, 25).page).toBe(3);
    expect(paginate(items, 0, 25).page).toBe(1);
  });
  it('lista vazia tem uma página e from/to zerados', () => {
    expect(paginate([], 1, 25)).toMatchObject({ totalPages: 1, from: 0, to: 0, total: 0 });
  });
  it('aceita só os tamanhos 25, 50, 100 e 200', () => {
    expect([...PAGE_SIZES]).toEqual([25, 50, 100, 200]);
    expect(isPageSize(50)).toBe(true);
    expect(isPageSize(30)).toBe(false);
  });
});

describe('pageWindow', () => {
  it('mostra tudo quando são poucas páginas', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });
  it('usa reticências nos buracos', () => {
    expect(pageWindow(5, 10)).toEqual([1, '…', 4, 5, 6, '…', 10]);
  });
});
