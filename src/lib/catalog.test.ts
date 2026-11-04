import { describe, expect, it } from 'vitest';
import { ALBUMS, ARTISTS, PLAYLISTS, TRACKS, trackById } from '../data/catalog';
import { AUDIO_FILES } from '../data/audio.generated';
import { coverSvg, coverUrl } from './cover';
import { formatTime, formatTotal } from './format';
import { brasiliaHour, greeting } from './greeting';
import { entityTrackIds, libraryItems, searchItems } from './items';
import type { LibraryState } from './library';
import { parseHash, paths } from './route';

describe('catálogo fictício', () => {
  it('tem o tamanho pedido', () => {
    expect(ARTISTS.length).toBeGreaterThanOrEqual(15);
    expect(ALBUMS.length).toBeGreaterThanOrEqual(25);
    expect(TRACKS.length).toBeGreaterThanOrEqual(150);
    expect(PLAYLISTS.length).toBeGreaterThanOrEqual(12);
    expect(AUDIO_FILES.length).toBeGreaterThanOrEqual(8);
  });
  it('ids e títulos de faixa são únicos e as referências existem', () => {
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(TRACKS.length);
    expect(new Set(TRACKS.map((t) => t.title)).size).toBe(TRACKS.length);
    for (const album of ALBUMS) for (const id of album.trackIds) expect(trackById.has(id)).toBe(true);
    for (const playlist of PLAYLISTS) {
      expect(playlist.trackIds.length).toBeGreaterThan(10);
      for (const id of playlist.trackIds) expect(trackById.has(id)).toBe(true);
    }
  });
  it('a duração da faixa é a do arquivo de áudio (20 a 40 s)', () => {
    for (const track of TRACKS) {
      const file = AUDIO_FILES.find((f) => f.file === track.audioFile);
      expect(file?.durationSec).toBe(track.durationSec);
      expect(track.durationSec).toBeGreaterThanOrEqual(20);
      expect(track.durationSec).toBeLessThanOrEqual(40);
    }
  });
});

describe('capas geradas', () => {
  it('são determinísticas e distintas para cada álbum, playlist e artista', () => {
    expect(coverSvg('album:x')).toBe(coverSvg('album:x'));
    const keys = [...ALBUMS.map((a) => `album:${a.id}`), ...PLAYLISTS.map((p) => `playlist:${p.id}`), ...ARTISTS.map((a) => `artist:${a.id}`)];
    expect(new Set(keys.map((k) => coverUrl(k))).size).toBe(keys.length);
    expect(coverUrl('album:x')).toMatch(/^data:image\/svg\+xml,/);
  });
});

describe('busca', () => {
  it('ignora acento e maiúsculas e encontra por artista, álbum, playlist e faixa', () => {
    expect(searchItems('NEVOA ELETRICA', []).some((i) => i.kind === 'artist' && i.title === 'Névoa Elétrica')).toBe(true);
    expect(searchItems('mare alta', []).some((i) => i.kind === 'album' && i.title === 'Maré Alta')).toBe(true);
    expect(searchItems('madrugada tranquila', []).some((i) => i.kind === 'playlist')).toBe(true);
    const track = TRACKS[7];
    expect(track).toBeDefined();
    const found = searchItems((track?.title ?? '').toUpperCase(), []);
    expect(found.some((i) => i.kind === 'track' && i.id === track?.id)).toBe(true);
  });
  it('lista artistas antes de faixas e traz playlists do usuário', () => {
    const kinds = searchItems('forro', [{ id: 'u1', name: 'Meu Forró', trackIds: [], createdAt: '' }]).map((i) => i.kind);
    expect(kinds.indexOf('artist')).toBeLessThan(kinds.lastIndexOf('track'));
    expect(kinds).toContain('playlist');
  });
  it('consulta vazia não devolve nada', () => {
    expect(searchItems('   ', [])).toEqual([]);
  });
});

describe('biblioteca e entidades', () => {
  const firstArtist = ARTISTS[0]?.id ?? '';
  const firstAlbum = ALBUMS[0];
  const library: LibraryState = {
    likes: [],
    follows: [firstArtist],
    savedAlbums: [firstAlbum?.id ?? ''],
    playlists: [{ id: 'u1', name: 'Minha', trackIds: ['t001'], createdAt: '' }],
    recents: [],
  };
  it('junta playlists próprias, de catálogo, álbuns salvos e artistas seguidos', () => {
    const items = libraryItems(library);
    expect(items).toHaveLength(1 + PLAYLISTS.length + 1 + 1);
    expect(items[0]?.title).toBe('Minha');
  });
  it('faixas de cada entidade', () => {
    expect(entityTrackIds('album', firstAlbum?.id ?? '', [])).toEqual(firstAlbum?.trackIds);
    expect(entityTrackIds('playlist', 'u1', library.playlists)).toEqual(['t001']);
    const artistTracks = entityTrackIds('artist', firstArtist, []);
    expect(artistTracks.length).toBeGreaterThan(5);
    const plays = artistTracks.map((id) => trackById.get(id)?.plays ?? 0);
    expect(plays).toEqual([...plays].sort((a, b) => b - a));
  });
});

describe('rota (hash router)', () => {
  it('converte hash em rota', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#/')).toEqual({ name: 'home' });
    expect(parseHash(paths.album('maré alta'))).toEqual({ name: 'album', id: 'maré alta' });
    expect(parseHash(paths.artist('x'))).toEqual({ name: 'artist', id: 'x' });
    expect(parseHash(paths.playlist('p'))).toEqual({ name: 'playlist', id: 'p' });
    expect(parseHash(paths.search('Bia Lavanda'))).toEqual({ name: 'search', query: 'Bia Lavanda' });
    expect(parseHash('#/buscar')).toEqual({ name: 'search', query: '' });
    expect(parseHash('#/curtidas')).toEqual({ name: 'liked' });
    expect(parseHash('#/biblioteca')).toEqual({ name: 'library' });
    expect(parseHash('#/album')).toEqual({ name: 'notfound' });
    expect(parseHash('#/nada')).toEqual({ name: 'notfound' });
  });
});

describe('formatação e saudação', () => {
  it('formata tempos', () => {
    expect(formatTime(75.9)).toBe('1:15');
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTotal(3900)).toBe('1 h 05 min');
    expect(formatTotal(150)).toBe('2 min 30 s');
  });
  it('usa o horário de Brasília (UTC-3), não o do navegador', () => {
    expect(brasiliaHour(new Date('2026-06-10T12:00:00Z'))).toBe(9);
    expect(greeting(new Date('2026-06-10T12:00:00Z'))).toBe('Bom dia'); // 09:00
    expect(greeting(new Date('2026-06-10T16:00:00Z'))).toBe('Boa tarde'); // 13:00
    expect(greeting(new Date('2026-06-10T02:00:00Z'))).toBe('Boa noite'); // 23:00 do dia anterior
    expect(greeting(new Date('2026-06-10T07:59:00Z'))).toBe('Boa noite'); // 04:59
    expect(greeting(new Date('2026-06-10T08:00:00Z'))).toBe('Bom dia'); // 05:00
  });
});
