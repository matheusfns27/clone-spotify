import { MoreHorizontal, Pause, Play } from 'lucide-react';
import { albumById, artistById } from '../data/catalog';
import type { EntityRef, Track } from '../data/types';
import { formatTime } from '../lib/format';
import { coverKeyFor } from '../lib/items';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { usePlayer } from '../state/player-context';
import { Cover } from './Cover';
import { LikeButton } from './LikeButton';
import { NowPlayingIcon } from './NowPlayingIcon';

interface TrackRowProps {
  track: Track;
  /** Número mostrado na primeira coluna. */
  number: number;
  /** Lista inteira de onde a faixa toca (vira a fila) e posição da faixa nela. */
  queueIds: readonly string[];
  position: number;
  source?: EntityRef;
  /** Id da playlist do usuário em que a faixa está (habilita "Remover desta playlist"). */
  fromPlaylist?: string;
  selected: boolean;
  onSelect: () => void;
  showCover?: boolean;
}

const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

/** Linha de faixa: clique seleciona, duplo clique ou botão de play toca; em toque, um toque toca. */
export function TrackRow({ track, number, queueIds, position, source, fromPlaylist, selected, onSelect, showCover = true }: TrackRowProps) {
  const { trackId, playing, playTracks, togglePlay } = usePlayer();
  const { openDialog } = useApp();
  const isCurrent = trackId === track.id;
  const artist = artistById.get(track.artistId);
  const album = albumById.get(track.albumId);

  const play = () => {
    if (isCurrent) togglePlay();
    else playTracks(queueIds, position, source);
  };

  return (
    <li
      className={`track${isCurrent ? ' track--current' : ''}${selected ? ' track--selected' : ''}`}
      aria-current={isCurrent ? 'true' : undefined}
      data-selected={selected || undefined}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a, button')) return;
        if (isTouch()) play();
        else onSelect();
      }}
      onDoubleClick={(event) => {
        if ((event.target as HTMLElement).closest('a, button')) return;
        playTracks(queueIds, position, source);
      }}
    >
      <div className="track__index">
        {isCurrent ? <NowPlayingIcon playing={playing} /> : <span className="track__number">{number}</span>}
        <button type="button" className="track__play" aria-label={isCurrent && playing ? `Pausar ${track.title}` : `Tocar ${track.title}`} onClick={play}>
          {isCurrent && playing ? <Pause aria-hidden="true" fill="currentColor" /> : <Play aria-hidden="true" fill="currentColor" />}
        </button>
      </div>
      <div className="track__main">
        {showCover && <Cover coverKey={coverKeyFor('album', track.albumId)} className="track__cover" />}
        <div className="track__text">
          <span className="track__title">{track.title}</span>
          <a className="track__artist" href={paths.artist(track.artistId)}>
            {artist?.name}
          </a>
        </div>
      </div>
      <a className="track__album" href={paths.album(track.albumId)}>
        {album?.title}
      </a>
      <LikeButton trackId={track.id} title={track.title} className="track__like" />
      <span className="track__time">{formatTime(track.durationSec)}</span>
      <button type="button" className="btn-icon track__more" aria-label={`Mais opções para ${track.title}`} onClick={() => openDialog({ kind: 'track-actions', trackId: track.id, fromPlaylist })}>
        <MoreHorizontal aria-hidden="true" />
      </button>
    </li>
  );
}
