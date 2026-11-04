import { describe, expect, it } from 'vitest';
import {
  MAX_RECENTS,
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  pushRecent,
  removeTrackFromPlaylist,
  renamePlaylist,
  sanitizeLibrary,
  toggleId,
  validatePlaylistName,
  type LibraryState,
} from './library';

const empty: LibraryState = { likes: [], follows: [], savedAlbums: [], playlists: [], recents: [] };
const all = { track: () => true, artist: () => true, album: () => true, playlist: () => true };

describe('toggleId', () => {
  it('liga no início e desliga', () => {
    expect(toggleId(['a'], 'b')).toEqual(['b', 'a']);
    expect(toggleId(['b', 'a'], 'b')).toEqual(['a']);
  });
});

describe('playlists do usuário', () => {
  it('valida nome vazio, longo e repetido (sem diferenciar maiúsculas)', () => {
    const state = createPlaylist(empty, 'Minha Mix', 'u1', '2026-01-01');
    expect(validatePlaylistName('   ', state.playlists)).toMatch(/nome/i);
    expect(validatePlaylistName('x'.repeat(61), state.playlists)).toMatch(/60/);
    expect(validatePlaylistName('minha mix', state.playlists)).toMatch(/já tem/);
    expect(validatePlaylistName('Outra', state.playlists)).toBeNull();
  });
  it('cria, renomeia e apaga', () => {
    let state = createPlaylist(empty, '  Treino ', 'u1', '2026-01-01');
    expect(state.playlists[0]?.name).toBe('Treino');
    state = createPlaylist(state, 'Estudo', 'u2', '2026-01-02');
    expect(state.playlists.map((p) => p.id)).toEqual(['u2', 'u1']);
    state = renamePlaylist(state, 'u1', 'Corrida');
    expect(state.playlists.find((p) => p.id === 'u1')?.name).toBe('Corrida');
    expect(() => renamePlaylist(state, 'u1', 'estudo')).toThrow();
    expect(deletePlaylist(state, 'u2').playlists.map((p) => p.id)).toEqual(['u1']);
  });
  it('permite renomear só trocando maiúsculas do próprio nome', () => {
    const state = createPlaylist(empty, 'Treino', 'u1', '2026-01-01');
    expect(renamePlaylist(state, 'u1', 'TREINO').playlists[0]?.name).toBe('TREINO');
  });
  it('adiciona faixa sem duplicar e remove', () => {
    let state = createPlaylist(empty, 'Treino', 'u1', '2026-01-01');
    state = addTrackToPlaylist(state, 'u1', 't1');
    state = addTrackToPlaylist(state, 'u1', 't1');
    state = addTrackToPlaylist(state, 'u1', 't2');
    expect(state.playlists[0]?.trackIds).toEqual(['t1', 't2']);
    expect(removeTrackFromPlaylist(state, 'u1', 't1').playlists[0]?.trackIds).toEqual(['t2']);
  });
});

describe('pushRecent', () => {
  it('põe no topo, sem duplicar, respeitando o limite', () => {
    let list = pushRecent([], { kind: 'album', id: 'a' });
    list = pushRecent(list, { kind: 'artist', id: 'b' });
    list = pushRecent(list, { kind: 'album', id: 'a' });
    expect(list).toEqual([
      { kind: 'album', id: 'a' },
      { kind: 'artist', id: 'b' },
    ]);
    for (let i = 0; i < 30; i++) list = pushRecent(list, { kind: 'playlist', id: `p${i}` });
    expect(list).toHaveLength(MAX_RECENTS);
  });
});

describe('persistência (sanitizeLibrary)', () => {
  it('faz ida e volta pelo JSON sem perder nada', () => {
    let state = createPlaylist(empty, 'Treino', 'u1', '2026-01-01');
    state = addTrackToPlaylist(
      { ...state, likes: ['t1', 't2'], follows: ['x'], savedAlbums: ['y'], recents: [{ kind: 'album', id: 'y' }] },
      'u1',
      't9',
    );
    const restored = sanitizeLibrary(JSON.parse(JSON.stringify(state)), empty, all);
    expect(restored).toEqual(state);
  });
  it('descarta lixo e ids que não existem mais', () => {
    const fallback: LibraryState = { ...empty, likes: ['padrao'] };
    expect(sanitizeLibrary('quebrado', fallback, all)).toBe(fallback);
    const restored = sanitizeLibrary(
      {
        likes: ['t1', 3, 'ghost', 't1'],
        follows: 'x',
        playlists: [{ id: 5 }, { id: 'u', name: 'Ok', trackIds: ['t1', 'ghost'] }],
        recents: [
          { kind: 'album', id: 'ghost' },
          { kind: 'x', id: 'a' },
        ],
      },
      fallback,
      { ...all, track: (id) => id !== 'ghost', album: (id) => id !== 'ghost' },
    );
    expect(restored.likes).toEqual(['t1']);
    expect(restored.follows).toEqual(fallback.follows);
    expect(restored.playlists).toHaveLength(1);
    expect(restored.playlists[0]?.trackIds).toEqual(['t1']);
    expect(restored.recents).toEqual([]);
  });
});
