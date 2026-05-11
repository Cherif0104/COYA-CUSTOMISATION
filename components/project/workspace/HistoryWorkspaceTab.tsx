import React from 'react';
import ProjectDomainEventTimeline from '../ProjectDomainEventTimeline';

export type HistoryWorkspaceTabProps = {
  organizationId: string | null | undefined;
  projectId: string;
  language: 'fr' | 'en';
};

/**
 * Historique projet : timeline métier uniquement (runtime `ui-runtime/timeline` + `ProjectDomainEventTimeline`).
 * L’ancien `ActivityHistory` (legacy DOM) est retiré pour éviter conflits React / arbres instables.
 */
export const HistoryWorkspaceTab: React.FC<HistoryWorkspaceTabProps> = ({ organizationId, projectId, language }) => (
  <div className="space-y-6">
    <ProjectDomainEventTimeline organizationId={organizationId} projectId={String(projectId)} language={language} />
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
      {language === 'fr'
        ? 'Le fil d’activité legacy a été retiré. Les événements métier persistés (`domain_events`) s’affichent ci-dessus après migration Supabase.'
        : 'The legacy activity feed was removed. Persisted business events (`domain_events`) appear above once the Supabase migration is applied.'}
    </div>
  </div>
);

export default HistoryWorkspaceTab;
