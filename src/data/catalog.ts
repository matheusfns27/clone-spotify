import { createRandom, hashString } from '../lib/random';
import { AUDIO_FILES } from './audio.generated';
import { ARTISTS } from './artists';
import { makeTrackTitles } from './titles';
import type { Album, Playlist, Track } from './types';

export { ARTISTS };

const TRACKS_PER_ALBUM = 6;

/** [id do artista, título, data de lançamento]. Todos fictícios. */
const ALBUM_TABLE: readonly (readonly [string, string, string])[] = [
  ['nevoa-eletrica', 'Circuito Aberto', '2024-03-15'],
  ['nevoa-eletrica', 'Sinal de Fumaça', '2026-09-18'],
  ['pe-de-vento', 'Poeira de Estrada', '2023-06-09'],
  ['pe-de-vento', 'Forró no Quintal', '2026-10-23'],
  ['jacaranda-sul', 'Flores de Outubro', '2022-10-14'],
  ['jacaranda-sul', 'Casa de Barro', '2025-04-04'],
  ['os-tamarindos', 'Garagem 12', '2021-08-20'],
  ['os-tamarindos', 'Ruído Branco', '2024-11-08'],
  ['lumen-fraco', 'Quase Manhã', '2023-02-17'],
  ['lumen-fraco', 'Janelas Acesas', '2026-08-07'],
  ['candeia-viva', 'Lamparina', '2022-05-27'],
  ['candeia-viva', 'Pelas Estradas Velhas', '2025-09-12'],
  ['quintal-azul', 'Tarde de Domingo', '2024-07-19'],
  ['quintal-azul', 'Meia-Luz', '2026-06-26'],
  ['mar-de-cobre', 'Maré Alta', '2025-01-31'],
  ['mar-de-cobre', 'Sal e Neon', '2026-10-09'],
  ['sertao-neon', 'Antena na Roça', '2023-09-22'],
  ['sertao-neon', 'Estrada de Chão', '2025-06-13'],
  ['bia-lavanda', 'Verão Imaginário', '2024-12-06'],
  ['bia-lavanda', 'Cartas ao Vento', '2026-05-29'],
  ['dudu-pitanga', 'Roda de Quintal', '2025-03-21'],
  ['rio-vermelho-trio', 'Madrugada Azul', '2024-10-25'],
  ['andorinha-cosmica', 'Chuva no Telhado', '2025-08-15'],
  ['flor-de-asfalto', 'Concreto e Flor', '2026-07-17'],
  ['vento-norte-orquestra', 'Suíte do Amanhecer', '2023-04-28'],
  ['polvora-doce', 'Faísca', '2026-02-13'],
];

export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function buildCatalog(): { albums: Album[]; tracks: Track[] } {
  const albums: Album[] = [];
  const tracks: Track[] = [];
  const usedTitles = new Set<string>();
  const artistById = new Map(ARTISTS.map((artist) => [artist.id, artist]));
  let counter = 0;

  for (const [artistId, title, releaseDate] of ALBUM_TABLE) {
    const artist = artistById.get(artistId);
    if (!artist) throw new Error(`Artista desconhecido: ${artistId}`);
    const albumId = slugify(title);
    const titles = makeTrackTitles(hashString(albumId), TRACKS_PER_ALBUM, usedTitles);
    const random = createRandom(hashString(`plays:${albumId}`));
    const trackIds: string[] = [];
    titles.forEach((trackTitle, index) => {
      const audio = AUDIO_FILES[counter % AUDIO_FILES.length];
      if (!audio) throw new Error('Nenhum arquivo de áudio gerado: rode `npm run audio`.');
      const id = `t${String(counter + 1).padStart(3, '0')}`;
      trackIds.push(id);
      tracks.push({
        id,
        title: trackTitle,
        artistId,
        albumId,
        number: index + 1,
        genre: artist.genre,
        audioFile: audio.file,
        durationSec: audio.durationSec,
        plays: Math.round(20_000 + random() ** 2 * 9_000_000),
      });
      counter += 1;
    });
    albums.push({ id: albumId, title, artistId, genre: artist.genre, releaseDate, trackIds });
  }
  return { albums, tracks };
}

