import { createContext, useContext } from 'react';
import type { EntityRef, UserPlaylist } from '../data/types';
import type { LibraryState } from '../lib/library';
import type { PageSize } from '../lib/pagination';

/** Janela modal aberta no momento (só uma de cada vez, para o mesmo botão nunca abrir duas). */
export type DialogState =
  | { kind: 'create-playlist'; thenAddTrack?: string }
  | { kind: 'rename-playlist'; id: string }
  | { kind: 'delete-playlist'; id: string }
  | { kind: 'track-actions'; trackId: string; fromPlaylist?: string }
  | { kind: 'queue' }
  | null;

/** Playlist de catálogo ou do usuário, num formato só. */
export interface PlaylistView {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  user: boolean;
}

export interface AppContextValue {
  library: LibraryState;
  pageSize: PageSize;
  setPageSize: (size: PageSize) => void;
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string) => void;
  isFollowing: (artistId: string) => boolean;
  toggleFollow: (artistId: string) => void;
  isAlbumSaved: (albumId: string) => boolean;
  toggleAlbumSaved: (albumId: string) => void;
  /** Cria a playlist e devolve o id; devolve o erro de validação (string) se o nome for inválido. */
  createPlaylist: (name: string) => { id: string } | { error: string };
  renamePlaylist: (id: string, name: string) => string | null;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylist: (id: string) => PlaylistView | undefined;
  userPlaylists: readonly UserPlaylist[];
  pushRecent: (ref: EntityRef) => void;
  dialog: DialogState;
  openDialog: (dialog: Exclude<DialogState, null>) => void;
  closeDialog: () => void;
  fullPlayerOpen: boolean;
  setFullPlayerOpen: (open: boolean) => void;
  /** Apaga tudo que o app guardou no navegador e volta ao estado de demonstração. */
  resetData: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp fora do AppProvider');
  return value;
}
