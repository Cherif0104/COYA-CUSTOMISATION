import React from 'react';
import { WorkspaceActions } from '../../../ui-runtime';

export type ProjectWorkspaceHeroProps = {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    progressPercent: number;
    actions?: React.ReactNode;
    /** Badge statut (ex. « En cours ») — charte enterprise */
    statusBadge?: React.ReactNode;
};

/**
 * Hero dense projet (identité + méta + barre + CTA) — aligné captures MAKE FIGMA.
 * Phase UI-CORE-1.1 : composition pure ; branchement complet dans `ProjectObjectWorkspace`.
 */
export const ProjectWorkspaceHero: React.FC<ProjectWorkspaceHeroProps> = ({
    title,
    subtitle,
    progressPercent,
    actions,
    statusBadge,
}) => (
    <div className="rounded-2xl border border-[var(--coya-enterprise-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--coya-enterprise-text)] sm:text-xl">{title}</h1>
                    {statusBadge != null ? statusBadge : null}
                </div>
                {subtitle != null && subtitle !== '' && (
                    <p className="mt-1 text-sm text-[var(--coya-enterprise-muted)]">{subtitle}</p>
                )}
                <div className="mt-3 h-1.5 max-w-md rounded-full bg-[#E2E8F0]">
                    <div
                        className="h-full rounded-full bg-[var(--coya-institutional)] transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                </div>
            </div>
            {actions != null && (
                <WorkspaceActions className="shrink-0 flex-wrap justify-start sm:justify-end">{actions}</WorkspaceActions>
            )}
        </div>
    </div>
);

export default ProjectWorkspaceHero;
