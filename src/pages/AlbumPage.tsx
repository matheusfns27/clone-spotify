import { Check, Plus } from 'lucide-react';
import { Hero, Page, PlayAll } from '../components/PageHero';
import { TrackList } from '../components/TrackList';
import { albumById, artistById, trackById } from '../data/catalog';
import { formatTotal, yearOf } from '../lib/format';
import { coverKeyFor } from '../lib/items';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { NotFound } from './NotFound';

export function AlbumPage({ id }: { id: string }) {
  const { isAlbumSaved, toggleAlbumSaved } = useApp();
  const album = albumById.get(id);
  if (!album) return <NotFound what="álbum" />;
  const artist = artistById.get(album.artistId);
  const total = album.trackIds.reduce((sum, trackId) => sum + (trackById.get(trackId)?.durationSec ?? 0), 0);
  const saved = isAlbumSaved(album.id);
  const key = coverKeyFor('album', album.id);

  return (
    <Page coverKey={key}>
      <Hero coverKey={key} kind="Álbum" title={album.title}>
        <a href={paths.artist(album.artistId)} className="hero__artist">
          {artist?.name}
        </a>
        <span> • {yearOf(album.releaseDate)} • {album.trackIds.length} músicas, {formatTotal(total)} • {album.genre}</span>
      </Hero>
      <div className="actions">
        <PlayAll ids={album.trackIds} source={{ kind: 'album', id: album.id }} label={album.title} />
        <button type="button" className="btn btn--outline" aria-pressed={saved} onClick={() => toggleAlbumSaved(album.id)}>
          {saved ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />} {saved ? 'Salvo na biblioteca' : 'Salvar na biblioteca'}
        </button>
      </div>
      <TrackList trackIds={album.trackIds} source={{ kind: 'album', id: album.id }} numbering="album" showCover={false} label={`Faixas de ${album.title}`} />
    </Page>
  );
}
