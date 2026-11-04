import { createRandom } from '../lib/random';

type Gender = 'm' | 'f';

const NOUNS_F = [
  'estrada', 'lanterna', 'maré', 'janela', 'saudade', 'chuva', 'madrugada', 'varanda', 'poeira', 'semente',
  'ladeira', 'fumaça', 'cidade', 'ponte', 'brisa', 'centelha', 'vitrola', 'colina', 'manhã', 'nuvem',
  'faísca', 'estação', 'memória', 'rua', 'noite', 'onda', 'sombra', 'aurora', 'cantiga', 'luz',
];
const NOUNS_M = [
  'quintal', 'vento', 'rio', 'horizonte', 'sol', 'relógio', 'jardim', 'caminho', 'trem', 'farol',
  'telhado', 'verão', 'silêncio', 'portão', 'mar', 'cais', 'coração', 'barco', 'sertão', 'luar',
  'desvio', 'tempo', 'segredo', 'abraço', 'domingo', 'cheiro', 'céu', 'pedaço', 'outono', 'lamento',
];
/** [masculino, feminino] */
const ADJECTIVES: readonly (readonly [string, string])[] = [
  ['distante', 'distante'], ['dourado', 'dourada'], ['azul', 'azul'], ['lento', 'lenta'], ['antigo', 'antiga'],
  ['selvagem', 'selvagem'], ['escondido', 'escondida'], ['elétrico', 'elétrica'], ['pequeno', 'pequena'],
  ['vermelho', 'vermelha'], ['quieto', 'quieta'], ['doce', 'doce'], ['inteiro', 'inteira'], ['claro', 'clara'],
  ['breve', 'breve'], ['profundo', 'profunda'], ['manso', 'mansa'], ['perdido', 'perdida'],
];

interface Noun {
  word: string;
  gender: Gender;
}

const NOUNS: readonly Noun[] = [
  ...NOUNS_F.map((word): Noun => ({ word, gender: 'f' })),
  ...NOUNS_M.map((word): Noun => ({ word, gender: 'm' })),
];

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const article = (n: Noun) => (n.gender === 'f' ? 'a' : 'o');
const contraction = (n: Noun) => (n.gender === 'f' ? 'da' : 'do');

type Pick = <T>(list: readonly T[]) => T;

const TEMPLATES: readonly ((pick: Pick) => string)[] = [
  (pick) => {
    const n = pick(NOUNS);
    return `${n.word} ${pick(ADJECTIVES)[n.gender === 'f' ? 1 : 0]}`;
  },
  (pick) => `${pick(NOUNS).word} de ${pick(NOUNS).word}`,
  (pick) => {
    const n = pick(NOUNS);
    return `sem ${article(n)} ${n.word}`;
  },
  (pick) => `${pick(NOUNS).word} e ${pick(NOUNS).word}`,
  (pick) => {
    const n = pick(NOUNS);
    return `depois ${contraction(n)} ${n.word}`;
  },
  (pick) => {
    const n = pick(NOUNS);
    return `${article(n)} ${n.word} ${pick(ADJECTIVES)[n.gender === 'f' ? 1 : 0]}`;
  },
  (pick) => {
    const n = pick(NOUNS);
    return `volta ${contraction(n)} ${n.word}`;
  },
];

/**
 * Títulos de faixa determinísticos e únicos (o conjunto `used` é compartilhado entre os álbuns).
 * Quem chama passa um seed estável por álbum.
 */
export function makeTrackTitles(seed: number, count: number, used: Set<string>): string[] {
  const random = createRandom(seed);
  const pick: Pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)] as T;
  const titles: string[] = [];
  while (titles.length < count) {
    const template = TEMPLATES[Math.floor(random() * TEMPLATES.length)];
    if (!template) continue;
    const title = capitalize(template(pick));
    if (used.has(title)) continue;
    used.add(title);
    titles.push(title);
  }
  return titles;
}
