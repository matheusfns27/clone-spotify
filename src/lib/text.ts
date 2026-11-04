/** Remove acentos, passa para minúsculas e compacta espaços — base de toda busca do app. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Todos os termos da consulta precisam aparecer (sem acento/maiúsculas) em algum dos campos. */
export function matchesQuery(query: string, fields: readonly string[]): boolean {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalize(fields.join(' '));
  return terms.every((term) => haystack.includes(term));
}
