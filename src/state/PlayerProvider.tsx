import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { albumById, artistById, trackById } from '../data/catalog';
import type { EntityRef, Track } from '../data/types';
import { coverUrl } from '../lib/cover';
import { coverKeyFor } from '../lib/items';
import {
  addToQueue,
  currentId,
  jumpTo as jumpToIn,
  moveItem,
  next as nextIn,
  previous as previousIn,
  removeAt,
  sanitizeQueue,
  setShuffle,
  startQueue,
  type QueueState,
  type RepeatMode,
} from '../lib/queue';
import { loadJson, saveJson } from '../lib/storage';
import { useApp } from './app-context';
import { PlayerContext, ProgressContext, type PlayerContextValue } from './player-context';

const STORAGE_KEY = 'player';
/** Depois de tantos segundos, "anterior" reinicia a faixa em vez de voltar para a anterior. */
const RESTART_THRESHOLD = 3;

interface StoredPlayer {
  queue: unknown;
  shuffle: unknown;
  repeat: unknown;
  volume: unknown;
  muted: unknown;
  position: unknown;
}

export const audioUrl = (track: Track) => `${import.meta.env.BASE_URL}audio/${track.audioFile}`;

function restore() {
  const stored = loadJson<Partial<StoredPlayer>>(STORAGE_KEY, {});
  const queue = sanitizeQueue(stored.queue, (id) => trackById.has(id));
  const repeat: RepeatMode = stored.repeat === 'all' || stored.repeat === 'one' ? stored.repeat : 'off';
  const volume = typeof stored.volume === 'number' && stored.volume >= 0 && stored.volume <= 1 ? stored.volume : 0.8;
  const position = typeof stored.position === 'number' && stored.position >= 0 ? stored.position : 0;
  return { queue, shuffle: stored.shuffle === true, repeat, volume, muted: stored.muted === true, position };
}

