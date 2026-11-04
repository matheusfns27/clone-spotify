import { describe, expect, it } from 'vitest';
import { createRandom } from './random';
import { addToQueue, currentId, jumpTo, moveItem, next, previous, removeAt, sanitizeQueue, setShuffle, shuffled, startQueue } from './queue';

const ids = ['a', 'b', 'c', 'd', 'e'];
const rand = () => createRandom(42);

describe('startQueue', () => {
  it('sem aleatório mantém a ordem e começa na faixa pedida', () => {
    const q = startQueue(ids, 2, false, rand());
    expect(q.items).toEqual(ids);
    expect(currentId(q)).toBe('c');
    expect(q.original).toBeNull();
  });
  it('com aleatório a faixa escolhida toca primeiro e nada se perde', () => {
    const q = startQueue(ids, 3, true, rand());
    expect(currentId(q)).toBe('d');
    expect([...q.items].sort()).toEqual(ids);
    expect(q.original).toEqual(ids);
  });
  it('lista vazia devolve fila vazia', () => {
    expect(startQueue([], 0, false, rand()).items).toEqual([]);
  });
});

describe('shuffled', () => {
  it('é uma permutação e não altera a entrada', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffled(input, rand());
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('next', () => {
  it('aleatório não repete faixa até esgotar a fila', () => {
    const many = Array.from({ length: 30 }, (_, i) => `t${i}`);
    let q = startQueue(many, 0, true, rand());
    const heard = [currentId(q)];
    for (let i = 0; i < many.length - 1; i++) {
      const following = next(q, 'off', rand());
      expect(following).not.toBeNull();
      q = following as typeof q;
      heard.push(currentId(q));
    }
    expect(new Set(heard).size).toBe(many.length);
    expect(next(q, 'off', rand())).toBeNull();
  });
  it('repetir "todas" recomeça no fim; "desligado" para', () => {
    const last = startQueue(ids, 4, false, rand());
    expect(next(last, 'off', rand())).toBeNull();
    const wrapped = next(last, 'all', rand());
    expect(wrapped && currentId(wrapped)).toBe('a');
  });
  it('repetir "todas" com aleatório embaralha de novo sem perder faixas nem repetir a última de cara', () => {
    const q = startQueue(ids, 0, true, rand());
    const end = { ...q, index: q.items.length - 1 };
    const wrapped = next(end, 'all', rand());
    expect(wrapped).not.toBeNull();
    if (!wrapped) return;
    expect([...wrapped.items].sort()).toEqual(ids);
    expect(wrapped.index).toBe(0);
    expect(currentId(wrapped)).not.toBe(end.items[end.items.length - 1]);
  });
  it('avança uma posição no meio da fila', () => {
    const following = next(startQueue(ids, 0, false, rand()), 'one', rand());
    expect(following && currentId(following)).toBe('b');
  });
});

describe('previous e jumpTo', () => {
  it('previous não passa do início', () => {
    expect(previous(startQueue(ids, 0, false, rand())).index).toBe(0);
    expect(previous(startQueue(ids, 3, false, rand())).index).toBe(2);
  });
  it('jumpTo ignora posição inválida', () => {
    const q = startQueue(ids, 0, false, rand());
    expect(jumpTo(q, 9)).toBe(q);
    expect(jumpTo(q, 3).index).toBe(3);
  });
});

describe('setShuffle', () => {
  it('ligar mantém a faixa atual; desligar volta à ordem original na mesma faixa', () => {
    const q = startQueue(ids, 2, false, rand());
    const on = setShuffle(q, true, rand());
    expect(currentId(on)).toBe('c');
    expect(on.index).toBe(0);
    const off = setShuffle(on, false, rand());
    expect(off.items).toEqual(ids);
    expect(currentId(off)).toBe('c');
  });
});

describe('edição da fila', () => {
  it('"adicionar à fila" entra depois da atual, na ordem de chegada', () => {
    let q = startQueue(ids, 0, false, rand());
    q = addToQueue(q, 'x');
    q = addToQueue(q, 'y');
    expect(q.items).toEqual(['a', 'x', 'y', 'b', 'c', 'd', 'e']);
    expect(q.queued).toBe(2);
    const following = next(q, 'off', rand());
    expect(following && currentId(following)).toBe('x');
    expect(following?.queued).toBe(1);
  });
  it('fila vazia: a faixa adicionada vira a atual', () => {
    expect(currentId(addToQueue(startQueue([], 0, false, rand()), 'z'))).toBe('z');
  });
  it('remove só o que está fora da atual e acerta o índice', () => {
    const q = startQueue(ids, 2, false, rand());
    expect(removeAt(q, 2)).toBe(q);
    const before = removeAt(q, 0);
    expect(before.items).toEqual(['b', 'c', 'd', 'e']);
    expect(currentId(before)).toBe('c');
    expect(removeAt(q, 4).items).toEqual(['a', 'b', 'c', 'd']);
  });
  it('remover item adicionado à mão reduz o contador', () => {
    const q = addToQueue(startQueue(ids, 0, false, rand()), 'x');
    expect(removeAt(q, 1).queued).toBe(0);
  });
  it('reordena apenas faixas que ainda vão tocar', () => {
    const q = startQueue(ids, 1, false, rand());
    expect(moveItem(q, 1, 3)).toBe(q);
    expect(moveItem(q, 2, 4).items).toEqual(['a', 'b', 'd', 'e', 'c']);
    expect(moveItem(q, 4, 0).items).toEqual(['a', 'b', 'e', 'c', 'd']);
  });
});

describe('sanitizeQueue', () => {
  it('descarta ids inválidos e lixo', () => {
    expect(sanitizeQueue(null, () => true).items).toEqual([]);
    const q = sanitizeQueue({ items: ['a', 'zz', 'b'], index: 9, queued: 5, original: null }, (id) => id !== 'zz');
    expect(q.items).toEqual(['a', 'b']);
    expect(q.index).toBe(1);
    expect(q.queued).toBe(0);
  });
});
