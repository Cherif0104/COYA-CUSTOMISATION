import React from 'react';

export type WorkspaceBreadcrumbItem = {
  id: string;
  label: React.ReactNode;
  /** Si défini, rend un bouton (navigation interne). Sinon segment texte (souvent le courant). */
  onClick?: () => void;
};

export type WorkspaceBreadcrumbsProps = {
  items: WorkspaceBreadcrumbItem[];
  /** Segments après le premier : séparateur */
  separator?: React.ReactNode;
  className?: string;
};

export const WorkspaceBreadcrumbs: React.FC<WorkspaceBreadcrumbsProps> = ({
  items,
  separator = <span className="text-slate-300">/</span>,
  className = '',
}) => (
  <nav
    className={`flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-xs text-slate-600 ${className}`.trim()}
    aria-label="Breadcrumb"
  >
    {items.map((item, i) => (
      <React.Fragment key={item.id}>
        {i > 0 && <span className="shrink-0 text-slate-300">{separator}</span>}
        {item.onClick ? (
          <button
            type="button"
            onClick={item.onClick}
            className="max-w-[140px] truncate text-left font-medium text-slate-700 hover:text-slate-900 hover:underline sm:max-w-[220px]"
          >
            {item.label}
          </button>
        ) : (
          <span className="max-w-[180px] truncate font-semibold text-slate-900 sm:max-w-md">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default WorkspaceBreadcrumbs;
