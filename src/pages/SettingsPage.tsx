import { useState } from 'react';
import { DISCLAIMER } from '../components/Footer';
import { useApp } from '../state/app-context';

const SHORTCUTS: readonly (readonly [string, string])[] = [
  ['Espaço', 'Tocar ou pausar (fora de campos de texto)'],
  ['Shift + →', 'Próxima faixa'],
  ['Shift + ←', 'Faixa anterior (ou reinicia, se passou de 3 s)'],
  ['M', 'Silenciar ou ativar o som'],
];

export function SettingsPage() {
  const { resetData } = useApp();
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="page page--plain">
      <h1 className="section-title section-title--page">Configurações</h1>
      <section className="settings" aria-labelledby="about-title">
        <h2 id="about-title" className="settings__title">
          Sobre este projeto
        </h2>
        <p>
          <strong>{DISCLAIMER}</strong> As marcas citadas pertencem aos seus donos.
        </p>
        <p>
          Artistas, álbuns, faixas, playlists e capas são inventados e gerados por código. O áudio é instrumental, sintetizado do zero pelo script
          <code> scripts/gerar-audio.mjs</code>. Não há login, planos pagos nem coleta de dados: tudo fica no <code>localStorage</code> do seu navegador.
        </p>
      </section>
      <section className="settings" aria-labelledby="keys-title">
        <h2 id="keys-title" className="settings__title">
          Atalhos de teclado
        </h2>
        <dl className="shortcut-list">
          {SHORTCUTS.map(([keys, action]) => (
            <div key={keys} className="shortcut-list__row">
              <dt>
                <kbd>{keys}</kbd>
              </dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="settings" aria-labelledby="data-title">
        <h2 id="data-title" className="settings__title">
          Dados guardados no navegador
        </h2>
        <p>Curtidas, playlists, artistas seguidos, fila e posição da faixa. Restaurar apaga tudo isso e volta ao estado de demonstração.</p>
        {confirming ? (
          <div className="settings__confirm">
            <button type="button" className="btn btn--danger" onClick={resetData}>
              Sim, restaurar tudo
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--outline" onClick={() => setConfirming(true)}>
            Restaurar dados de demonstração
          </button>
        )}
      </section>
    </div>
  );
}
