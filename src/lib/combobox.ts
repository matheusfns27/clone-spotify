import { normalize } from './text';

export interface Option {
  value: string;
  label: string;
}

/** Opções cujo rótulo contém a busca (sem acento/maiúsculas). Busca vazia devolve todas. */
export function filterOptions(options: readonly Option[], search: string): Option[] {
  const term = normalize(search);
  if (!term) return [...options];
  return options.filter((option) => normalize(option.label).includes(term));
}

/** Liga/desliga um valor mantendo a ordem de seleção e sem duplicar. */
export function toggleValue(selected: readonly string[], value: string): string[] {
  return selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
}

/** Texto do botão do combobox: rótulo, o item único ou "N selecionados". */
export function summarizeSelection(label: string, selected: readonly string[], options: readonly Option[]): string {
  if (selected.length === 0) return label;
  if (selected.length === 1) return options.find((o) => o.value === selected[0])?.label ?? label;
  return `${selected.length} selecionados`;
}
