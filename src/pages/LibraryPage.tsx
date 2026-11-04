import { Heart, Plus, Settings } from 'lucide-react';
import { ItemBrowser } from '../components/ItemBrowser';
import { libraryItems } from '../lib/items';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';

export function LibraryPage() {
  const { library, openDialog } = useApp();
  const items = libraryItems(library);
  return (
    <div className="page page--plain">
      <div className="page-head">
        <h1 className="section-title section-title--page">Sua Biblioteca</h1>
        <div className="page-head__actions">
          <button type="button" className="btn btn--outline" onClick={() => openDialog({ kind: 'create-playlist' })}>
            <Plus aria-hidden="true" /> Criar playlist
          </button>
          <a className="btn-icon" href={paths.settings()} aria-label="Configurações">
            <Settings aria-hidden="true" />
          </a>
        </div>
      </div>
      <a className="pinned" href={paths.liked()}>
        <span className="pinned__icon" aria-hidden="true">
          <Heart fill="currentColor" />
        </span>
        <span className="pinned__text">
          <span className="pinned__title">Músicas Curtidas</span>
          <span className="pinned__subtitle">Playlist • {library.likes.length} músicas</span>
        </span>
      </a>
      <ItemBrowser items={items} resetKey="biblioteca" label="Itens da biblioteca" emptyText="Nada na biblioteca com esses filtros." />
    </div>
  );
}
