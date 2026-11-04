import type { CSSProperties } from 'react';
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '../lib/format';
import { usePlayer, useProgress } from '../state/player-context';

const REPEAT_LABELS = { off: 'Repetir: desligado', all: 'Repetir: todas as faixas', one: 'Repetir: uma faixa' } as const;

/** Aleatório, anterior, play/pausa, próxima e repetir. */
export function TransportControls({ large = false }: { large?: boolean }) {
  const { trackId, playing, shuffle, repeat, togglePlay, next, previous, toggleShuffle, cycleRepeat } = usePlayer();
  const disabled = trackId === undefined;
  return (
    <div className={`transport${large ? ' transport--large' : ''}`} role="group" aria-label="Controles do player">
      <button type="button" className={`btn-icon toggle${shuffle ? ' toggle--on' : ''}`} aria-label="Aleatório" aria-pressed={shuffle} onClick={toggleShuffle}>
        <Shuffle aria-hidden="true" />
      </button>
      <button type="button" className="btn-icon" aria-label="Anterior" disabled={disabled} onClick={previous}>
        <SkipBack aria-hidden="true" fill="currentColor" />
      </button>
      <button type="button" className="play-main" aria-label={playing ? 'Pausar' : 'Tocar'} disabled={disabled} onClick={togglePlay}>
        {playing ? <Pause aria-hidden="true" fill="currentColor" /> : <Play aria-hidden="true" fill="currentColor" />}
      </button>
      <button type="button" className="btn-icon" aria-label="Próxima" disabled={disabled} onClick={next}>
        <SkipForward aria-hidden="true" fill="currentColor" />
      </button>
      <button type="button" className={`btn-icon toggle${repeat !== 'off' ? ' toggle--on' : ''}`} aria-label={REPEAT_LABELS[repeat]} aria-pressed={repeat !== 'off'} onClick={cycleRepeat}>
        {repeat === 'one' ? <Repeat1 aria-hidden="true" /> : <Repeat aria-hidden="true" />}
      </button>
    </div>
  );
}

/** Barra de progresso arrastável com os tempos. */
export function ProgressBar() {
  const { trackId, duration, seek } = usePlayer();
  const time = useProgress();
  const max = Math.max(duration, 1);
  const value = Math.min(time, max);
  return (
    <div className="progress">
      <span className="progress__time" aria-hidden="true">
        {formatTime(value)}
      </span>
      <input
        type="range"
        className="slider"
        aria-label="Progresso da faixa"
        aria-valuetext={`${formatTime(value)} de ${formatTime(duration)}`}
        min={0}
        max={max}
        step={0.1}
        value={value}
        disabled={trackId === undefined}
        style={{ '--fill': `${(value / max) * 100}%` } as CSSProperties}
        onChange={(event) => seek(Number(event.target.value))}
      />
      <span className="progress__time" aria-hidden="true">
        {formatTime(duration)}
      </span>
    </div>
  );
}

/** Mudo e volume. */
export function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;
  return (
    <div className="volume">
      <button type="button" className="btn-icon" aria-label={muted ? 'Ativar o som' : 'Silenciar'} aria-pressed={muted} onClick={toggleMute}>
        <Icon aria-hidden="true" />
      </button>
      <input
        type="range"
        className="slider"
        aria-label="Volume"
        min={0}
        max={1}
        step={0.01}
        value={level}
        style={{ '--fill': `${level * 100}%` } as CSSProperties}
        onChange={(event) => setVolume(Number(event.target.value))}
      />
    </div>
  );
}