const built = buildCatalog();
export const ALBUMS: readonly Album[] = built.albums;
export const TRACKS: readonly Track[] = built.tracks;

export const trackById = new Map(TRACKS.map((track) => [track.id, track]));
export const albumById = new Map(ALBUMS.map((album) => [album.id, album]));
export const artistById = new Map(ARTISTS.map((artist) => [artist.id, artist]));

interface PlaylistSpec {
  title: string;
  description: string;
  genres?: readonly string[];
  /** Critério especial no lugar de gêneros. */
  special?: 'novidades' | 'populares';
  size: number;
}

const PLAYLIST_SPECS: readonly PlaylistSpec[] = [
  { title: 'Madrugada Tranquila', description: 'Batidas lentas e teclados para a casa dormir.', genres: ['Lo-fi', 'Instrumental', 'Jazz'], size: 36 },
  { title: 'Treino Pesado', description: 'Guitarras, rimas e graves para não parar.', genres: ['Rock', 'Punk', 'Hip hop', 'Eletrônica'], size: 40 },
  { title: 'Estrada Afora', description: 'Para ouvir de janela aberta, sem pressa de chegar.', genres: ['Sertanejo', 'Folk', 'MPB'], size: 38 },
  { title: 'Festa no Quintal', description: 'Zabumba, pandeiro e gente dançando.', genres: ['Forró', 'Samba'], size: 30 },
  { title: 'Foco Total', description: 'Instrumentais sem distração para trabalhar e estudar.', genres: ['Instrumental', 'Lo-fi', 'Eletrônica'], size: 34 },
  { title: 'Domingo de Sol', description: 'Música leve para o almoço que dura a tarde toda.', genres: ['MPB', 'Samba', 'Pop'], size: 36 },
  { title: 'Noite de Blues', description: 'Guitarra devagar e copo cheio.', genres: ['Blues', 'Jazz'], size: 18 },
  { title: 'Novidades da Semana', description: 'Os lançamentos mais recentes do catálogo fictício.', special: 'novidades', size: 30 },
  { title: 'Sucessos Inventados', description: 'As faixas mais tocadas do nosso mundo de mentira.', special: 'populares', size: 40 },
  { title: 'Para Dançar', description: 'Batidas que não deixam ninguém parado.', genres: ['Eletrônica', 'Pop', 'Forró'], size: 36 },
  { title: 'Voz e Violão', description: 'Só cordas, voz e uma história para contar.', genres: ['Folk', 'MPB', 'Indie'], size: 34 },
  { title: 'Sons da Chuva', description: 'Para ouvir enquanto lá fora cai água.', genres: ['Lo-fi', 'Instrumental', 'Folk'], size: 32 },
];

function pickTracks(spec: PlaylistSpec, seed: number): Track[] {
  const random = createRandom(seed);
  let pool: Track[];
  if (spec.special === 'novidades') {
    const recent = [...ALBUMS].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)).slice(0, 6);
    pool = recent.flatMap((album) => album.trackIds.map((id) => trackById.get(id)).filter((t): t is Track => t !== undefined));
    return pool.slice(0, spec.size);
  }
  if (spec.special === 'populares') {
    return [...TRACKS].sort((a, b) => b.plays - a.plays).slice(0, spec.size);
  }
  pool = TRACKS.filter((track) => spec.genres?.includes(track.genre));
  const shuffled = pool.map((track) => ({ track, key: random() })).sort((a, b) => a.key - b.key);
  return shuffled.slice(0, spec.size).map((entry) => entry.track);
}

export const PLAYLISTS: readonly Playlist[] = PLAYLIST_SPECS.map((spec) => {
  const id = slugify(spec.title);
  const tracks = pickTracks(spec, hashString(id));
  const genre = spec.genres?.[0] ?? (spec.special === 'novidades' ? 'Pop' : 'Rock');
  return { id, title: spec.title, description: spec.description, genre, trackIds: tracks.map((t) => t.id) };
});

export const playlistById = new Map(PLAYLISTS.map((playlist) => [playlist.id, playlist]));

/** Gêneros que existem no catálogo, em ordem alfabética. */
export const GENRES: readonly string[] = [...new Set(ARTISTS.map((artist) => artist.genre))].sort((a, b) =>
  a.localeCompare(b, 'pt-BR'),
);