/** Player único do app: um `<audio>`, a fila, o estado persistido, a Media Session e os atalhos de teclado. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const { pushRecent } = useApp();
  const [initial] = useState(restore);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [queue, setQueueState] = useState<QueueState>(initial.queue);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffleState] = useState(initial.shuffle);
  const [repeat, setRepeat] = useState<RepeatMode>(initial.repeat);
  const [volume, setVolumeState] = useState(initial.volume);
  const [muted, setMuted] = useState(initial.muted);
  const [time, setTime] = useState(initial.position);
  const [duration, setDuration] = useState(0);
  /** Muda sempre que a faixa atual precisa ser (re)carregada no `<audio>`. */
  const [loadToken, setLoadToken] = useState(0);

  const queueRef = useRef(queue);
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const autoplayRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(initial.position > 0 ? initial.position : null);
  const positionRef = useRef(initial.position);
  const lastSavedRef = useRef(0);
  const playingRef = useRef(false);

  const trackId = currentId(queue);
  const track = trackId ? trackById.get(trackId) : undefined;

  const setQueue = useCallback((next: QueueState) => {
    queueRef.current = next;
    setQueueState(next);
  }, []);

  /** Troca a fila e manda carregar a faixa atual; `autoplay` decide se já toca. */
  const commit = useCallback(
    (next: QueueState, autoplay: boolean) => {
      setQueue(next);
      autoplayRef.current = autoplay;
      pendingSeekRef.current = null;
      positionRef.current = 0;
      setLoadToken((n) => n + 1);
    },
    [setQueue],
  );

  // Carrega a faixa atual no <audio> sempre que o token muda (inclui a restauração depois de recarregar, sem autoplay).
  useEffect(() => {
    const audio = audioRef.current;
    const id = currentId(queueRef.current);
    const current = id ? trackById.get(id) : undefined;
    if (!audio || !current) return;
    const url = audioUrl(current);
    if (audio.getAttribute('src') !== url) audio.src = url;
    else if (pendingSeekRef.current === null) audio.currentTime = 0;
    setDuration(current.durationSec);
    setTime(pendingSeekRef.current ?? 0);
    if (autoplayRef.current) {
      audio.play().catch(() => setPlaying(false));
    }
  }, [loadToken]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  const persist = useCallback(() => {
    saveJson(STORAGE_KEY, {
      queue: queueRef.current,
      shuffle: shuffleRef.current,
      repeat: repeatRef.current,
      volume: audioRef.current?.volume ?? 0.8,
      muted: audioRef.current?.muted ?? false,
      position: positionRef.current,
    });
  }, []);

  useEffect(() => {
    shuffleRef.current = shuffle;
    repeatRef.current = repeat;
    persist();
  }, [queue, shuffle, repeat, volume, muted, persist]);

  useEffect(() => {
    window.addEventListener('pagehide', persist);
    return () => window.removeEventListener('pagehide', persist);
  }, [persist]);

  const playTracks = useCallback<PlayerContextValue['playTracks']>(
    (ids, start, source) => {
      if (ids.length === 0) return;
      const startIndex = start === 'auto' ? (shuffleRef.current ? Math.floor(Math.random() * ids.length) : 0) : start;
      commit(startQueue(ids, startIndex, shuffleRef.current, Math.random), true);
      if (source) pushRecent(source as EntityRef);
    },
    [commit, pushRecent],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentId(queueRef.current)) return;
    if (audio.paused) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  const next = useCallback(() => {
    const result = nextIn(queueRef.current, repeatRef.current, Math.random);
    if (result) {
      commit(result, true);
      return;
    }
    // Fim da fila sem repetir: volta ao começo da última faixa, parada.
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    positionRef.current = 0;
    setTime(0);
  }, [commit]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    const queueNow = queueRef.current;
    if ((audio && audio.currentTime > RESTART_THRESHOLD) || queueNow.index === 0) {
      if (audio) audio.currentTime = 0;
      return;
    }
    commit(previousIn(queueNow), playingRef.current);
  }, [commit]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    audio.currentTime = Math.max(0, seconds);
    positionRef.current = audio.currentTime;
    setTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(Math.min(1, Math.max(0, value)));
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const toggleShuffle = useCallback(() => {
    const on = !shuffleRef.current;
    shuffleRef.current = on;
    setShuffleState(on);
    setQueue(setShuffle(queueRef.current, on, Math.random));
  }, [setQueue]);

  const cycleRepeat = useCallback(() => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')), []);

  const enqueue = useCallback(
    (id: string) => {
      const empty = queueRef.current.items.length === 0;
      const result = addToQueue(queueRef.current, id);
      if (empty) commit(result, false);
      else setQueue(result);
    },
    [commit, setQueue],
  );

  const removeFromQueue = useCallback((position: number) => setQueue(removeAt(queueRef.current, position)), [setQueue]);
  const moveInQueue = useCallback((from: number, to: number) => setQueue(moveItem(queueRef.current, from, to)), [setQueue]);
  const jumpTo = useCallback(
    (position: number) => {
      const result = jumpToIn(queueRef.current, position);
      if (result !== queueRef.current) commit(result, true);
    },
    [commit],
  );

  // Eventos do <audio>.
  const handleEnded = () => {
    const audio = audioRef.current;
    if (repeatRef.current === 'one' && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => setPlaying(false));
      return;
    }
    const result = nextIn(queueRef.current, repeatRef.current, Math.random);
    if (result) {
      commit(result, true);
    } else {
      setPlaying(false);
      playingRef.current = false;
      positionRef.current = 0;
      setTime(0);
      if (audio) audio.currentTime = 0;
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    positionRef.current = audio.currentTime;
    setTime(audio.currentTime);
    const now = Date.now();
    if (now - lastSavedRef.current > 1000) {
      lastSavedRef.current = now;
      persist();
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    if (pendingSeekRef.current !== null) {
      audio.currentTime = Math.min(pendingSeekRef.current, Math.max(0, audio.duration - 0.5));
      pendingSeekRef.current = null;
    }
  };

  // Media Session: metadados, estado e botões do sistema (fones, tela de bloqueio, teclas de mídia).
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: artistById.get(track.artistId)?.name ?? '',
      album: albumById.get(track.albumId)?.title ?? '',
      artwork: [{ src: coverUrl(coverKeyFor('album', track.albumId)), sizes: '300x300', type: 'image/svg+xml' }],
    });
  }, [track]);

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);

  const controlsRef = useRef({ togglePlay, next, previous, seek });
  useEffect(() => {
    controlsRef.current = { togglePlay, next, previous, seek };
  });

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => controlsRef.current.togglePlay()],
      ['pause', () => controlsRef.current.togglePlay()],
      ['previoustrack', () => controlsRef.current.previous()],
      ['nexttrack', () => controlsRef.current.next()],
      ['seekto', (details) => controlsRef.current.seek(details.seekTime ?? 0)],
      ['seekbackward', () => controlsRef.current.seek((audioRef.current?.currentTime ?? 0) - 10)],
      ['seekforward', () => controlsRef.current.seek((audioRef.current?.currentTime ?? 0) + 10)],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Ação não suportada neste navegador.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // idem
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration || !Number.isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: Math.min(time, duration) });
    } catch {
      // Valores fora do intervalo são ignorados.
    }
    // Atualiza só quando a faixa muda ou o usuário pula, não a cada tique.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, loadToken, playing]);

  // Atalhos de teclado: espaço (fora de campos de texto e botões), Shift+setas e M.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing = tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable === true || (tag === 'INPUT' && (target as HTMLInputElement).type !== 'range');
      if (typing) return;
      if (event.code === 'Space' || event.key === ' ') {
        // Em botões, links e opções o espaço mantém o comportamento nativo (ativar).
        if (tag === 'BUTTON' || tag === 'A' || target?.getAttribute('role') === 'option') return;
        event.preventDefault();
        controlsRef.current.togglePlay();
      } else if (event.shiftKey && event.key === 'ArrowRight') {
        event.preventDefault();
        controlsRef.current.next();
      } else if (event.shiftKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        controlsRef.current.previous();
      } else if (!event.shiftKey && event.key.toLowerCase() === 'm') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleMute]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      trackId,
      playing,
      shuffle,
      repeat,
      volume,
      muted,
      duration: duration || track?.durationSec || 0,
      playTracks,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      enqueue,
      removeFromQueue,
      moveInQueue,
      jumpTo,
    }),
    [queue, trackId, playing, shuffle, repeat, volume, muted, duration, track, playTracks, togglePlay, next, previous, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat, enqueue, removeFromQueue, moveInQueue, jumpTo],
  );

  return (
    <PlayerContext.Provider value={value}>
      <ProgressContext.Provider value={time}>{children}</ProgressContext.Provider>
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => {
          playingRef.current = true;
          setPlaying(true);
        }}
        onPause={() => {
          playingRef.current = false;
          setPlaying(false);
        }}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => setPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}
