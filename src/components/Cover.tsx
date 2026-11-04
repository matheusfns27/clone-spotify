import { coverUrl } from '../lib/cover';

interface CoverProps {
  /** Chave estável da capa (ex.: `album:circuito-aberto`). */
  coverKey: string;
  className?: string;
  /** Artistas aparecem em círculo. */
  round?: boolean;
}

/** Capa gerada por código (SVG); decorativa, o texto ao redor já nomeia o item. */
export function Cover({ coverKey, className = '', round = false }: CoverProps) {
  return <img className={`cover${round ? ' cover--round' : ''} ${className}`.trim()} src={coverUrl(coverKey)} alt="" width="300" height="300" loading="lazy" decoding="async" />;
}
