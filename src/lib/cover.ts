import { createRandom, hashString } from './random';

const S = 300;

type Rand = () => number;

const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${Math.round(((h % 360) + 360) % 360)},${s}%,${l}%,${a})`;
const num = (n: number) => Math.round(n * 10) / 10;

function circles(r: Rand, h: number): string {
  let out = '';
  for (let i = 0; i < 7; i++) {
    out += `<circle cx="${num(r() * S)}" cy="${num(r() * S)}" r="${num(25 + r() * 95)}" fill="${hsl(h + r() * 90, 80, 55 + r() * 15, 0.2 + r() * 0.3)}"/>`;
  }
  return out;
}

function stripes(r: Rand, h: number): string {
  const angle = Math.round(r() * 80 - 40);
  let out = `<g transform="rotate(${angle} 150 150)">`;
  for (let i = -3; i < 13; i++) {
    out += `<rect x="${num(i * 32 - 30)}" y="-120" width="${num(8 + r() * 24)}" height="540" fill="${hsl(h + r() * 60, 85, 60, 0.16 + r() * 0.2)}"/>`;
  }
  return out + '</g>';
}

function mountains(r: Rand, h: number): string {
  let out = `<circle cx="${num(60 + r() * 180)}" cy="${num(50 + r() * 60)}" r="${num(24 + r() * 26)}" fill="${hsl(h + 180, 90, 75, 0.85)}"/>`;
  for (let layer = 0; layer < 3; layer++) {
    const base = 150 + layer * 40;
    let d = `M0 ${S} L0 ${num(base)}`;
    for (let x = 0; x <= S; x += 50) d += ` L${x + 25} ${num(base - r() * 80)} L${x + 50} ${num(base + r() * 14)}`;
    out += `<path d="${d} L${S} ${S} Z" fill="${hsl(h + layer * 18, 55, 30 - layer * 8, 0.88)}"/>`;
  }
  return out;
}

function waves(r: Rand, h: number): string {
  let out = '';
  for (let i = 0; i < 7; i++) {
    const y = 40 + i * 38;
    const amp = 10 + r() * 28;
    out += `<path d="M0 ${y} Q75 ${num(y - amp)} 150 ${y} T300 ${y} V${S} H0 Z" fill="${hsl(h + i * 22, 75, 50 - i * 4, 0.26)}"/>`;
  }
  return out;
}

function dots(r: Rand, h: number): string {
  let out = '';
  const gap = 22 + Math.floor(r() * 10);
  const phase = r() * 6;
  for (let x = gap / 2; x < S; x += gap) {
    for (let y = gap / 2; y < S; y += gap) {
      const radius = num(Math.abs(Math.sin(x * 0.03 + y * 0.05 + phase)) * (gap / 2.3));
      out += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${hsl(h + 40, 90, 70, 0.4)}"/>`;
    }
  }
  return out;
}

function rings(r: Rand, h: number): string {
  const cx = num(80 + r() * 140);
  const cy = num(80 + r() * 140);
  let out = '';
  for (let i = 1; i <= 8; i++) {
    out += `<circle cx="${cx}" cy="${cy}" r="${i * 22}" fill="none" stroke="${hsl(h + i * 14, 85, 65, 0.5)}" stroke-width="${num(1 + r() * 6)}"/>`;
  }
  return out;
}

function triangles(r: Rand, h: number): string {
  let out = '';
  for (let i = 0; i < 8; i++) {
    const x = r() * S;
    const y = r() * S;
    const s = 50 + r() * 110;
    out += `<polygon points="${num(x)},${num(y)} ${num(x + s)},${num(y + s * 0.4)} ${num(x + s * 0.3)},${num(y + s)}" fill="${hsl(h + r() * 100, 80, 55, 0.25 + r() * 0.3)}"/>`;
  }
  return out;
}

function sun(r: Rand, h: number): string {
  const cy = num(110 + r() * 60);
  let out = `<circle cx="150" cy="${cy}" r="${num(60 + r() * 30)}" fill="${hsl(h + 150, 90, 68, 0.9)}"/>`;
  for (let i = 0; i < 6; i++) {
    out += `<rect x="0" y="${num(cy + 8 + i * 22)}" width="300" height="${num(4 + i * 3)}" fill="${hsl(h, 60, 12, 0.9)}"/>`;
  }
  return out;
}

function grid(r: Rand, h: number): string {
  const cells = 4 + Math.floor(r() * 3);
  const size = S / cells;
  let out = '';
  for (let x = 0; x < cells; x++) {
    for (let y = 0; y < cells; y++) {
      if (r() < 0.45) continue;
      const round = r() < 0.5 ? size / 2 : 4;
      out += `<rect x="${num(x * size + 4)}" y="${num(y * size + 4)}" width="${num(size - 8)}" height="${num(size - 8)}" rx="${num(round)}" fill="${hsl(h + r() * 80, 80, 55, 0.3 + r() * 0.4)}"/>`;
    }
  }
  return out;
}

function arcs(r: Rand, h: number): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    const rad = 40 + i * 28;
    const start = r() * Math.PI * 2;
    const len = 1.2 + r() * 3.4;
    const x1 = 150 + rad * Math.cos(start);
    const y1 = 150 + rad * Math.sin(start);
    const x2 = 150 + rad * Math.cos(start + len);
    const y2 = 150 + rad * Math.sin(start + len);
    out += `<path d="M${num(x1)} ${num(y1)} A${rad} ${rad} 0 ${len > Math.PI ? 1 : 0} 1 ${num(x2)} ${num(y2)}" fill="none" stroke="${hsl(h + i * 20, 85, 65, 0.7)}" stroke-width="${num(8 + r() * 14)}" stroke-linecap="round"/>`;
  }
  return out;
}

const STYLES = [circles, stripes, mountains, waves, dots, rings, triangles, sun, grid, arcs];

/** Matiz (0–359) da capa, usado para o gradiente de cabeçalho das telas. */
export function coverHue(key: string): number {
  return Math.floor(createRandom(hashString(key))() * 360);
}

/**
 * Capa quadrada em SVG, 100% determinística: a mesma chave sempre gera a mesma imagem.
 * Gradiente de fundo + formas abstratas. Sem texto, sem imagem externa.
 */
export function coverSvg(key: string): string {
  const seed = hashString(key);
  const rand = createRandom(seed);
  const hue = Math.floor(rand() * 360);
  const hue2 = hue + 40 + rand() * 120;
  const angle = Math.round(rand() * 360);
  const style = STYLES[Math.floor(rand() * STYLES.length)] ?? circles;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">` +
    `<defs><linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)">` +
    `<stop offset="0" stop-color="${hsl(hue, 70, 38)}"/><stop offset="1" stop-color="${hsl(hue2, 75, 16)}"/></linearGradient></defs>` +
    `<rect width="${S}" height="${S}" fill="url(#g)"/>${style(rand, hue)}</svg>`
  );
}

const cache = new Map<string, string>();

/** URL `data:` pronta para `<img src>`, com cache. */
export function coverUrl(key: string): string {
  let url = cache.get(key);
  if (!url) {
    url = `data:image/svg+xml,${encodeURIComponent(coverSvg(key))}`;
    cache.set(key, url);
  }
  return url;
}
