import { Heart } from 'lucide-react';
import { useApp } from '../state/app-context';

/** Botão de coração da faixa: curte/descurte e anuncia o estado (aria-pressed). */
export function LikeButton({ trackId, title, className = '' }: { trackId: string; title: string; className?: string }) {
  const { isLiked, toggleLike } = useApp();
  const liked = isLiked(trackId);
  return (
    <button
      type="button"
      className={`btn-icon like ${liked ? 'like--on' : ''} ${className}`.trim()}
      aria-pressed={liked}
      aria-label={liked ? `Remover ${title} das curtidas` : `Curtir ${title}`}
      onClick={(event) => {
        event.stopPropagation();
        toggleLike(trackId);
      }}
    >
      <Heart aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />
    </button>
  );
}
