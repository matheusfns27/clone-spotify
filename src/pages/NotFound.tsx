import { paths } from '../lib/route';

export function NotFound({ what = 'página' }: { what?: string }) {
  return (
    <div className="page page--plain">
      <h1 className="section-title">Não encontramos esta {what}</h1>
      <p className="muted">O endereço pode estar errado ou o item não existe neste catálogo fictício.</p>
      <p>
        <a className="btn btn--primary" href={paths.home()}>
          Voltar ao início
        </a>
      </p>
    </div>
  );
}
