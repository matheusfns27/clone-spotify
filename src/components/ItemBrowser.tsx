import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { trackById } from '../data/catalog';
import type { EntityKind } from '../data/types';
import type { Option } from '../lib/combobox';
import { KIND_LABELS, type ListItem } from '../lib/items';
import { paginate } from '../lib/pagination';
import { navigate } from '../lib/route';
import { useApp } from '../state/app-context';
import { usePlayEntity } from './Carousel';
import { Cover } from './Cover';
import { MultiSelect } from './MultiSelect';
import { Pagination } from './Pagination';
import { TrackRow } from './TrackRow';

interface ItemBrowserProps {
  items: readonly ListItem[];
  /** Muda quando o conjunto de itens muda por fora (ex.: nova busca): volta para a página 1. */
  resetKey: string;
  label: string;
  emptyText: string;
  /** Id da playlist do usuário em que as faixas estão (habilita "Remover desta playlist"). */
  fromPlaylist?: string;
}

const KIND_ORDER: EntityKind[] = ['artist', 'album', 'playlist', 'track'];

function EntityRow({ item, selected, onSelect }: { item: ListItem; selected: boolean; onSelect: () => void }) {
  const play = usePlayEntity();
  return (
    <li
      className={`entity-row${selected ? ' entity-row--selected' : ''}`}
      data-selected={selected || undefined}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a, button')) return;
        onSelect();
        navigate(item.href);
      }}
    >
      <Cover coverKey={item.coverKey} round={item.kind === 'artist'} className="entity-row__cover" />
      <div className="entity-row__text">
        <a className="entity-row__title" href={item.href}>
          {item.title}
        </a>
        <span className="entity-row__subtitle">{item.subtitle}</span>
      </div>
      <button type="button" className="btn-icon entity-row__play" aria-label={`Tocar ${item.title}`} onClick={() => play(item.kind, item.id)}>
        <Play aria-hidden="true" fill="currentColor" />
      </button>
    </li>
  );
}

/**
 * Lista paginada (25/50/100/200) com filtros em combobox de múltipla escolha (tipo e gênero).
 * Usada na busca, na biblioteca e nas curtidas; faixas tocam a partir da lista já filtrada.
 */
export function ItemBrowser({ items, resetKey, label, emptyText, fromPlaylist }: ItemBrowserProps) {
  const { pageSize, setPageSize } = useApp();
  const [types, setTypes] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setPage(1);
  }

  const typeOptions = useMemo<Option[]>(() => {
    const present = new Set(items.map((item) => item.kind));
    return KIND_ORDER.filter((kind) => present.has(kind)).map((kind) => ({ value: kind, label: KIND_LABELS[kind] }));
  }, [items]);
  const genreOptions = useMemo<Option[]>(
    () => [...new Set(items.map((item) => item.genre))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((genre) => ({ value: genre, label: genre })),
    [items],
  );

  const filtered = useMemo(
    () => items.filter((item) => (types.length === 0 || types.includes(item.kind)) && (genres.length === 0 || genres.includes(item.genre))),
    [items, types, genres],
  );
  const trackIds = useMemo(() => filtered.filter((item) => item.kind === 'track').map((item) => item.id), [filtered]);
  const positions = useMemo(() => new Map(trackIds.map((id, index) => [id, index])), [trackIds]);
  const current = paginate(filtered, page, pageSize);

  const changeTypes = (next: string[]) => {
    setTypes(next);
    setPage(1);
  };
  const changeGenres = (next: string[]) => {
    setGenres(next);
    setPage(1);
  };

  return (
    <div className="browser">
      <div className="filters">
        {typeOptions.length > 1 && <MultiSelect label="Tipo" options={typeOptions} selected={types} onChange={changeTypes} />}
        <MultiSelect label="Gênero" options={genreOptions} selected={genres} onChange={changeGenres} />
        <p className="filters__count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>
      {filtered.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <ul className="rows" aria-label={label}>
          {current.items.map((item, index) => {
            const track = item.kind === 'track' ? trackById.get(item.id) : undefined;
            const select = () => setSelected(item.key);
            if (track) {
              return (
                <TrackRow
                  key={item.key}
                  track={track}
                  number={current.from + index}
                  queueIds={trackIds}
                  position={positions.get(item.id) ?? 0}
                  fromPlaylist={fromPlaylist}
                  selected={selected === item.key}
                  onSelect={select}
                />
              );
            }
            return <EntityRow key={item.key} item={item} selected={selected === item.key} onSelect={select} />;
          })}
        </ul>
      )}
      <Pagination page={current} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
    </div>
  );
}
