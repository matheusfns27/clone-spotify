import { useApp } from '../state/app-context';
import { QueueDialog } from './QueueDialog';
import { DeletePlaylistDialog, PlaylistNameDialog } from './PlaylistDialogs';
import { TrackActionsDialog } from './TrackActionsDialog';

/** Monta a janela modal pedida pelo estado; só existe uma por vez, então o mesmo botão nunca abre duas. */
export function Dialogs() {
  const { dialog } = useApp();
  if (!dialog) return null;
  switch (dialog.kind) {
    case 'create-playlist':
      return <PlaylistNameDialog mode="create" thenAddTrack={dialog.thenAddTrack} />;
    case 'rename-playlist':
      return <PlaylistNameDialog mode="rename" playlistId={dialog.id} />;
    case 'delete-playlist':
      return <DeletePlaylistDialog playlistId={dialog.id} />;
    case 'track-actions':
      return <TrackActionsDialog trackId={dialog.trackId} fromPlaylist={dialog.fromPlaylist} />;
    case 'queue':
      return <QueueDialog />;
  }
}
