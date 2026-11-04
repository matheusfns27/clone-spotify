import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  /** Id do elemento com o título (nome acessível). */
  labelledBy: string;
  onClose: () => void;
  /** Classe extra para variações (ex.: player em tela cheia). */
  className?: string;
  children: ReactNode;
}

/**
 * `<dialog>` nativo aberto com showModal(): foco preso, Esc e clique fora fecham (closedby="any").
 * O estado do pai acompanha o evento `close`. Monte o componente só enquanto o modal deve existir.
 */
export function Modal({ labelledBy, onClose, className, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    // O primeiro foco cairia no botão de fechar; quem marcar `data-autofocus` recebe o foco no lugar.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    const handleClose = () => onCloseRef.current();
    dialog.addEventListener('close', handleClose);

    // Safari ainda não implementa closedby: clique no backdrop fecha à mão.
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const dentro =
        r.top <= event.clientY && event.clientY <= r.top + r.height && r.left <= event.clientX && event.clientX <= r.left + r.width;
      if (!dentro) dialog.close();
    };
    if (!('closedBy' in HTMLDialogElement.prototype)) dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleBackdropClick);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog ref={ref} className={className ? `modal ${className}` : 'modal'} aria-labelledby={labelledBy} {...{ closedby: 'any' }}>
      <button type="button" className="modal__close btn-icon" aria-label="Fechar" onClick={() => ref.current?.close()}>
        <X aria-hidden="true" />
      </button>
      {children}
    </dialog>
  );
}
