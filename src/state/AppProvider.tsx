import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ALBUMS, ARTISTS, PLAYLISTS, TRACKS, albumById, artistById, playlistById, trackById } from '../data/catalog';
import type { EntityRef } from '../data/types';
import {
  addTrackToPlaylist,
  createPlaylist as createPlaylistIn,
  deletePlaylist as deletePlaylistIn,
  pushRecent as pushRecentIn,
  removeTrackFromPlaylist,
  renamePlaylist as renamePlaylistIn,
  sanitizeLibrary,
  toggleId,
  validatePlaylistName,
  type LibraryState,
} from '../lib/library';
import { DEFAULT_PAGE_SIZE, isPageSize, type PageSize } from '../lib/pagination';
import { loadJson, saveJson } from '../lib/storage';
import { AppContext, type AppContextValue, type DialogState, type PlaylistView } from './app-context';

/** Estado de demonstração: a biblioteca não nasce vazia, e há curtidas e seguidos o bastante para mostrar a paginação. */
export function defaultLibrary(): LibraryState {
  const recents: EntityRef[] = [
    { kind: 'playlist', id: PLAYLISTS[0]?.id ?? '' },
    { kind: 'album', id: ALBUMS[3]?.id ?? '' },
    { kind: 'artist', id: ARTISTS[7]?.id ?? '' },
    { kind: 'playlist', id: PLAYLISTS[4]?.id ?? '' },
    { kind: 'album', id: ALBUMS[13]?.id ?? '' },
    { kind: 'playlist', id: PLAYLISTS[2]?.id ?? '' },
    { kind: 'album', id: ALBUMS[9]?.id ?? '' },
    { kind: 'artist', id: ARTISTS[1]?.id ?? '' },
  ];
  return {
    likes: TRACKS.filter((_, index) => index % 5 === 2).map((track) => track.id),
    follows: ARTISTS.slice(0, 12).map((artist) => artist.id),
    savedAlbums: ALBUMS.filter((_, index) => index % 2 === 0).slice(0, 10).map((album) => album.id),
    playlists: [],
    recents,
  };
}

const valid = {
  track: (id: string) => trackById.has(id),
  artist: (id: string) => artistById.has(id),
  album: (id: string) => albumById.has(id),
  playlist: (id: string) => playlistById.has(id),
};

function newId(): string {
  return `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryState>(() => sanitizeLibrary(loadJson<unknown>('library', null), defaultLibrary(), valid));
  const [pageSize, setPageSizeState] = useState<PageSize>(() => {
    const stored = loadJson<unknown>('pageSize', DEFAULT_PAGE_SIZE);
    return isPageSize(stored) ? stored : DEFAULT_PAGE_SIZE;
  });
  const [dialog, setDialog] = useState<DialogState>(null);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);

  useEffect(() => saveJson('library', library), [library]);
  useEffect(() => saveJson('pageSize', pageSize), [pageSize]);

  const setPageSize = useCallback((size: PageSize) => setPageSizeState(size), []);

  const createPlaylist = useCallback(
    (name: string): { id: string } | { error: string } => {
      const error = validatePlaylistName(name, library.playlists);
      if (error) return { error };
      const id = newId();
      setLibrary((state) => createPlaylistIn(state, name, id, new Date().toISOString()));
      return { id };
    },
    [library.playlists],
  );

  const renamePlaylist = useCallback(
    (id: string, name: string) => {
      const error = validatePlaylistName(name, library.playlists, id);
      if (!error) setLibrary((state) => renamePlaylistIn(state, id, name));
      return error;
    },
    [library.playlists],
  );

  const getPlaylist = useCallback(
    (id: string): PlaylistView | undefined => {
      const own = library.playlists.find((p) => p.id === id);
      if (own) return { id: own.id, title: own.name, description: '', trackIds: own.trackIds, user: true };
      const catalog = playlistById.get(id);
      return catalog ? { id: catalog.id, title: catalog.title, description: catalog.description, trackIds: catalog.trackIds, user: false } : undefined;
    },
    [library.playlists],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      library,
      pageSize,
      setPageSize,
      isLiked: (trackId) => library.likes.includes(trackId),
      toggleLike: (trackId) => setLibrary((s) => ({ ...s, likes: toggleId(s.likes, trackId) })),
      isFollowing: (artistId) => library.follows.includes(artistId),
      toggleFollow: (artistId) => setLibrary((s) => ({ ...s, follows: toggleId(s.follows, artistId) })),
      isAlbumSaved: (albumId) => library.savedAlbums.includes(albumId),
      toggleAlbumSaved: (albumId) => setLibrary((s) => ({ ...s, savedAlbums: toggleId(s.savedAlbums, albumId) })),
      createPlaylist,
      renamePlaylist,
      deletePlaylist: (id) => setLibrary((s) => deletePlaylistIn(s, id)),
      addToPlaylist: (playlistId, trackId) => setLibrary((s) => addTrackToPlaylist(s, playlistId, trackId)),
      removeFromPlaylist: (playlistId, trackId) => setLibrary((s) => removeTrackFromPlaylist(s, playlistId, trackId)),
      getPlaylist,
      userPlaylists: library.playlists,
      pushRecent: (ref) => setLibrary((s) => ({ ...s, recents: pushRecentIn(s.recents, ref) })),
      dialog,
      // O mesmo botão nunca abre a mesma janela duas vezes: com uma aberta, o pedido é ignorado.
      openDialog: (next) => setDialog((current) => current ?? next),
      closeDialog: () => setDialog(null),
      fullPlayerOpen,
      setFullPlayerOpen,
      resetData: () => {
        Object.keys(localStorage)
          .filter((key) => key.startsWith('clone-spotify:'))
          .forEach((key) => localStorage.removeItem(key));
        window.location.hash = '#/';
        window.location.reload();
      },
    }),
    [library, pageSize, setPageSize, createPlaylist, renamePlaylist, getPlaylist, dialog, fullPlayerOpen],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
