import React, { useState } from 'react';

export interface DashboardHeaderBarProps {
  searchPlaceholder?: string;
  periodLabel?: string;
  onSearch?: (value: string) => void;
  onFilterPeriod?: () => void;
}

const DashboardHeaderBar: React.FC<DashboardHeaderBarProps> = ({
  searchPlaceholder = 'Rechercher…',
  periodLabel = 'Filtrer période',
  onSearch,
  onFilterPeriod,
}) => {
  const [search, setSearch] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearch(v);
    onSearch?.(v);
  };

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative max-w-md flex-1">
        <input
          type="search"
          value={search}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-2.5 pl-4 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--coya-institutional)]/20"
          aria-label={searchPlaceholder}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <i className="fas fa-search text-sm" aria-hidden />
        </span>
      </div>
      {onFilterPeriod && (
        <button
          type="button"
          onClick={onFilterPeriod}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--coya-institutional)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--coya-institutional)]/35 focus:ring-offset-2"
        >
          <i className="fas fa-filter" aria-hidden />
          {periodLabel}
        </button>
      )}
    </div>
  );
};

export default DashboardHeaderBar;
