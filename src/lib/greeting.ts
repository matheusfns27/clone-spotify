/** Hora (0–23) em Brasília para o instante dado, independente do fuso do navegador. */
export function brasiliaHour(date: Date): number {
  const parts = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(date);
  return Number(parts) % 24;
}

/** Saudação da tela inicial: bom dia (5–11 h), boa tarde (12–17 h), boa noite (demais), no horário de Brasília. */
export function greeting(date: Date = new Date()): string {
  const hour = brasiliaHour(date);
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
