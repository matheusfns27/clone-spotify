/** Barrinhas do "tocando agora". Animadas só quando está tocando e o usuário não pediu menos movimento (ver CSS). */
export function NowPlayingIcon({ playing }: { playing: boolean }) {
  return (
    <span className={`eq${playing ? ' eq--playing' : ''}`} aria-hidden="true" data-testid="eq">
      <span />
      <span />
      <span />
    </span>
  );
}
