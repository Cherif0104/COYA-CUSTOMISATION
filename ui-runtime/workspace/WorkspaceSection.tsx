import React, { PropsWithChildren } from 'react';

export type WorkspaceSectionProps = PropsWithChildren<{
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}>;

/** Bloc section dense (carte) — pattern MAKE FIGMA / workspace COYA. */
export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  title,
  description,
  className = '',
  children,
}) => (
  <section
    className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${className}`.trim()}
  >
    <header className="mb-4">
      <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
      {description != null && description !== '' && (
        <div className="mt-0.5 text-xs text-slate-500">{description}</div>
      )}
    </header>
    {children}
  </section>
);

export default WorkspaceSection;
