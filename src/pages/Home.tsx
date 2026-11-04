import { useMemo } from 'react';
import { Heart, Play } from 'lucide-react';
import { Carousel, EntityCard, usePlayEntity } from '../components/Carousel';
import { Cover } from '../components/Cover';
import { Page } from '../components/PageHero';
import { ALBUMS } from '../data/catalog';
import { greeting } from '../lib/greeting';
import { albumItem, artistItem, catalogPlaylistItems, libraryItems, userPlaylistItems, type ListItem } from '../lib/items';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { usePlayer } from '../state/player-context';

function Shortcut({ item }: { item: ListItem }) {
  const play = usePlayEntity();
  return (
    <li className="shortcut">
      <a className="shortcut__link" href={item.href}>
        <Cover coverKey={item.coverKey} round={item.kind === 'artist'} className="shortcut__cover" />
        <span className="shortcut__title">{item.title}</span>
      </a>
      <button type="button" className="shortcut__play" aria-label={`Tocar ${item.title}`} onClick={() => play(item.kind, item.id)}>
        <Play aria-hidden="true" fill="currentColor" />
      </button>
    </li>
  );
}

function LikedShortcut() {
  const { library } = useApp();
  const { playTracks } = usePlayer();
  return (
    <li className="shortcut">
      <a className="shortcut__link" href={paths.liked()}>
        <span className="shortcut__cover shortcut__cover--liked" aria-hidden="true">
          <Heart fill="currentColor" />
        </span>
        <span className="shortcut__title">Músicas Curtidas</span>
      </a>
      <button type="button" className="shortcut__play" aria-label="Tocar Músicas Curtidas" disabled={library.likes.length === 0} onClick={() => playTracks(library.likes, 'auto')}>
        <Play aria-hidden="true" fill="currentColor" />
      </button>
    </li>
  );
}

export function Home() {
  const { library } = useApp();
  const hello = useMemo(() => greeting(), []);

  const shortcuts = libraryItems(library).slice(0, 5);
  const forYou = [...userPlaylistItems(library.playlists), ...catalogPlaylistItems];
  const recents = library.recents
    .map((ref) => {
      if (ref.kind === 'playlist') return forYou.find((item) => item.id === ref.id);
      return ref.kind === 'album' ? albumItem(ref.id) : artistItem(ref.id);
    })
    .filter((item): item is ListItem => item !== undefined);
  const releases = [...ALBUMS]
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    .slice(0, 12)
    .map((album) => albumItem(album.id))
    .filter((item): item is ListItem => item !== undefined);

  return (
    <Page coverKey="home" className="page--home">
      <h1 className="greeting">{hello}</h1>
      <ul className="shortcuts" aria-label="Atalhos">
        <LikedShortcut />
        {shortcuts.map((item) => (
          <Shortcut key={item.key} item={item} />
        ))}
      </ul>
      <Carousel title="Feito para você" titleId="home-for-you">
        {forYou.map((item) => (
          <EntityCard key={item.key} item={item} />
        ))}
      </Carousel>
      <Carousel title="Tocados recentemente" titleId="home-recents">
        {recents.map((item) => (
          <EntityCard key={item.key} item={item} />
        ))}
      </Carousel>
      <Carousel title="Lançamentos" titleId="home-releases">
        {releases.map((item) => (
          <EntityCard key={item.key} item={item} />
        ))}
      </Carousel>
    </Page>
  );
}
