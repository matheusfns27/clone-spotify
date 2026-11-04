import type { CSSProperties, ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import type { EntityRef } from '../data/types';
import { coverHue } from '../lib/cover';
import { usePlayer } from '../state/player-context';
import { Cover } from './Cover';

interface PageProps {
  /** Chave da capa; define o matiz do gradiente de cabeçalho. */
  coverKey: string;
  children: ReactNode;
  className?: string;
}

/** Contêiner de tela com o gradiente de cabeçalho derivado da capa. */
export function Page({ coverKey, children, className = '' }: PageProps) {
  return (
    <div className={`page ${className}`.trim()} style={{ '--hue': coverHue(coverKey) } as CSSProperties}>
      {children}
    </div>
  );
}

interface HeroProps {
  coverKey: string;
  round?: boolean;
  kind: string;
  title: string;
  children?: ReactNode;
}

/** Cabeçalho de álbum, artista, playlist ou curtidas: capa grande, tipo, título e detalhes. */
export function Hero({ coverKey, round = false, kind, title, children }: HeroProps) {
  return (
    <header className="hero">
      <Cover coverKey={coverKey} round={round} className="hero__cover" />
      <div className="hero__text">
        <p className="hero__kind">{kind}</p>
        <h1 className="hero__title">{title}</h1>
        {children && <div className="hero__meta">{children}</div>}
      </div>
    </header>
  );
}

/** Botão verde grande: toca a lista ou pausa/retoma se ela já estiver tocando. */
export function PlayAll({ ids, source, label }: { ids: readonly string[]; source?: EntityRef; label: string }) {
  const { trackId, playing, playTracks, togglePlay } = usePlayer();
  const active = trackId !== undefined && ids.includes(trackId);
  const showPause = active && playing;
  return (
    <button
      type="button"
      className="play-main play-main--big"
      aria-label={showPause ? `Pausar ${label}` : `Tocar ${label}`}
      disabled={ids.length === 0}
      onClick={() => (active ? togglePlay() : playTracks(ids, 'auto', source))}
    >
      {showPause ? <Pause aria-hidden="true" fill="currentColor" /> : <Play aria-hidden="true" fill="currentColor" />}
    </button>
  );
}
