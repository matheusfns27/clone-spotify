import { useState, type FormEvent } from 'react';
import { MAX_PLAYLIST_NAME } from '../lib/library';
import { navigate, paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { Modal } from './Modal';

/** Criar ou renomear playlist do usuário (nome obrigatório, sem repetir). */
export function PlaylistNameDialog({ mode, playlistId, thenAddTrack }: { mode: 'create' | 'rename'; playlistId?: string; thenAddTrack?: string }) {
  const { closeDialog, createPlaylist, renamePlaylist, addToPlaylist, getPlaylist } = useApp();
  const [name, setName] = useState(() => (mode === 'rename' && playlistId ? (getPlaylist(playlistId)?.title ?? '') : ''));
  const [error, setError] = useState<string | null>(null);
  const creating = mode === 'create';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (creating) {
      const result = createPlaylist(name);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      closeDialog();
      if (thenAddTrack) addToPlaylist(result.id, thenAddTrack);
      else navigate(paths.playlist(result.id));
    } else if (playlistId) {
      const message = renamePlaylist(playlistId, name);
      if (message) setError(message);
      else closeDialog();
    }
  };

  return (
    <Modal labelledBy="playlist-name-title" onClose={closeDialog}>
      <form className="dialog" onSubmit={submit} noValidate>
        <h2 id="playlist-name-title" className="dialog__title">
          {creating ? 'Criar playlist' : 'Renomear playlist'}
        </h2>
        <label className="field">
          <span>Nome da playlist</span>
          <input
            className="field__input"
            type="text"
            value={name}
            maxLength={MAX_PLAYLIST_NAME}
            data-autofocus
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'playlist-name-error' : undefined}
            placeholder="Minha playlist"
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />
        </label>
        {error && (
          <p id="playlist-name-error" className="field__error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={closeDialog}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            {creating ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Confirmação antes de apagar uma playlist. */
export function DeletePlaylistDialog({ playlistId }: { playlistId: string }) {
  const { closeDialog, deletePlaylist, getPlaylist } = useApp();
  const playlist = getPlaylist(playlistId);
  return (
    <Modal labelledBy="playlist-delete-title" onClose={closeDialog}>
      <div className="dialog">
        <h2 id="playlist-delete-title" className="dialog__title">
          Apagar playlist?
        </h2>
        <p>
          A playlist <strong>{playlist?.title}</strong> será removida da sua biblioteca. As faixas continuam no catálogo.
        </p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={closeDialog}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              deletePlaylist(playlistId);
              closeDialog();
              navigate(paths.library());
            }}
          >
            Apagar
          </button>
        </div>
      </div>
    </Modal>
  );
}
