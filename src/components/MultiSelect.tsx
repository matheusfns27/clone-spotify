import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { filterOptions, summarizeSelection, toggleValue, type Option } from '../lib/combobox';

interface MultiSelectProps {
  label: string;
  options: readonly Option[];
  selected: readonly string[];
  onChange: (selected: string[]) => void;
}

/** Combobox de múltipla escolha com busca (sem acento/maiúsculas), contagem e "Limpar seleção". */
export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setSearch('');
    buttonRef.current?.focus();
  };

  const visible = filterOptions(options, search);

  return (
    <div
      className="multiselect"
      ref={rootRef}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        type="button"
        ref={buttonRef}
        className={`multiselect__button${selected.length > 0 ? ' multiselect__button--active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span>{summarizeSelection(label, selected, options)}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div className="multiselect__panel">
          <label className="multiselect__search">
            <Search aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              placeholder={`Buscar em ${label.toLowerCase()}`}
              aria-label={`Buscar em ${label.toLowerCase()}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <ul id={listId} className="multiselect__list" role="listbox" aria-multiselectable="true" aria-label={label}>
            {visible.length === 0 && <li className="multiselect__empty">Nada encontrado</li>}
            {visible.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={checked}
                  tabIndex={0}
                  className="multiselect__option"
                  onClick={() => onChange(toggleValue(selected, option.value))}
                  onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                      event.preventDefault();
                      onChange(toggleValue(selected, option.value));
                    }
                  }}
                >
                  <span className="multiselect__check" aria-hidden="true">
                    {checked && <Check />}
                  </span>
                  {option.label}
                </li>
              );
            })}
          </ul>
          <div className="multiselect__footer">
            <span>{selected.length === 0 ? 'Nenhum selecionado' : `${selected.length} selecionados`}</span>
            <button type="button" className="link-button" disabled={selected.length === 0} onClick={() => onChange([])}>
              Limpar seleção
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
