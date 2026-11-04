import { Check, Plus } from 'lucide-react';
import { Carousel, EntityCard } from '../components/Carousel';
import { Hero, Page, PlayAll } from '../components/PageHero';
import { TrackList } from '../components/TrackList';
import { ALBUMS, TRACKS, artistById } from '../data/catalog';
import { formatCount } from '../lib/format';
import { albumItem, coverKeyFor } from '../lib/items';
import { useApp } from '../state/app-context';
import { NotFound } from './NotFound';

export function ArtistPage({ id }: { id: string }) {
  const { isFollowing, toggleFollow } = useApp();
  const artist = artistById.get(id);
  if (!artist) return <NotFound what="artista" />;
  const following = isFollowing(artist.id);
  const key = coverKeyFor('artist', artist.id);
  const popular = TRACKS.filter((track) => track.artistId === artist.id)
    .sort((a, b) => b.plays - a.plays)
    .map((track) => track.id);
  const discography = ALBUMS.filter((album) => album.artistId === artist.id).sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  return (
    <Page coverKey={key}>
      <Hero coverKey={key} round kind="Artista" title={artist.name}>
        <span>{formatCount(artist.monthlyListeners)} ouvintes mensais • {artist.genre}</span>
      </Hero>
      <div className="actions">
        <PlayAll ids={popular} source={{ kind: 'artist', id: artist.id }} label={artist.name} />
        <button type="button" className="btn btn--outline" aria-pressed={following} onClick={() => toggleFollow(artist.id)}>
          {following ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />} {following ? 'Seguindo' : 'Seguir'}
        </button>
      </div>
      <section aria-labelledby="artist-popular">
        <h2 id="artist-popular" className="section-title">
          Populares
        </h2>
        <TrackList trackIds={popular} count={5} source={{ kind: 'artist', id: artist.id }} label={`Faixas populares de ${artist.name}`} />
      </section>
      <Carousel title="Discografia" titleId="artist-discography">
        {discography.map((album) => {
          const item = albumItem(album.id);
          return item ? <EntityCard key={album.id} item={item} /> : null;
        })}
      </Carousel>
      <section aria-labelledby="artist-about">
        <h2 id="artist-about" className="section-title">
          Sobre
        </h2>
        <p className="about">{artist.bio}</p>
        <p className="muted">{discography.length} {discography.length === 1 ? 'álbum' : 'álbuns'} no catálogo</p>
      </section>
    </Page>
  );
}
