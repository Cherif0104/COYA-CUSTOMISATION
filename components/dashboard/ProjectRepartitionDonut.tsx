import React from 'react';

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface ProjectRepartitionDonutProps {
  slices: DonutSlice[];
  title: string;
  /** Sous-titre sous le titre (ex. « Répartition globale » — aligné make figma Dashboard). */
  description?: string;
  centerLabel?: string | number;
  setView?: (view: string) => void;
  /** Si défini, remplace la navigation vers la vue `projects` (ex. coquille Programmes & Projets). */
  onViewAllProjects?: () => void;
  viewAllLabel?: string;
}

const ProjectRepartitionDonut: React.FC<ProjectRepartitionDonutProps> = ({
  slices,
  title,
  description,
  centerLabel,
  setView,
  onViewAllProjects,
  viewAllLabel = 'Voir les projets',
}) => {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const displayCenter = centerLabel != null ? String(centerLabel) : String(total);

  const conicParts = slices.filter((s) => s.percentage > 0).reduce(
    (prev: { acc: number; parts: string[] }, slice) => {
      const start = prev.acc;
      const end = prev.acc + slice.percentage;
      prev.parts.push(`${slice.color} ${start}% ${end}%`);
      prev.acc = end;
      return prev;
    },
    { acc: 0, parts: [] as string[] },
  );

  const conicGradient =
    conicParts.parts.length > 0
      ? `conic-gradient(${conicParts.parts.join(', ')})`
      : 'conic-gradient(var(--coya-border) 0%, var(--coya-border) 100%)';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-gray-400">{description}</p> : null}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 shrink-0">
          <div
            className="rounded-full w-full h-full border-4 border-coya-card"
            style={{ background: conicGradient }}
          />
          <div
            className="absolute inset-2 rounded-full bg-coya-card flex items-center justify-center border border-coya-border"
            style={{ boxShadow: 'inset 0 0 0 2px var(--coya-card-bg)' }}
          >
            <span className="text-xl font-bold text-coya-text">{displayCenter}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {slices.map((slice) => (
            <div key={slice.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-sm text-coya-text truncate">{slice.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-coya-text">{slice.percentage}%</span>
                <span className="text-sm text-coya-text-muted">({slice.value})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {(setView || onViewAllProjects) && (
        <button
          type="button"
          onClick={() => (onViewAllProjects ? onViewAllProjects() : setView?.('projects'))}
          className="mt-4 text-sm font-semibold text-[var(--coya-institutional)] hover:opacity-90"
        >
          {viewAllLabel} →
        </button>
      )}
    </div>
  );
};

export default ProjectRepartitionDonut;
