export type EntityKind = 'track' | 'artist' | 'album' | 'playlist';

export interface Artist {
  id: string;
  name: string;
  genre: string;
  bio: string;
  monthlyListeners: number;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  genre: string;
  /** Data de lançamento (AAAA-MM-DD, fictícia). */
  releaseDate: string;
  trackIds: string[];
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  albumId: string;
  /** Posição no álbum (a partir de 1). */
  number: number;
  genre: string;
  /** Nome do arquivo em `public/audio/`. */
  audioFile: string;
  /** Duração real do arquivo de áudio, em segundos. */
  durationSec: number;
  plays: number;
}

/** Playlist de catálogo (montada pelo "editorial" fictício). */
export interface Playlist {
  id: string;
  title: string;
  description: string;
  genre: string;
  trackIds: string[];
}

/** Playlist criada pelo usuário e guardada em `localStorage`. */
export interface UserPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
}

export interface EntityRef {
  kind: Exclude<EntityKind, 'track'>;
  id: string;
}
