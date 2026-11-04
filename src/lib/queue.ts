export type RepeatMode = 'off' | 'all' | 'one';
export type Rand = () => number;

/**
 * Fila de reprodução. `items` é a ordem em que as faixas tocam; `index` é a atual.
 * `queued` conta quantas faixas logo após a atual foram adicionadas à mão ("Adicionar à fila").
 * `original` guarda a ordem sem embaralhar enquanto o aleatório está ligado (null = desligado).
 */
export interface QueueState {
  items: string[];
  index: number;
  queued: number;
  original: string[] | null;
}

export const EMPTY_QUEUE: QueueState = { items: [], index: 0, queued: 0, original: null };

/** Fisher–Yates: devolve uma cópia embaralhada (sem repetir nem perder itens). */
export function shuffled<T>(list: readonly T[], rand: Rand): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

export function currentId(queue: QueueState): string | undefined {
  return queue.items[queue.index];
}

/** Nova fila a partir de uma lista; com aleatório, a faixa escolhida vai primeiro e o resto é embaralhado. */
export function startQueue(ids: readonly string[], startIndex: number, shuffle: boolean, rand: Rand): QueueState {
  if (ids.length === 0) return EMPTY_QUEUE;
  const start = Math.min(Math.max(0, startIndex), ids.length - 1);
  if (!shuffle) return { items: [...ids], index: start, queued: 0, original: null };
  const first = ids[start] as string;
  const rest = ids.filter((_, i) => i !== start);
  return { items: [first, ...shuffled(rest, rand)], index: 0, queued: 0, original: [...ids] };
}

/** Liga/desliga o aleatório mantendo a faixa atual tocando. */
export function setShuffle(queue: QueueState, on: boolean, rand: Rand): QueueState {
  const current = currentId(queue);
  if (current === undefined) return queue;
  if (on) {
    if (queue.original) return queue;
    const rest = queue.items.filter((_, i) => i !== queue.index);
    return { items: [current, ...shuffled(rest, rand)], index: 0, queued: 0, original: [...queue.items] };
  }
  if (!queue.original) return queue;
  const position = queue.original.indexOf(current);
  return { items: [...queue.original], index: Math.max(0, position), queued: 0, original: null };
}

/**
 * Próxima faixa. No fim da fila: com "repetir todas" recomeça (embaralhando de novo se o aleatório estiver ligado,
 * então nada se repete até esgotar); caso contrário devolve null.
 */
export function next(queue: QueueState, repeat: RepeatMode, rand: Rand): QueueState | null {
  if (queue.items.length === 0) return null;
  if (queue.index < queue.items.length - 1) {
    return { ...queue, index: queue.index + 1, queued: Math.max(0, queue.queued - 1) };
  }
  if (repeat !== 'all') return null;
  if (queue.original) {
    let order = shuffled(queue.items, rand);
    // Evita que a última faixa toque duas vezes seguidas na virada da fila.
    const last = queue.items[queue.items.length - 1];
    if (order.length > 1 && order[0] === last) order = [...order.slice(1), order[0] as string];
    return { ...queue, items: order, index: 0, queued: 0 };
  }
  return { ...queue, index: 0, queued: 0 };
}

export function previous(queue: QueueState): QueueState {
  if (queue.index <= 0) return queue;
  return { ...queue, index: queue.index - 1, queued: 0 };
}

/** Pula para uma posição da fila. */
export function jumpTo(queue: QueueState, position: number): QueueState {
  if (position < 0 || position >= queue.items.length) return queue;
  const queued = position > queue.index ? Math.max(0, queue.queued - (position - queue.index)) : 0;
  return { ...queue, index: position, queued };
}

/** Insere logo depois da atual e das faixas já adicionadas antes (ordem de chegada). */
export function addToQueue(queue: QueueState, id: string): QueueState {
  if (queue.items.length === 0) return { items: [id], index: 0, queued: 0, original: null };
  const at = queue.index + 1 + queue.queued;
  const items = [...queue.items.slice(0, at), id, ...queue.items.slice(at)];
  return { ...queue, items, queued: queue.queued + 1, original: queue.original ? [...queue.original, id] : null };
}

/** Remove uma faixa da fila; a faixa atual não pode ser removida. */
export function removeAt(queue: QueueState, position: number): QueueState {
  if (position === queue.index || position < 0 || position >= queue.items.length) return queue;
  const id = queue.items[position];
  const items = queue.items.filter((_, i) => i !== position);
  let original = queue.original;
  if (original && id !== undefined) {
    const at = original.indexOf(id);
    original = at >= 0 ? original.filter((_, i) => i !== at) : original;
  }
  const inQueuedZone = position > queue.index && position <= queue.index + queue.queued;
  return {
    items,
    index: position < queue.index ? queue.index - 1 : queue.index,
    queued: inQueuedZone ? queue.queued - 1 : queue.queued,
    original,
  };
}

/** Move uma faixa que ainda vai tocar ("A seguir") para outra posição também depois da atual. */
export function moveItem(queue: QueueState, from: number, to: number): QueueState {
  const last = queue.items.length - 1;
  if (from <= queue.index || from > last) return queue;
  const target = Math.min(Math.max(to, queue.index + 1), last);
  if (target === from) return queue;
  const items = [...queue.items];
  const [moved] = items.splice(from, 1);
  items.splice(target, 0, moved as string);
  const wasQueued = from <= queue.index + queue.queued;
  const nowQueued = target <= queue.index + queue.queued;
  const queued = Math.min(Math.max(0, queue.queued + (nowQueued ? 1 : 0) - (wasQueued ? 1 : 0)), last - queue.index);
  return { ...queue, items, queued };
}

/** Descarta ids que não existem mais (por exemplo, faixa removida do catálogo) ao restaurar do armazenamento. */
export function sanitizeQueue(raw: unknown, isValid: (id: string) => boolean): QueueState {
  if (typeof raw !== 'object' || raw === null) return EMPTY_QUEUE;
  const value = raw as Partial<QueueState>;
  const strings = (list: unknown): string[] => (Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string' && isValid(x)) : []);
  const items = strings(value.items);
  if (items.length === 0) return EMPTY_QUEUE;
  const index = Number.isInteger(value.index) ? Math.min(Math.max(0, value.index as number), items.length - 1) : 0;
  const original = Array.isArray(value.original) ? strings(value.original) : null;
  const queued = Number.isInteger(value.queued) ? Math.min(Math.max(0, value.queued as number), items.length - 1 - index) : 0;
  return { items, index, queued, original: original && original.length > 0 ? original : null };
}
