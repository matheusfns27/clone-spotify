import { paths } from '../lib/route';

export const DISCLAIMER = 'Projeto de estudo, sem vínculo com o Spotify.';

/** Rodapé da área principal, com o aviso legal. */
export function Footer() {
  return (
    <footer className="footer">
      <p>{DISCLAIMER}</p>
      <p>
        Catálogo, artistas e áudio fictícios. <a href={paths.settings()}>Configurações</a>
      </p>
    </footer>
  );
}
