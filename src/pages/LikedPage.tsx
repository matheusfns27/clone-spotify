import { useMemo } from 'react';
import { Hero, Page, PlayAll } from '../components/PageHero';
import { ItemBrowser } from '../components/ItemBrowser';
import { trackById } from '../data/catalog';
import { formatTotal } from '../lib/format';
import { trackItem, type ListItem } from '../lib/items';
import { useApp } from '../state/app-context';

export function LikedPage() {
  const { library } = useApp();
  const items = useMemo(() => library.likes.map(trackItem).filter((item): item is ListItem => item !== undefined), [library.likes]);
  const total = library.likes.reduce((sum, id) => sum + (trackById.get(id)?.durationSec ?? 0), 0);
  return (
    <Page coverKey="curtidas">
      <Hero coverKey="curtidas" kind="Playlist" title="Músicas Curtidas">
        <span>
          Você • {library.likes.length} músicas{library.likes.length > 0 ? `, ${formatTotal(total)}` : ''}
        </span>
      </Hero>
      <div className="actions">
        <PlayAll ids={library.likes} label="Músicas Curtidas" />
      </div>
      <ItemBrowser items={items} resetKey="curtidas" label="Músicas curtidas" emptyText="Você ainda não curtiu nenhuma música. Toque no coração de uma faixa para guardá-la aqui." />
    </Page>
  );
}
