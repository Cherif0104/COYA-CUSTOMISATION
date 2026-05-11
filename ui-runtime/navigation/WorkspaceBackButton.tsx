import React from 'react';

export type WorkspaceBackButtonProps = {
  onClick: () => void;
  /** Libellé après la flèche (ex. « Projets »). */
  label: React.ReactNode;
  className?: string;
};

/** Retour contextuel (navigation hiérarchique type Object Page). */
export const WorkspaceBackButton: React.FC<WorkspaceBackButtonProps> = ({
  onClick,
  label,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${className}`.trim()}
  >
    <i className="fas fa-arrow-left text-slate-500" aria-hidden />
    <span className="max-w-[10rem] truncate sm:max-w-xs">{label}</span>
  </button>
);

export default WorkspaceBackButton;
