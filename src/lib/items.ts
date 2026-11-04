import { ALBUMS, ARTISTS, PLAYLISTS, TRACKS, albumById, artistById } from '../data/catalog';
import type { EntityKind, UserPlaylist } from '../data/types';
import { yearOf } from './format';
import type { LibraryState } from './library';
import { normalize } from './text';
import { paths } from './route';

/** Linha genérica das listas paginadas (busca e biblioteca): faixa, artista, álbum ou playlist. */
export interface ListItem {
  key: string;
  kind: EntityKind;
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  /** Texto pesquisável (título, artista, gênero…), sem o rótulo do tipo. */
  search: string;
  /** Chave da capa gerada por código. */
  coverKey: string;
  href: string;
}

export const KIND_LABELS: Record<EntityKind, string> = {
  track: 'Faixa',
  artist: 'Artista',
  album: 'Álbum',
  playlist: 'Playlist',
};

export const PERSONAL_GENRE = 'Pessoal';

export const coverKeyFor = (kind: EntityKind, id: string) => `${kind}:${id}`;

export const artistItem = (id: string): ListItem | undefined => {
  const artist = artistById.get(id);
  if (!artist) return undefined;
  return { key: `artist:${id}`, kind: 'artist', id, title: artist.name, subtitle: 'Artista', genre: artist.genre, search: `${artist.name} ${artist.genre}`, coverKey: coverKeyFor('artist', id), href: paths.artist(id) };
};

export const albumItem = (id: string): ListItem | undefined => {
  const album = albumById.get(id);
  if (!album) return undefined;
  const artist = artistById.get(album.artistId)?.name ?? '';
  return { key: `album:${id}`, kind: 'album', id, title: album.title, subtitle: `Álbum • ${artist} • ${yearOf(album.releaseDate)}`, genre: album.genre, search: `${album.title} ${artist} ${album.genre}`, coverKey: coverKeyFor('album', id), href: paths.album(id) };
};

const userPlaylistItem = (playlist: UserPlaylist): ListItem => ({
  key: `playlist:${playlist.id}`,
  kind: 'playlist',
  id: playlist.id,
  title: playlist.name,
  subtitle: `Playlist • Sua • ${playlist.trackIds.length} músicas`,
  genre: PERSONAL_GENRE,
  search: playlist.name,
  coverKey: coverKeyFor('playlist', playlist.id),
  href: paths.playlist(playlist.id),
});

export const catalogPlaylistItems: readonly ListItem[] = PLAYLISTS.map((playlist) => ({
  key: `playlist:${playlist.id}`,
  kind: 'playlist',
  id: playlist.id,
  title: playlist.title,
  subtitle: `Playlist • ${playlist.trackIds.length} músicas`,
  genre: playlist.genre,
  search: `${playlist.title} ${playlist.genre}`,
  coverKey: coverKeyFor('playlist', playlist.id),
  href: paths.playlist(playlist.id),
}));

const allArtistItems = ARTISTS.map((a) => artistItem(a.id)).filter((x): x is ListItem => x !== undefined);
const allAlbumItems = ALBUMS.map((a) => albumItem(a.id)).filter((x): x is ListItem => x !== undefined);
const allTrackItems: readonly ListItem[] = TRACKS.map((track) => {
  const artist = artistById.get(track.artistId)?.name ?? '';
  const album = albumById.get(track.albumId);
  return {
    key: `track:${track.id}`,
    kind: 'track',
    id: track.id,
    title: track.title,
    subtitle: `Faixa • ${artist}`,
    genre: track.genre,
    search: `${track.title} ${artist} ${album?.title ?? ''} ${track.genre}`,
    coverKey: coverKeyFor('album', track.albumId),
    href: album ? paths.album(album.id) : paths.home(),
  };
});

export function userPlaylistItems(playlists: readonly UserPlaylist[]): ListItem[] {
  return playlists.map(userPlaylistItem);
}

/** Itens da biblioteca: playlists próprias e de catálogo, álbuns salvos e artistas seguidos (Curtidas fica à parte). */
export function libraryItems(state: LibraryState): ListItem[] {
  const albums = state.savedAlbums.map(albumItem).filter((x): x is ListItem => x !== undefined);
  const artists = state.follows.map(artistItem).filter((x): x is ListItem => x !== undefined);
  return [...userPlaylistItems(state.playlists), ...catalogPlaylistItems, ...albums, ...artists];
}

/** Pontuação simples de relevância: começa com a busca > tem a busca no começo de uma palavra > contém. */
function score(title: string, term: string): number {
  const t = normalize(title);
  if (t.startsWith(term)) return 0;
  if (t.includes(` ${term}`)) return 1;
  return 2;
}

/**
 * Busca em faixa, artista, álbum e playlist, sem acento nem maiúsculas. Todos os termos precisam aparecer no título,
 * no subtítulo ou no gênero. Ordem: artistas, álbuns, playlists, faixas; dentro de cada tipo, mais relevantes primeiro.
 */
export function searchItems(query: string, userPlaylists: readonly UserPlaylist[]): ListItem[] {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (terms.length === 0) return [];
  const first = terms[0] ?? '';
  const byKind = [allArtistItems, allAlbumItems, [...userPlaylistItems(userPlaylists), ...catalogPlaylistItems], allTrackItems];
  return byKind.flatMap((items) =>
    items
      .filter((item) => {
        const haystack = normalize(item.search);
        return terms.every((term) => haystack.includes(term));
      })
      .map((item, order) => ({ item, rank: score(item.title, first), order }))
      .sort((a, b) => a.rank - b.rank || a.order - b.order)
      .map((entry) => entry.item),
  );
}

/** Item de lista para uma faixa pelo id (usado na tela de curtidas). */
export function trackItem(id: string): ListItem | undefined {
  return allTrackItems.find((item) => item.id === id);
}

/** Faixas que tocam ao apertar "play" numa entidade. Artista: as mais ouvidas primeiro. */
export function entityTrackIds(kind: EntityKind, id: string, userPlaylists: readonly UserPlaylist[]): string[] {
  switch (kind) {
    case 'track':
      return [id];
    case 'album':
      return albumById.get(id)?.trackIds ?? [];
    case 'playlist': {
      const own = userPlaylists.find((p) => p.id === id);
      if (own) return own.trackIds;
      return PLAYLISTS.find((p) => p.id === id)?.trackIds ?? [];
    }
    case 'artist':
      return TRACKS.filter((t) => t.artistId === id)
        .sort((a, b) => b.plays - a.plays)
        .map((t) => t.id);
  }
}
