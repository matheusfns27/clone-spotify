import { Pencil, Trash2 } from 'lucide-react';
import { Hero, Page, PlayAll } from '../components/PageHero';
import { TrackList } from '../components/TrackList';
import { trackById } from '../data/catalog';
import { formatTotal } from '../lib/format';
import { coverKeyFor } from '../lib/items';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';
import { NotFound } from './NotFound';

export function PlaylistPage({ id }: { id: string }) {
  const { getPlaylist, openDialog } = useApp();
  const playlist = getPlaylist(id);
  if (!playlist) return <NotFound what="playlist" />;
  const total = playlist.trackIds.reduce((sum, trackId) => sum + (trackById.get(trackId)?.durationSec ?? 0), 0);
  const key = coverKeyFor('playlist', playlist.id);

  return (
    <Page coverKey={key}>
      <Hero coverKey={key} kind="Playlist" title={playlist.title}>
        {playlist.description && <span>{playlist.description} </span>}
        <span>
          {playlist.user ? 'Criada por você' : 'Curadoria fictícia'} • {playlist.trackIds.length} músicas, {formatTotal(total)}
        </span>
      </Hero>
      <div className="actions">
        <PlayAll ids={playlist.trackIds} source={{ kind: 'playlist', id: playlist.id }} label={playlist.title} />
        {playlist.user && (
          <>
            <button type="button" className="btn btn--outline" onClick={() => openDialog({ kind: 'rename-playlist', id: playlist.id })}>
              <Pencil aria-hidden="true" /> Renomear
            </button>
            <button type="button" className="btn btn--outline btn--danger-outline" onClick={() => openDialog({ kind: 'delete-playlist', id: playlist.id })}>
              <Trash2 aria-hidden="true" /> Apagar
            </button>
          </>
        )}
      </div>
      {playlist.trackIds.length === 0 ? (
        <div className="empty">
          <p>Esta playlist está vazia.</p>
          <p>
            Use “Mais opções” em qualquer faixa para adicioná-la aqui, ou <a href={paths.search()}>busque músicas</a>.
          </p>
        </div>
      ) : (
        <TrackList
          trackIds={playlist.trackIds}
          source={{ kind: 'playlist', id: playlist.id }}
          fromPlaylist={playlist.user ? playlist.id : undefined}
          label={`Faixas de ${playlist.title}`}
        />
      )}
    </Page>
  );
}
