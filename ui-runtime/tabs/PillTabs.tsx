import React from 'react';

export type PillTabItem<T extends string = string> = {
  id: T;
  label: React.ReactNode;
};

export type PillTabsProps<T extends string = string> = {
  items: PillTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
};

/** Onglets pilule MAKE FIGMA (`bg-gray-100 p-1 rounded-xl`). */
export function PillTabs<T extends string>({ items, value, onChange, className = '' }: PillTabsProps<T>) {
  return (
    <div className={`flex w-fit flex-wrap gap-1 rounded-xl bg-gray-100 p-1 ${className}`.trim()} role="tablist">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-lg px-4 py-2 text-sm transition-colors ${
            value === t.id
              ? 'bg-white font-medium text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default PillTabs;
