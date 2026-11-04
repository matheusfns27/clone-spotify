import { useMemo, useSyncExternalStore } from 'react';
import { parseHash, type Route } from './route';

function subscribe(notify: () => void) {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
}

/** Hash atual (`#/album/x`) e a rota que ele representa. Voltar/avançar e recarregar preservam a tela. */
export function useRoute(): { hash: string; route: Route } {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  const route = useMemo(() => parseHash(hash), [hash]);
  return { hash, route };
}
