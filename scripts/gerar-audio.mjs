#!/usr/bin/env node
/**
 * Sintetiza as faixas instrumentais do projeto, do zero, sem nenhum material de terceiros.
 *
 * Cada faixa tem escala, progressão de acordes, andamento e compasso próprios. O som vem de síntese aditiva:
 * pad (acordes), baixo, melodia "pluck" gerada por seed e bateria simples (bumbo, caixa e chimbal de ruído),
 * com um reverb curto. O resultado é codificado em MP3 pelo ffmpeg e a duração real de cada arquivo (ffprobe)
 * vai para `src/data/audio.generated.ts`, que o catálogo usa.
 *
 * Uso: `npm run audio` (precisa de `ffmpeg` e `ffprobe` no PATH). A saída é determinística quanto às notas.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pastaAudio = join(raiz, 'public', 'audio');
const SR = 44100;
const BITRATE = '80k';

const ESCALAS = {
  maior: [0, 2, 4, 5, 7, 9, 11],
  menor: [0, 2, 3, 5, 7, 8, 10],
  dorico: [0, 2, 3, 5, 7, 9, 10],
  mixolidio: [0, 2, 4, 5, 7, 9, 10],
  pentatonica: [0, 3, 5, 7, 10],
};

// Bateria em semicolcheias ('x' = golpe forte, 'o' = golpe leve). 16 passos em 4/4, 12 em 3/4.
const BATERIAS = {
  basica: { bumbo: 'x.......x.......', caixa: '....x.......x...', chimbal: 'o.o.o.o.o.o.o.o.' },
  suave: { bumbo: 'x.........o.....', caixa: '....o.......o...', chimbal: '..o...o...o...o.' },
  casa: { bumbo: 'x...x...x...x...', caixa: '....o.......o...', chimbal: '..o...o...o...o.' },
  shuffle: { bumbo: 'x.....x.x.......', caixa: '....x.......x...', chimbal: 'o.oo.oo.oo.oo.oo' },
  bossa: { bumbo: 'x..x..x...x..x..', caixa: '..o...o...o...o.', chimbal: 'o.o.o.o.o.o.o.o.' },
  rock: { bumbo: 'x...x.x.x...x.x.', caixa: '....x.......x...', chimbal: 'x.x.x.x.x.x.x.x.' },
  valsa: { bumbo: 'x...........', caixa: '....o...o...', chimbal: 'o...o...o...' },
  baiao: { bumbo: 'x..x..x...x.x...', caixa: '....o..o....o..o', chimbal: 'o.o.o.o.o.o.o.o.' },
  nenhuma: { bumbo: '', caixa: '', chimbal: '' },
};

// 10 faixas, todas diferentes entre si. `alvo` é a duração desejada em segundos (o número de compassos é arredondado).
const FAIXAS = [
  { seed: 101, bpm: 92, tom: 48, escala: 'maior', prog: [0, 4, 5, 3], bateria: 'basica', alvo: 32, pad: 0.55, brilho: 0.8, setima: false },
  { seed: 202, bpm: 76, tom: 57, escala: 'menor', prog: [0, 5, 2, 6], bateria: 'suave', alvo: 34, pad: 0.7, brilho: 0.5, setima: true },
  { seed: 303, bpm: 120, tom: 50, escala: 'dorico', prog: [0, 3, 0, 4], bateria: 'casa', alvo: 28, pad: 0.4, brilho: 1, setima: false, arpejo: true },
  { seed: 404, bpm: 104, tom: 43, escala: 'mixolidio', prog: [0, 6, 3, 0], bateria: 'shuffle', alvo: 30, pad: 0.5, brilho: 0.7, setima: false },
  { seed: 505, bpm: 68, tom: 53, escala: 'maior', prog: [1, 4, 0, 5], bateria: 'bossa', alvo: 36, pad: 0.6, brilho: 0.35, setima: true },
  { seed: 606, bpm: 132, tom: 52, escala: 'menor', prog: [0, 5, 6, 4], bateria: 'rock', alvo: 24, pad: 0.35, brilho: 0.9, setima: false },
  { seed: 707, bpm: 96, tom: 55, escala: 'maior', prog: [0, 3, 4, 0], bateria: 'valsa', alvo: 30, pad: 0.55, brilho: 0.6, setima: false, compasso: 3 },
  { seed: 808, bpm: 112, tom: 49, escala: 'pentatonica', prog: [0, 3, 4, 3], bateria: 'basica', alvo: 32, pad: 0.45, brilho: 0.75, setima: false },
  { seed: 909, bpm: 60, tom: 50, escala: 'maior', prog: [0, 2, 3, 4], bateria: 'nenhuma', alvo: 38, pad: 0.85, brilho: 0.4, setima: true },
  { seed: 1010, bpm: 100, tom: 45, escala: 'maior', prog: [0, 0, 3, 4], bateria: 'baiao', alvo: 29, pad: 0.45, brilho: 0.85, setima: false, arpejo: true },
];

// Ritmos da melodia em colcheias (8 por compasso 4/4, 6 em 3/4). 'x' = nota.
const RITMOS = ['x.x.xx.x', 'x..xx.x.', 'xx.xx.x.', 'x.xx.xx.', 'x...x.xx', 'x.x.x.xx'];

function aleatorio(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

function grau(escala, tom, n) {
  const notas = ESCALAS[escala];
  const oitava = Math.floor(n / notas.length);
  return tom + notas[((n % notas.length) + notas.length) % notas.length] + 12 * oitava;
}

function acorde(f, d) {
  const graus = [d, d + 2, d + 4];
  if (f.setima) graus.push(d + 6);
  return graus.map((g) => grau(f.escala, f.tom, g));
}

/** Soma `fn(t)` ao buffer entre `ini` e `ini + n` amostras. */
function somar(buf, ini, n, fn) {
  const fim = Math.min(buf.length, ini + n);
  for (let i = Math.max(0, ini); i < fim; i++) buf[i] += fn((i - ini) / SR, i - ini);
}

