import { useEffect, useRef } from 'react';
import { Dialogs } from './components/Dialogs';
import { Footer } from './components/Footer';
import { FullPlayer } from './components/FullPlayer';
import { MobileNav } from './components/MobileNav';
import { MiniPlayer, PlayerBar } from './components/PlayerBars';
import { Sidebar } from './components/Sidebar';
import { albumById, artistById } from './data/catalog';
import { DESKTOP_QUERY, useMediaQuery } from './lib/useMediaQuery';
import type { Route } from './lib/route';
import { useRoute } from './lib/useRoute';
import { AlbumPage } from './pages/AlbumPage';
import { ArtistPage } from './pages/ArtistPage';
import { Home } from './pages/Home';
import { LibraryPage } from './pages/LibraryPage';
import { LikedPage } from './pages/LikedPage';
import { NotFound } from './pages/NotFound';
import { PlaylistPage } from './pages/PlaylistPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { useApp } from './state/app-context';

function renderRoute(route: Route) {
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'search':
      return <SearchPage query={route.query} />;
    case 'artist':
      return <ArtistPage id={route.id} />;
    case 'album':
      return <AlbumPage id={route.id} />;
    case 'playlist':
      return <PlaylistPage id={route.id} />;
    case 'library':
      return <LibraryPage />;
    case 'liked':
      return <LikedPage />;
    case 'settings':
      return <SettingsPage />;
    case 'notfound':
      return <NotFound />;
  }
}

function titleFor(route: Route, playlistTitle?: string): string {
  const base = 'Clone Spotify';
  switch (route.name) {
    case 'artist':
      return `${base} — ${artistById.get(route.id)?.name ?? 'Artista'}`;
    case 'album':
      return `${base} — ${albumById.get(route.id)?.title ?? 'Álbum'}`;
    case 'playlist':
      return `${base} — ${playlistTitle ?? 'Playlist'}`;
    case 'search':
      return `${base} — Buscar`;
    case 'library':
      return `${base} — Sua Biblioteca`;
    case 'liked':
      return `${base} — Músicas Curtidas`;
    case 'settings':
      return `${base} — Configurações`;
    default:
      return `${base} — projeto de estudo`;
  }
}

export default function App() {
  const { hash, route } = useRoute();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const { fullPlayerOpen, getPlaylist } = useApp();
  const mainRef = useRef<HTMLElement>(null);
  // A busca reescreve o hash a cada tecla; isso não deve devolver a rolagem ao topo.
  const scrollKey = route.name === 'search' ? '#/buscar' : hash;
  const playlistTitle = route.name === 'playlist' ? getPlaylist(route.id)?.title : undefined;

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [scrollKey]);

  useEffect(() => {
    document.title = titleFor(route, playlistTitle);
  }, [route, playlistTitle]);

  return (
    <div className="shell">
      {desktop && <Sidebar hash={hash} />}
      <main id="conteudo" className="main" ref={mainRef} tabIndex={-1}>
        {renderRoute(route)}
        <Footer />
      </main>
      {desktop ? (
        <PlayerBar />
      ) : (
        <div className="bottom">
          <MiniPlayer />
          <MobileNav hash={hash} />
        </div>
      )}
      <Dialogs />
      {!desktop && fullPlayerOpen && <FullPlayer />}
    </div>
  );
}
