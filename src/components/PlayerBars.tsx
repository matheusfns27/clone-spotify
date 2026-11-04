import { ChevronUp, ListMusic, Pause, Play } from 'lucide-react';
import { albumById, artistById, trackById } from '../data/catalog';
import { coverKeyFor } from '../lib/items';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { usePlayer, useProgress } from '../state/player-context';
import { ProgressBar, TransportControls, VolumeControl } from './Controls';
import { Cover } from './Cover';
import { LikeButton } from './LikeButton';

function useCurrentTrack() {
  const { trackId } = usePlayer();
  return trackId ? trackById.get(trackId) : undefined;
}

/** Player fixo do desktop: faixa atual à esquerda, controles e progresso no centro, fila e volume à direita. */
export function PlayerBar() {
  const track = useCurrentTrack();
  const { openDialog } = useApp();
  const artist = track ? artistById.get(track.artistId) : undefined;
  return (
    <section className="player-bar" aria-label="Player">
      <div className="player-bar__now">
        {track ? (
          <>
            <Cover coverKey={coverKeyFor('album', track.albumId)} className="player-bar__cover" />
            <div className="player-bar__text">
              <a className="player-bar__title" href={paths.album(track.albumId)}>
                {track.title}
              </a>
              <a className="player-bar__artist" href={paths.artist(track.artistId)}>
                {artist?.name}
              </a>
            </div>
            <LikeButton trackId={track.id} title={track.title} />
          </>
        ) : (
          <p className="player-bar__empty">Escolha uma faixa para começar.</p>
        )}
      </div>
      <div className="player-bar__center">
        <TransportControls />
        <ProgressBar />
      </div>
      <div className="player-bar__extra">
        <button type="button" className="btn-icon" aria-label="Fila de reprodução" onClick={() => openDialog({ kind: 'queue' })}>
          <ListMusic aria-hidden="true" />
        </button>
        <VolumeControl />
      </div>
    </section>
  );
}

/** Mini player do celular, acima da navegação: toque na faixa abre o player expandido. */
export function MiniPlayer() {
  const track = useCurrentTrack();
  const { playing, togglePlay, duration } = usePlayer();
  const time = useProgress();
  const { setFullPlayerOpen } = useApp();
  if (!track) return null;
  const artist = artistById.get(track.artistId);
  const album = albumById.get(track.albumId);
  return (
    <section className="mini" aria-label="Mini player">
      <button type="button" className="mini__open" aria-label={`Abrir o player: ${track.title}, ${artist?.name ?? ''}`} onClick={() => setFullPlayerOpen(true)}>
        <Cover coverKey={coverKeyFor('album', track.albumId)} className="mini__cover" />
        <span className="mini__text">
          <span className="mini__title">{track.title}</span>
          <span className="mini__artist">{artist?.name} • {album?.title}</span>
        </span>
        <ChevronUp aria-hidden="true" className="mini__chevron" />
      </button>
      <LikeButton trackId={track.id} title={track.title} />
      <button type="button" className="btn-icon mini__play" aria-label={playing ? 'Pausar' : 'Tocar'} onClick={togglePlay}>
        {playing ? <Pause aria-hidden="true" fill="currentColor" /> : <Play aria-hidden="true" fill="currentColor" />}
      </button>
      <span className="mini__progress" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (time / Math.max(duration, 1)) * 100)}%` }} />
      </span>
    </section>
  );
}
