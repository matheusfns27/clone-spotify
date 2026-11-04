import { useState } from 'react';
import { trackById } from '../data/catalog';
import type { EntityRef, Track } from '../data/types';
import { TrackRow } from './TrackRow';

interface TrackListProps {
  /** Ids da lista inteira (a fila quando se toca daqui). */
  trackIds: readonly string[];
  /** Posição, dentro de `trackIds`, da primeira faixa exibida (para listas paginadas). */
  offset?: number;
  /** Quantas faixas exibir a partir de `offset`; padrão: todas. */
  count?: number;
  source?: EntityRef;
  fromPlaylist?: string;
  /** Números da primeira coluna: posição na lista (padrão) ou número da faixa no álbum. */
  numbering?: 'position' | 'album';
  showCover?: boolean;
  label: string;
}

/** Lista de faixas com seleção de uma linha por vez. */
export function TrackList({ trackIds, offset = 0, count, source, fromPlaylist, numbering = 'position', showCover = true, label }: TrackListProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const end = count === undefined ? trackIds.length : offset + count;
  const rows = trackIds
    .slice(offset, end)
    .map((id, index) => ({ track: trackById.get(id), position: offset + index }))
    .filter((row): row is { track: Track; position: number } => row.track !== undefined);

  return (
    <ul className="tracks" aria-label={label}>
      {rows.map(({ track, position }) => (
        <TrackRow
          key={`${track.id}-${position}`}
          track={track}
          number={numbering === 'album' ? track.number : position + 1}
          queueIds={trackIds}
          position={position}
          source={source}
          fromPlaylist={fromPlaylist}
          selected={selected === `${track.id}-${position}`}
          onSelect={() => setSelected(`${track.id}-${position}`)}
          showCover={showCover}
        />
      ))}
    </ul>
  );
}
