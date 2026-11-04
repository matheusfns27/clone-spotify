import { useState } from 'react';
import { Heart, Home, Library, Plus, Search, Settings } from 'lucide-react';
import { libraryItems } from '../lib/items';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { Cover } from './Cover';

const FILTERS = [
  { kind: 'playlist', label: 'Playlists' },
  { kind: 'album', label: 'Álbuns' },
  { kind: 'artist', label: 'Artistas' },
] as const;

/** Barra lateral do desktop: navegação principal e "Sua Biblioteca" rolável. */
export function Sidebar({ hash }: { hash: string }) {
  const { library, openDialog } = useApp();
  const [kinds, setKinds] = useState<string[]>([]);
  const current = hash || paths.home();
  const items = libraryItems(library).filter((item) => kinds.length === 0 || kinds.includes(item.kind));

  const toggleKind = (kind: string) => setKinds((list) => (list.includes(kind) ? list.filter((k) => k !== kind) : [...list, kind]));

  return (
    <aside className="sidebar">
      <nav className="panel sidebar__nav" aria-label="Principal">
        <a className="brand" href={paths.home()}>
          Clone Spotify
        </a>
        <ul>
          <li>
            <a className="nav-link" href={paths.home()} aria-current={current === '#/' || current === '#' ? 'page' : undefined}>
              <Home aria-hidden="true" /> Início
            </a>
          </li>
          <li>
            <a className="nav-link" href={paths.search()} aria-current={current.startsWith('#/buscar') ? 'page' : undefined}>
              <Search aria-hidden="true" /> Buscar
            </a>
          </li>
        </ul>
      </nav>
      <section className="panel sidebar__library" aria-labelledby="sidebar-library-title">
        <div className="sidebar__library-head">
          <a className="nav-link nav-link--title" id="sidebar-library-title" href={paths.library()} aria-current={current === '#/biblioteca' ? 'page' : undefined}>
            <Library aria-hidden="true" /> Sua Biblioteca
          </a>
          <button type="button" className="btn-icon" aria-label="Criar playlist" onClick={() => openDialog({ kind: 'create-playlist' })}>
            <Plus aria-hidden="true" />
          </button>
        </div>
        <div className="chips" role="group" aria-label="Filtrar a biblioteca">
          {FILTERS.map(({ kind, label }) => (
            <button key={kind} type="button" className="chip" aria-pressed={kinds.includes(kind)} onClick={() => toggleKind(kind)}>
              {label}
            </button>
          ))}
        </div>
        <ul className="sidebar__list" aria-label="Itens da sua biblioteca">
          <li>
            <a className="lib-item" href={paths.liked()} aria-current={current === '#/curtidas' ? 'page' : undefined}>
              <span className="lib-item__cover lib-item__cover--liked" aria-hidden="true">
                <Heart fill="currentColor" />
              </span>
              <span className="lib-item__text">
                <span className="lib-item__title">Músicas Curtidas</span>
                <span className="lib-item__subtitle">Playlist • {library.likes.length} músicas</span>
              </span>
            </a>
          </li>
          {items.map((item) => (
            <li key={item.key}>
              <a className="lib-item" href={item.href} aria-current={current === item.href ? 'page' : undefined}>
                <Cover coverKey={item.coverKey} round={item.kind === 'artist'} className="lib-item__cover" />
                <span className="lib-item__text">
                  <span className="lib-item__title">{item.title}</span>
                  <span className="lib-item__subtitle">{item.subtitle}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <a className="nav-link sidebar__settings" href={paths.settings()} aria-current={current === '#/configuracoes' ? 'page' : undefined}>
        <Settings aria-hidden="true" /> Configurações
      </a>
    </aside>
  );
}
