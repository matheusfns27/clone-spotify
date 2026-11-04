import { createContext, useContext } from 'react';
import type { EntityRef } from '../data/types';
import type { QueueState, RepeatMode } from '../lib/queue';

export interface PlayerContextValue {
  queue: QueueState;
  /** Id da faixa atual (undefined com a fila vazia). */
  trackId: string | undefined;
  playing: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  /** Duração da faixa atual em segundos (a real do arquivo assim que carrega). */
  duration: number;
  /** Toca a lista a partir de `start` (ou de uma posição qualquer se for 'auto' com aleatório ligado). */
  playTracks: (ids: readonly string[], start: number | 'auto', source?: EntityRef) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  enqueue: (id: string) => void;
  removeFromQueue: (position: number) => void;
  moveInQueue: (from: number, to: number) => void;
  jumpTo: (position: number) => void;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);
/** Posição de reprodução em segundos, separada do resto para só quem mostra o tempo re-renderizar a cada tique. */
export const ProgressContext = createContext(0);

export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error('usePlayer fora do PlayerProvider');
  return value;
}

export function useProgress(): number {
  return useContext(ProgressContext);
}
