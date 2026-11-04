import { useSyncExternalStore } from 'react';

/** `true` enquanto a media query casa (acompanha redimensionamento e rotação). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Largura a partir da qual o layout vira desktop (barra lateral + player fixo embaixo). */
export const DESKTOP_QUERY = '(min-width: 64rem)';
