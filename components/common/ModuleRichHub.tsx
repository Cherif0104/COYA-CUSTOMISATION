import React, { useCallback, useMemo } from 'react';
import { useAppNavigation } from '../../contexts/AppNavigationContext';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../ui/cn';

export type HubMetric = {
  labelFr: string;
  labelEn: string;
  value: string;
  hintFr?: string;
  hintEn?: string;
};

export type HubQuickLink = {
  view: string;
  labelFr: string;
  labelEn: string;
  icon: string;
};

export type HubSection = {
  key: string;
  titleFr: string;
  titleEn: string;
  icon?: string;
  bulletsFr: string[];
  bulletsEn: string[];
};

const STANDARD_LINKS: HubQuickLink[] = [
  { view: 'dashboard', labelFr: 'Tableau de bord', labelEn: 'Dashboard', icon: 'fas fa-th-large' },
  { view: 'apex', labelFr: 'APEX', labelEn: 'APEX', icon: 'fas fa-book-open' },
  { view: 'jobs', labelFr: 'Emplois', labelEn: 'Jobs', icon: 'fas fa-briefcase' },
  { view: 'crm_sales', labelFr: 'CRM & Ventes', labelEn: 'CRM & Sales', icon: 'fas fa-users' },
  { view: 'trinite', labelFr: 'Trinité', labelEn: 'Trinité', icon: 'fas fa-gem' },
  { view: 'logistique', labelFr: 'Logistique', labelEn: 'Logistics', icon: 'fas fa-boxes' },
  { view: 'studio', labelFr: 'Studio', labelEn: 'Studio', icon: 'fas fa-video' },
  { view: 'parc_auto', labelFr: 'Parc Auto', labelEn: 'Fleet', icon: 'fas fa-car' },
  { view: 'messagerie', labelFr: 'Messagerie', labelEn: 'Messaging', icon: 'fas fa-envelope' },
  { view: 'ticket_it', labelFr: 'Ticket IT', labelEn: 'IT tickets', icon: 'fas fa-ticket-alt' },
  { view: 'coya_drive', labelFr: 'COYA Drive', labelEn: 'COYA Drive', icon: 'fas fa-folder-open' },
  { view: 'daf_services', labelFr: 'Moyens généraux', labelEn: 'General services', icon: 'fas fa-clipboard-check' },
  { view: 'qualite', labelFr: 'Qualité', labelEn: 'Quality', icon: 'fas fa-check-double' },
  { view: 'collecte', labelFr: 'Collecte', labelEn: 'Data collection', icon: 'fas fa-poll-h' },
  { view: 'settings', labelFr: 'Paramètres', labelEn: 'Settings', icon: 'fas fa-sliders-h' },
];

/** Liens transverses entre modules (pattern hub COYA / Figma Make). */
export function crossModuleQuickLinks(excludeViews: string[]): HubQuickLink[] {
  const ex = new Set(
    excludeViews.flatMap((v) => (v === 'formation' || v === 'courses' ? ['apex', 'formation', 'courses', 'knowledge_base'] : [v])),
  );
  return STANDARD_LINKS.filter((l) => !ex.has(l.view));
}

export interface ModuleRichHubProps {
  isFr: boolean;
  variant?: 'full' | 'compact';
  /** Prioritaire sur `useAppNavigation` quand fourni (ex. pages déjà reliées à `setView`). */
  setView?: (view: string) => void;
  metrics?: HubMetric[];
  quickLinks?: HubQuickLink[];
  /** Utilisé si `quickLinks` absent : tous les modules sauf ceux listés. */
  excludeViews?: string[];
  sections?: HubSection[];
  className?: string;
}

const ModuleRichHub: React.FC<ModuleRichHubProps> = ({
  isFr,
  variant = 'full',
  setView: setViewProp,
  metrics = [],
  quickLinks: quickLinksProp,
  excludeViews = [],
  sections = [],
  className,
}) => {
  const nav = useAppNavigation();
  const navigate = useCallback(
    (view: string) => {
      const fn = setViewProp ?? nav?.setView;
      if (fn) fn(view);
    },
    [setViewProp, nav?.setView],
  );
  const canNavigate = Boolean(setViewProp ?? nav?.setView);

  const quickLinks = useMemo(
    () => quickLinksProp ?? crossModuleQuickLinks(excludeViews),
    [quickLinksProp, excludeViews],
  );

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 border-b border-slate-200/90 bg-slate-50/95 px-3 py-2 shrink-0',
          className,
        )}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">
          {isFr ? 'Raccourcis COYA' : 'COYA shortcuts'}
        </span>
        {quickLinks.slice(0, 14).map((link) => (
          <button
            key={link.view}
            type="button"
            disabled={!canNavigate}
            onClick={() => navigate(link.view)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <i className={cn(link.icon, 'text-slate-400')} aria-hidden />
            {isFr ? link.labelFr : link.labelEn}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn('border-slate-200 shadow-sm', className)}>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {isFr ? 'Hub opérationnel' : 'Operational hub'}
            </p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {isFr
                ? 'Indicateurs de ce module et accès rapides vers le reste de la plateforme.'
                : 'Indicators for this module and quick access to the rest of the platform.'}
            </p>
          </div>
        </div>
        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {metrics.map((m, i) => (
              <div key={`${m.labelFr}-${i}`} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {isFr ? m.labelFr : m.labelEn}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{m.value}</p>
                {(isFr ? m.hintFr : m.hintEn) ? (
                  <p className="mt-1 text-[10px] text-slate-500 leading-snug">{isFr ? m.hintFr : m.hintEn}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {quickLinks.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">{isFr ? 'Navigation rapide' : 'Quick navigation'}</p>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <button
                  key={link.view}
                  type="button"
                  disabled={!canNavigate}
                  onClick={() => navigate(link.view)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/40 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <i className={cn(link.icon, 'text-slate-400')} aria-hidden />
                  {isFr ? link.labelFr : link.labelEn}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {sections.map((sec) => (
          <div key={sec.key} className="rounded-xl border border-slate-100 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
              {sec.icon ? <i className={cn(sec.icon, 'text-slate-400')} aria-hidden /> : null}
              {isFr ? sec.titleFr : sec.titleEn}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              {(isFr ? sec.bulletsFr : sec.bulletsEn).map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ModuleRichHub;
