/** Tempo em "m:ss" (ex.: 75 → "1:15"). Valores inválidos viram "0:00". */
export function formatTime(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Duração total por extenso curto: "1 h 05 min" ou "12 min 30 s". */
export function formatTotal(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  return `${minutes} min ${String(total % 60).padStart(2, '0')} s`;
}

/** Número com separador de milhar do pt-BR (1.284.300). */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/** Ano de uma data AAAA-MM-DD. */
export function yearOf(isoDate: string): number {
  return Number(isoDate.slice(0, 4));
}
