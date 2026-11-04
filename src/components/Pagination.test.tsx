import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { paginate } from '../lib/pagination';
import { Pagination } from './Pagination';

describe('<Pagination>', () => {
  it('mostra o resumo, troca de página e de tamanho', async () => {
    const user = userEvent.setup();
    const onPage = vi.fn();
    const onPageSize = vi.fn();
    const page = paginate(Array.from({ length: 66 }, (_, i) => i), 1, 25);
    render(<Pagination page={page} pageSize={25} onPage={onPage} onPageSize={onPageSize} />);
    expect(screen.getByText('1–25 de 66')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Página 2' }));
    expect(onPage).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole('button', { name: '100' }));
    expect(onPageSize).toHaveBeenCalledWith(100);
    expect(screen.getByRole('button', { name: '25' })).toHaveAttribute('aria-pressed', 'true');
  });
});
