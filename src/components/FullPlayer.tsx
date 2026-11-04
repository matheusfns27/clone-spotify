import type { CSSProperties } from 'react';
import { ListMusic } from 'lucide-react';
import { albumById, artistById, trackById } from '../data/catalog';
import { coverHue } from '../lib/cover';
import { coverKeyFor } from '../lib/items';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { usePlayer } from '../state/player-context';
import { ProgressBar, TransportControls, VolumeControl } from './Controls';
import { Cover } from './Cover';
import { LikeButton } from './LikeButton';
import { Modal } from './Modal';

/** Player expandido em tela cheia (celular): capa grande, progresso, controles e acesso à fila. */
export function FullPlayer() {
  const { trackId } = usePlayer();
  const { setFullPlayerOpen, openDialog } = useApp();
  const track = trackId ? trackById.get(trackId) : undefined;
  if (!track) return null;
  const artist = artistById.get(track.artistId);
  const album = albumById.get(track.albumId);
  const key = coverKeyFor('album', track.albumId);
  const close = () => setFullPlayerOpen(false);
  return (
    <Modal labelledBy="full-player-title" onClose={close} className="modal--full">
      <div className="full" style={{ '--hue': coverHue(key) } as CSSProperties}>
        <p className="full__context">Tocando de {album?.title}</p>
        <Cover coverKey={key} className="full__cover" />
        <div className="full__info">
          <div className="full__text">
            <h2 id="full-player-title" className="full__title">
              {track.title}
            </h2>
            <a className="full__artist" href={paths.artist(track.artistId)} onClick={close}>
              {artist?.name}
            </a>
          </div>
          <LikeButton trackId={track.id} title={track.title} />
        </div>
        <ProgressBar />
        <TransportControls large />
        <div className="full__bottom">
          <VolumeControl />
          <button type="button" className="btn-icon" aria-label="Fila de reprodução" onClick={() => openDialog({ kind: 'queue' })}>
            <ListMusic aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
