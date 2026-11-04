import { useMemo, useState, type CSSProperties } from 'react';
import { Search } from 'lucide-react';
import { Cover } from '../components/Cover';
import { ItemBrowser } from '../components/ItemBrowser';
import { GENRES } from '../data/catalog';
import { searchItems } from '../lib/items';
import { hashString } from '../lib/random';
import { paths } from '../lib/route';
import { useApp } from '../state/app-context';

export function SearchPage({ query }: { query: string }) {
  const { userPlaylists } = useApp();
  const [text, setText] = useState(query);
  const [seenQuery, setSeenQuery] = useState(query);
  // Voltar/avançar (ou clicar num cartão de gênero) muda a rota: o campo acompanha.
  // Digitar só reescreve o hash, sem criar entrada no histórico, e não deve ser desfeito por isso.
  if (query !== seenQuery) {
    setSeenQuery(query);
    if (query !== text.trim()) setText(query);
  }

  const results = useMemo(() => searchItems(text, userPlaylists), [text, userPlaylists]);
  const term = text.trim();

  return (
    <div className="page page--plain page--search">
      <label className="searchbox">
        <Search aria-hidden="true" />
        <input
          type="search"
          aria-label="O que você quer ouvir?"
          placeholder="O que você quer ouvir?"
          value={text}
          autoComplete="off"
          onChange={(event) => {
            const value = event.target.value;
            setText(value);
            window.history.replaceState(null, '', paths.search(value.trim()));
          }}
        />
      </label>
      {term === '' ? (
        <section aria-labelledby="genres-title">
          <h2 id="genres-title" className="section-title">
            Navegar por todas as seções
          </h2>
          <ul className="genres">
            {GENRES.map((genre) => (
              <li key={genre}>
                <a className="genre-card" href={paths.search(genre)} style={{ '--hue': hashString(`genero:${genre}`) % 360 } as CSSProperties}>
                  <span className="genre-card__name">{genre}</span>
                  <Cover coverKey={`genero:${genre}`} className="genre-card__art" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="results-title">
          <h2 id="results-title" className="section-title">
            Resultados para “{term}”
          </h2>
          <ItemBrowser items={results} resetKey={term} label="Resultados da busca" emptyText={`Nada encontrado para “${term}”. Confira a escrita ou tente outro termo.`} />
        </section>
      )}
    </div>
  );
}
