import { useState } from 'react';
import { Check, Disc3, Heart, ListPlus, ListX, Plus, User } from 'lucide-react';
import { albumById, artistById, trackById } from '../data/catalog';
import { coverKeyFor } from '../lib/items';
import { navigate, paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { usePlayer } from '../state/player-context';
import { Cover } from './Cover';
import { Modal } from './Modal';

/** Ações de uma faixa: curtir, fila, playlists, ir para álbum/artista e remover da playlist de origem. */
export function TrackActionsDialog({ trackId, fromPlaylist }: { trackId: string; fromPlaylist?: string }) {
  const { closeDialog, openDialog, isLiked, toggleLike, library, addToPlaylist, removeFromPlaylist } = useApp();
  const { enqueue } = usePlayer();
  const [choosing, setChoosing] = useState(false);
  const track = trackById.get(trackId);
  if (!track) return null;
  const liked = isLiked(trackId);

  const go = (hash: string) => {
    closeDialog();
    navigate(hash);
  };

  return (
    <Modal labelledBy="actions-title" onClose={closeDialog}>
      <div className="dialog">
        <div className="dialog__head">
          <Cover coverKey={coverKeyFor('album', track.albumId)} className="dialog__cover" />
          <div className="dialog__head-text">
            <h2 id="actions-title" className="dialog__title">
              {track.title}
            </h2>
            <p className="dialog__empty">{artistById.get(track.artistId)?.name}</p>
          </div>
        </div>
        {choosing ? (
          <>
            <h3 className="dialog__subtitle">Adicionar à playlist</h3>
            <ul className="menu">
              <li>
                <button type="button" className="menu__item" onClick={() => { closeDialog(); openDialog({ kind: 'create-playlist', thenAddTrack: trackId }); }}>
                  <Plus aria-hidden="true" /> Nova playlist
                </button>
              </li>
              {library.playlists.map((playlist) => {
                const inside = playlist.trackIds.includes(trackId);
                return (
                  <li key={playlist.id}>
                    <button type="button" className="menu__item" aria-pressed={inside} onClick={() => (inside ? removeFromPlaylist(playlist.id, trackId) : addToPlaylist(playlist.id, trackId))}>
                      {inside ? <Check aria-hidden="true" /> : <ListPlus aria-hidden="true" />} {playlist.name}
                      <span className="menu__hint">{inside ? 'Adicionada' : `${playlist.trackIds.length} músicas`}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {library.playlists.length === 0 && <p className="dialog__empty">Você ainda não tem playlists. Crie a primeira acima.</p>}
            <div className="dialog__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setChoosing(false)}>
                Voltar
              </button>
              <button type="button" className="btn btn--primary" onClick={closeDialog}>
                Concluir
              </button>
            </div>
          </>
        ) : (
          <ul className="menu">
            <li>
              <button type="button" className="menu__item" onClick={() => toggleLike(trackId)}>
                <Heart aria-hidden="true" fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Remover das curtidas' : 'Curtir'}
              </button>
            </li>
            <li>
              <button type="button" className="menu__item" onClick={() => { enqueue(trackId); closeDialog(); }}>
                <ListPlus aria-hidden="true" /> Adicionar à fila
              </button>
            </li>
            <li>
              <button type="button" className="menu__item" onClick={() => setChoosing(true)}>
                <Plus aria-hidden="true" /> Adicionar à playlist
              </button>
            </li>
            {fromPlaylist && (
              <li>
                <button type="button" className="menu__item" onClick={() => { removeFromPlaylist(fromPlaylist, trackId); closeDialog(); }}>
                  <ListX aria-hidden="true" /> Remover desta playlist
                </button>
              </li>
            )}
            <li>
              <button type="button" className="menu__item" onClick={() => go(paths.album(track.albumId))}>
                <Disc3 aria-hidden="true" /> Ir para o álbum {albumById.get(track.albumId)?.title}
              </button>
            </li>
            <li>
              <button type="button" className="menu__item" onClick={() => go(paths.artist(track.artistId))}>
                <User aria-hidden="true" /> Ir para o artista
              </button>
            </li>
          </ul>
        )}
      </div>
    </Modal>
  );
}