function envolvente(t, dur, ataque, solta) {
  if (t < ataque) return t / ataque;
  if (t > dur) return Math.max(0, 1 - (t - dur) / solta);
  return 1;
}

function passaBaixa(buf, corte) {
  const a = 1 - Math.exp((-2 * Math.PI * corte) / SR);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    y += a * (buf[i] - y);
    buf[i] = y;
  }
}

function reverb(entrada, atrasos, feedback) {
  const saida = new Float32Array(entrada.length);
  for (const atraso of atrasos) {
    const d = Math.round((atraso * SR) / 44100);
    const linha = new Float32Array(d);
    let filtro = 0;
    let p = 0;
    for (let i = 0; i < entrada.length; i++) {
      filtro += 0.45 * (linha[p] - filtro);
      const y = entrada[i] + filtro * feedback;
      linha[p] = y;
      saida[i] += y * 0.25;
      p = (p + 1) % d;
    }
  }
  return saida;
}

function sintetizar(f) {
  const rnd = aleatorio(f.seed);
  const porCompasso = f.compasso ?? 4;
  const tempoCompasso = (porCompasso * 60) / f.bpm;
  const cauda = 1.5;
  // Número de compassos em múltiplos de 4 (frases completas) que cabe na duração-alvo, já contando a cauda do reverb.
  const compassos = Math.max(4, Math.floor((f.alvo - cauda) / tempoCompasso / 4) * 4);
  const total = Math.ceil((compassos * tempoCompasso + cauda) * SR);
  const amCompasso = Math.round(tempoCompasso * SR);
  const amSemi = Math.round(amCompasso / (porCompasso * 4));
  const amColcheia = amSemi * 2;

  const padL = new Float32Array(total);
  const padR = new Float32Array(total);
  const baixo = new Float32Array(total);
  const pluck = new Float32Array(total);
  const bateria = new Float32Array(total);

  const ritmo = RITMOS.map((r) => r.slice(0, porCompasso * 2));
  const ritmoDoCompasso = (c) => ritmo[(f.seed + Math.floor(c / 2) * 3 + (c % 2)) % ritmo.length];
  let degrauMelodia = 7 + Math.floor(rnd() * 3);

  for (let c = 0; c < compassos; c++) {
    const d = f.prog[c % f.prog.length];
    const ini = c * amCompasso;
    const notas = acorde(f, d);

    // Pad: duas vozes levemente desafinadas (esquerda/direita), com harmônicos.
    const durPad = tempoCompasso * 0.95;
    for (const midi of notas) {
      const hz = freq(midi + 12);
      for (const [buf, desafino] of [[padL, 0.996], [padR, 1.004]]) {
        somar(buf, ini, amCompasso + Math.round(0.5 * SR), (t) => {
          const e = envolvente(t, durPad, 0.18, 0.45);
          const w = 2 * Math.PI * hz * desafino * t;
          return e * (Math.sin(w) + 0.45 * Math.sin(2 * w) + 0.2 * Math.sin(3 * w)) * 0.09 * f.pad;
        });
      }
    }

    // Baixo: fundamental com um pouco de 2º harmônico; fundamental e quinta alternadas.
    const raiz = notas[0] - 12;
    const quinta = grau(f.escala, f.tom, d + 4) - 12;
    const passosBaixo = f.bateria === 'nenhuma' ? [0] : porCompasso === 3 ? [0, 4, 8] : [0, 4, 8, 12];
    passosBaixo.forEach((passo, k) => {
      const hz = freq(f.bateria !== 'nenhuma' && k % 2 === 1 ? quinta : raiz);
      const dur = f.bateria === 'nenhuma' ? tempoCompasso * 0.9 : (60 / f.bpm) * 0.85;
      somar(baixo, ini + passo * amSemi, Math.round((dur + 0.15) * SR), (t) => {
        const e = envolvente(t, dur, 0.012, 0.12) * Math.exp(-t * 1.2);
        return e * (Math.sin(2 * Math.PI * hz * t) + 0.3 * Math.sin(4 * Math.PI * hz * t)) * 0.42;
      });
    });

    // Melodia "pluck" (ou arpejo): passeio por graus da escala, notas do acorde nos tempos fortes.
    const passoMel = f.arpejo ? 1 : 2;
    const grade = f.arpejo ? 'xxxxxxxx'.repeat(2).slice(0, porCompasso * 4) : ritmoDoCompasso(c);
    for (let k = 0; k < grade.length; k++) {
      if (grade[k] !== 'x') continue;
      const tempoForte = (k * passoMel) % (porCompasso * 2) === 0;
      if (f.arpejo) {
        degrauMelodia = d + [0, 2, 4, 7, 4, 2][k % 6] + 7;
      } else if (tempoForte) {
        degrauMelodia = [d, d + 2, d + 4][Math.floor(rnd() * 3)] + 7;
      } else {
        degrauMelodia += rnd() < 0.5 ? 1 : -1;
        if (rnd() < 0.15) degrauMelodia += rnd() < 0.5 ? 2 : -2;
      }
      degrauMelodia = Math.min(Math.max(degrauMelodia, 5), 14);
      const hz = freq(grau(f.escala, f.tom, degrauMelodia) + 12);
      const decai = f.arpejo ? 5 : 3 + (1 - f.brilho) * 1.5;
      const pos = ini + k * (f.arpejo ? amSemi : amColcheia);
      somar(pluck, pos, Math.round(1.6 * SR), (t) => {
        let s = 0;
        for (let h = 1; h <= 7; h++) s += (Math.sin(2 * Math.PI * hz * h * t) / h ** (1.6 - f.brilho * 0.6)) * Math.exp(-t * (decai + h * 1.4));
        return s * Math.min(1, t / 0.004) * 0.2;
      });
    }

    // Bateria.
    const padroes = BATERIAS[f.bateria];
    for (let p = 0; p < porCompasso * 4; p++) {
      const pos = ini + p * amSemi;
      const swing = f.bateria === 'shuffle' && p % 2 === 1 ? Math.round(amSemi * 0.25) : 0;
      const golpe = (tipo) => padroes[tipo][p] ?? '.';
      if (golpe('bumbo') !== '.') {
        const forca = golpe('bumbo') === 'x' ? 1 : 0.6;
        somar(bateria, pos, Math.round(0.35 * SR), (t) => {
          const hz = 48 + 90 * Math.exp(-t * 28);
          return Math.sin(2 * Math.PI * hz * t) * Math.exp(-t * 11) * 0.9 * forca;
        });
      }
      if (golpe('caixa') !== '.') {
        const forca = golpe('caixa') === 'x' ? 1 : 0.55;
        somar(bateria, pos + swing, Math.round(0.25 * SR), (t) => {
          const ruido = rnd() * 2 - 1;
          return (ruido * 0.55 + Math.sin(2 * Math.PI * 190 * t) * 0.35) * Math.exp(-t * 20) * 0.55 * forca;
        });
      }
      if (golpe('chimbal') !== '.') {
        const forca = golpe('chimbal') === 'x' ? 1 : 0.55;
        let ant = 0;
        somar(bateria, pos + swing, Math.round(0.08 * SR), (t) => {
          const ruido = rnd() * 2 - 1;
          const alta = ruido - ant; // passa-altas simples: diferença entre amostras
          ant = ruido;
          return alta * Math.exp(-t * 55) * 0.2 * forca;
        });
      }
    }
  }

  passaBaixa(padL, 1800 + f.brilho * 1500);
  passaBaixa(padR, 1800 + f.brilho * 1500);
  passaBaixa(baixo, 900);

  // Reverb nos instrumentos melódicos (envio mono, retorno estéreo com atrasos diferentes).
  const envio = new Float32Array(total);
  for (let i = 0; i < total; i++) envio[i] = (padL[i] + padR[i]) * 0.4 + pluck[i] * 0.9;
  const retornoL = reverb(envio, [1557, 1617, 1491, 1422], 0.8);
  const retornoR = reverb(envio, [1580, 1640, 1514, 1445], 0.8);

  const L = new Float32Array(total);
  const R = new Float32Array(total);
  const fadeFim = 1.8 * SR;
  const fimMusica = compassos * amCompasso;
  for (let i = 0; i < total; i++) {
    const fade = Math.min(1, i / (0.02 * SR)) * (i > fimMusica ? Math.max(0, 1 - (i - fimMusica) / (total - fimMusica)) : i > fimMusica - fadeFim ? 1 - 0.35 * ((i - (fimMusica - fadeFim)) / fadeFim) : 1);
    L[i] = (padL[i] + baixo[i] + pluck[i] * 0.85 + bateria[i] * 0.75 + retornoL[i] * 0.5) * fade;
    R[i] = (padR[i] + baixo[i] + pluck[i] * 1.0 + bateria[i] * 0.75 + retornoR[i] * 0.5) * fade;
  }

  // Normaliza o pico em ~ -3 dBFS e arredonda com tanh para não estourar.
  let pico = 0;
  for (let i = 0; i < total; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  const ganho = 0.7 / (pico || 1);
  const saida = Buffer.alloc(total * 8);
  for (let i = 0; i < total; i++) {
    saida.writeFloatLE(Math.tanh(L[i] * ganho * 1.2), i * 8);
    saida.writeFloatLE(Math.tanh(R[i] * ganho * 1.2), i * 8 + 4);
  }
  return saida;
}

function executar(comando, args, entrada) {
  const r = spawnSync(comando, args, { input: entrada, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${comando} falhou: ${r.stderr?.toString() ?? r.error}`);
  return r.stdout.toString();
}

mkdirSync(pastaAudio, { recursive: true });
const lista = [];
FAIXAS.forEach((faixa, i) => {
  const nome = `instrumental-${String(i + 1).padStart(2, '0')}.mp3`;
  const destino = join(pastaAudio, nome);
  const pcm = sintetizar(faixa);
  executar('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', BITRATE, '-metadata', 'title=Instrumental sintético', '-metadata', 'comment=Gerado por scripts/gerar-audio.mjs', destino], pcm);
  const duracao = Number(executar('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', destino]).trim());
  lista.push({ arquivo: nome, duracao: Math.round(duracao * 100) / 100 });
  console.log(`${nome}: ${duracao.toFixed(2)} s (${faixa.bpm} bpm, ${faixa.escala}, bateria ${faixa.bateria})`);
});

const ts =
  '// Gerado por scripts/gerar-audio.mjs (npm run audio). Não editar à mão: a duração é a medida pelo ffprobe.\n' +
  'export const AUDIO_FILES = [\n' +
  lista.map((a) => `  { file: '${a.arquivo}', durationSec: ${a.duracao} },`).join('\n') +
  '\n] as const;\n';
writeFileSync(join(raiz, 'src', 'data', 'audio.generated.ts'), ts, { encoding: 'utf8' });
