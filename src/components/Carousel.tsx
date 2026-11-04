import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { EntityKind } from '../data/types';
import { entityTrackIds, type ListItem } from '../lib/items';
import { useApp } from '../state/app-context';
import { usePlayer } from '../state/player-context';
import { Cover } from './Cover';

/** Hook: toca a lista de faixas de uma entidade (álbum, playlist ou artista). */
export function usePlayEntity() {
  const { userPlaylists } = useApp();
  const { playTracks } = usePlayer();
  return (kind: EntityKind, id: string) => {
    if (kind === 'track') return;
    playTracks(entityTrackIds(kind, id, userPlaylists), 'auto', { kind, id });
  };
}

/** Cartão de carrossel: capa, título e subtítulo levam à tela do item; o botão verde toca. */
export function EntityCard({ item }: { item: ListItem }) {
  const play = usePlayEntity();
  return (
    <li className="card">
      <div className="card__art">
        <a href={item.href} tabIndex={-1} aria-hidden="true">
          <Cover coverKey={item.coverKey} round={item.kind === 'artist'} className="card__cover" />
        </a>
        <button type="button" className="card__play" aria-label={`Tocar ${item.title}`} onClick={() => play(item.kind, item.id)}>
          <Play aria-hidden="true" fill="currentColor" />
        </button>
      </div>
      <a className="card__link" href={item.href}>
        <span className="card__title">{item.title}</span>
        <span className="card__subtitle">{item.subtitle}</span>
      </a>
    </li>
  );
}

interface CarouselProps {
  title: string;
  titleId: string;
  /** Link "Mostrar tudo". */
  moreHref?: string;
  children: ReactNode;
}

/** Carrossel com rolagem horizontal (sem paginação): rola com a roda do mouse e com os botões. */
export function Carousel({ title, titleId, moreHref, children }: CarouselProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const scroll = (direction: -1 | 1) => {
    const list = listRef.current;
    if (!list) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: smooth ? 'smooth' : 'auto' });
  };
  return (
    <section className="carousel" aria-labelledby={titleId}>
      <div className="carousel__head">
        <h2 id={titleId} className="section-title">
          {moreHref ? <a href={moreHref}>{title}</a> : title}
        </h2>
        <div className="carousel__arrows">
          <button type="button" className="btn-icon" aria-label={`Rolar ${title} para a esquerda`} onClick={() => scroll(-1)}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="btn-icon" aria-label={`Rolar ${title} para a direita`} onClick={() => scroll(1)}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul className="carousel__list" ref={listRef}>
        {children}
      </ul>
    </section>
  );
}
