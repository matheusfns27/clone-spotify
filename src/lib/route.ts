export type Route =
  | { name: 'home' }
  | { name: 'search'; query: string }
  | { name: 'artist'; id: string }
  | { name: 'album'; id: string }
  | { name: 'playlist'; id: string }
  | { name: 'library' }
  | { name: 'liked' }
  | { name: 'settings' }
  | { name: 'notfound' };

/** Links do app (hash router: o GitHub Pages não precisa de rota no servidor). */
export const paths = {
  home: () => '#/',
  search: (query = '') => (query ? `#/buscar/${encodeURIComponent(query)}` : '#/buscar'),
  artist: (id: string) => `#/artista/${encodeURIComponent(id)}`,
  album: (id: string) => `#/album/${encodeURIComponent(id)}`,
  playlist: (id: string) => `#/playlist/${encodeURIComponent(id)}`,
  library: () => '#/biblioteca',
  liked: () => '#/curtidas',
  settings: () => '#/configuracoes',
};

/** Vai para outra tela (muda o hash; voltar/avançar do navegador continuam funcionando). */
export function navigate(hash: string): void {
  window.location.hash = hash;
}

function decode(part: string | undefined): string {
  if (!part) return '';
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

/** Converte `location.hash` na rota atual; qualquer coisa desconhecida vira `notfound`. */
export function parseHash(hash: string): Route {
  const [first, second] = hash.replace(/^#\/?/, '').split('/');
  switch (first) {
    case undefined:
    case '':
      return { name: 'home' };
    case 'buscar':
      return { name: 'search', query: decode(second) };
    case 'artista':
    case 'album':
    case 'playlist': {
      const id = decode(second);
      if (!id) return { name: 'notfound' };
      return { name: first === 'artista' ? 'artist' : first, id };
    }
    case 'biblioteca':
      return { name: 'library' };
    case 'curtidas':
      return { name: 'liked' };
    case 'configuracoes':
      return { name: 'settings' };
    default:
      return { name: 'notfound' };
  }
}
