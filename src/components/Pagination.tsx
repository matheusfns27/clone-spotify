import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZES, pageWindow, type Page, type PageSize } from '../lib/pagination';

interface PaginationProps {
  page: Page<unknown>;
  pageSize: PageSize;
  onPage: (page: number) => void;
  onPageSize: (size: PageSize) => void;
}

/** Barra de paginação reutilizável: resumo, páginas e tamanho (25/50/100/200). */
export function Pagination({ page, pageSize, onPage, onPageSize }: PaginationProps) {
  return (
    <nav className="pagination" aria-label="Paginação">
      <p className="pagination__summary" aria-live="polite">
        {page.total === 0 ? 'Nenhum item' : `${page.from}–${page.to} de ${page.total}`}
      </p>
      {page.totalPages > 1 && (
        <ul className="pagination__pages">
          <li>
            <button type="button" className="btn-icon" aria-label="Página anterior" disabled={page.page <= 1} onClick={() => onPage(page.page - 1)}>
              <ChevronLeft aria-hidden="true" />
            </button>
          </li>
          {pageWindow(page.page, page.totalPages).map((n, index) =>
            n === '…' ? (
              <li key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={n}>
                <button
                  type="button"
                  className="pagination__page"
                  aria-current={n === page.page ? 'page' : undefined}
                  aria-label={`Página ${n}`}
                  onClick={() => onPage(n)}
                >
                  {n}
                </button>
              </li>
            ),
          )}
          <li>
            <button type="button" className="btn-icon" aria-label="Próxima página" disabled={page.page >= page.totalPages} onClick={() => onPage(page.page + 1)}>
              <ChevronRight aria-hidden="true" />
            </button>
          </li>
        </ul>
      )}
      <div className="pagination__size" role="group" aria-label="Itens por página">
        <span>Por página:</span>
        {PAGE_SIZES.map((size) => (
          <button key={size} type="button" className="pagination__page" aria-pressed={size === pageSize} onClick={() => onPageSize(size)}>
            {size}
          </button>
        ))}
      </div>
    </nav>
  );
}
