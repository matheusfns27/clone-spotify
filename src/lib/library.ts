import type { EntityRef, UserPlaylist } from '../data/types';

/** Tudo que o usuário guarda: curtidas, artistas seguidos, álbuns salvos, playlists próprias e "tocados recentemente". */
export interface LibraryState {
  likes: string[];
  follows: string[];
  savedAlbums: string[];
  playlists: UserPlaylist[];
  recents: EntityRef[];
}

export const MAX_RECENTS = 12;
export const MAX_PLAYLIST_NAME = 60;

/** Liga/desliga um id. Ao ligar, entra no início da lista (mais recente primeiro). */
export function toggleId(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
}

/** Nome válido de playlist: devolve a mensagem de erro, ou null se estiver ok. */
export function validatePlaylistName(name: string, existing: readonly UserPlaylist[], ignoreId?: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Dê um nome à playlist.';
  if (trimmed.length > MAX_PLAYLIST_NAME) return `Use no máximo ${MAX_PLAYLIST_NAME} caracteres.`;
  const lower = trimmed.toLocaleLowerCase('pt-BR');
  if (existing.some((p) => p.id !== ignoreId && p.name.toLocaleLowerCase('pt-BR') === lower)) {
    return 'Você já tem uma playlist com esse nome.';
  }
  return null;
}

/** Cria a playlist no início da lista. Lança se o nome for inválido (valide antes com `validatePlaylistName`). */
export function createPlaylist(state: LibraryState, name: string, id: string, createdAt: string): LibraryState {
  const error = validatePlaylistName(name, state.playlists);
  if (error) throw new Error(error);
  return { ...state, playlists: [{ id, name: name.trim(), trackIds: [], createdAt }, ...state.playlists] };
}

export function renamePlaylist(state: LibraryState, id: string, name: string): LibraryState {
  const error = validatePlaylistName(name, state.playlists, id);
  if (error) throw new Error(error);
  return { ...state, playlists: state.playlists.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)) };
}

export function deletePlaylist(state: LibraryState, id: string): LibraryState {
  return { ...state, playlists: state.playlists.filter((p) => p.id !== id) };
}

/** Acrescenta a faixa ao fim da playlist; faixa que já está lá não é duplicada. */
export function addTrackToPlaylist(state: LibraryState, playlistId: string, trackId: string): LibraryState {
  return {
    ...state,
    playlists: state.playlists.map((p) =>
      p.id === playlistId && !p.trackIds.includes(trackId) ? { ...p, trackIds: [...p.trackIds, trackId] } : p,
    ),
  };
}

export function removeTrackFromPlaylist(state: LibraryState, playlistId: string, trackId: string): LibraryState {
  return {
    ...state,
    playlists: state.playlists.map((p) => (p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) } : p)),
  };
}

/** Coloca a entidade no topo de "Tocados recentemente", sem duplicar e respeitando o limite. */
export function pushRecent(recents: readonly EntityRef[], ref: EntityRef): EntityRef[] {
  const rest = recents.filter((r) => !(r.kind === ref.kind && r.id === ref.id));
  return [ref, ...rest].slice(0, MAX_RECENTS);
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Lê o que veio do `localStorage` descartando o que for inválido; `isValid` diz quais ids de catálogo ainda existem. */
export function sanitizeLibrary(raw: unknown, fallback: LibraryState, valid: { track: (id: string) => boolean; artist: (id: string) => boolean; album: (id: string) => boolean; playlist: (id: string) => boolean }): LibraryState {
  if (!isObject(raw)) return fallback;
  const ids = (value: unknown, ok: (id: string) => boolean, fb: string[]) =>
    Array.isArray(value) ? [...new Set(value.filter((x): x is string => typeof x === 'string' && ok(x)))] : fb;
  const playlists = Array.isArray(raw.playlists)
    ? raw.playlists.flatMap((p): UserPlaylist[] => {
        if (!isObject(p) || typeof p.id !== 'string' || typeof p.name !== 'string') return [];
        const createdAt = typeof p.createdAt === 'string' ? p.createdAt : new Date(0).toISOString();
        return [{ id: p.id, name: p.name.slice(0, MAX_PLAYLIST_NAME), trackIds: ids(p.trackIds, valid.track, []), createdAt }];
      })
    : fallback.playlists;
  const recents = Array.isArray(raw.recents)
    ? raw.recents.flatMap((r): EntityRef[] => {
        if (!isObject(r) || typeof r.id !== 'string') return [];
        if (r.kind === 'artist' && valid.artist(r.id)) return [{ kind: 'artist', id: r.id }];
        if (r.kind === 'album' && valid.album(r.id)) return [{ kind: 'album', id: r.id }];
        if (r.kind === 'playlist' && valid.playlist(r.id)) return [{ kind: 'playlist', id: r.id }];
        return [];
      })
    : fallback.recents;
  return {
    likes: ids(raw.likes, valid.track, fallback.likes),
    follows: ids(raw.follows, valid.artist, fallback.follows),
    savedAlbums: ids(raw.savedAlbums, valid.album, fallback.savedAlbums),
    playlists,
    recents: recents.slice(0, MAX_RECENTS),
  };
}
