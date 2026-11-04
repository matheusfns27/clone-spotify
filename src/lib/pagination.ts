export const PAGE_SIZES = [25, 50, 100, 200] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export function isPageSize(value: unknown): value is PageSize {
  return PAGE_SIZES.some((size) => size === value);
}

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  /** Posição (a partir de 1) do primeiro e do último item da página; 0 quando vazia. */
  from: number;
  to: number;
}

/** Fatia a lista; a página pedida é ajustada ao intervalo válido (1..totalPages). */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const start = (current - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    page: current,
    totalPages,
    total,
    from: slice.length === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}

/** Números de página para a barra: primeira, última e vizinhas da atual; "…" nos buracos. */
export function pageWindow(page: number, totalPages: number): (number | '…')[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  pages.forEach((n, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && n - previous > 1) result.push('…');
    result.push(n);
  });
  return result;
}
