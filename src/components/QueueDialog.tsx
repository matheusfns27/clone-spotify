import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { artistById, trackById } from '../data/catalog';
import { formatTime } from '../lib/format';
import { coverKeyFor } from '../lib/items';
import { useApp } from '../state/app-context';
import { usePlayer } from '../state/player-context';
import { Cover } from './Cover';
import { Modal } from './Modal';
import { NowPlayingIcon } from './NowPlayingIcon';

/** Fila visível e editável: tocando agora, a seguir (subir, descer, remover) e clique para pular. */
export function QueueDialog() {
  const { closeDialog } = useApp();
  const { queue, trackId, playing, removeFromQueue, moveInQueue, jumpTo } = usePlayer();
  const current = trackId ? trackById.get(trackId) : undefined;
  const upcoming = queue.items.map((id, position) => ({ id, position })).filter((entry) => entry.position > queue.index);

  return (
    <Modal labelledBy="queue-title" onClose={closeDialog}>
      <div className="dialog">
        <h2 id="queue-title" className="dialog__title">
          Fila de reprodução
        </h2>
        <h3 className="dialog__subtitle">Tocando agora</h3>
        {current ? (
          <div className="queue-row queue-row--current" aria-current="true">
            <Cover coverKey={coverKeyFor('album', current.albumId)} className="queue-row__cover" />
            <span className="queue-row__text">
              <span className="queue-row__title">{current.title}</span>
              <span className="queue-row__artist">{artistById.get(current.artistId)?.name}</span>
            </span>
            <NowPlayingIcon playing={playing} />
          </div>
        ) : (
          <p className="dialog__empty">Nada tocando.</p>
        )}
        <h3 className="dialog__subtitle">A seguir</h3>
        {upcoming.length === 0 ? (
          <p className="dialog__empty">Nada na fila a seguir. Use “Adicionar à fila” em qualquer faixa.</p>
        ) : (
          <ol className="queue-list" aria-label="A seguir">
            {upcoming.map(({ id, position }, order) => {
              const track = trackById.get(id);
              if (!track) return null;
              const queued = position <= queue.index + queue.queued;
              return (
                <li key={`${id}-${position}`} className="queue-row">
                  <button type="button" className="queue-row__jump" aria-label={`Tocar agora ${track.title}`} onClick={() => jumpTo(position)}>
                    <Cover coverKey={coverKeyFor('album', track.albumId)} className="queue-row__cover" />
                    <span className="queue-row__text">
                      <span className="queue-row__title">{track.title}</span>
                      <span className="queue-row__artist">
                        {artistById.get(track.artistId)?.name} • {formatTime(track.durationSec)}
                        {queued ? ' • adicionada por você' : ''}
                      </span>
                    </span>
                  </button>
                  <button type="button" className="btn-icon" aria-label={`Mover ${track.title} para cima`} disabled={order === 0} onClick={() => moveInQueue(position, position - 1)}>
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button type="button" className="btn-icon" aria-label={`Mover ${track.title} para baixo`} disabled={order === upcoming.length - 1} onClick={() => moveInQueue(position, position + 1)}>
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button type="button" className="btn-icon" aria-label={`Remover ${track.title} da fila`} onClick={() => removeFromQueue(position)}>
                    <X aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Modal>
  );
}
