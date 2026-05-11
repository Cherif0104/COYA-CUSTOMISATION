import React, { useCallback, useState } from 'react';
import { NAV_SESSION_PROGRAMMES_PROJECTS_TAB } from '../contexts/AppNavigationContext';

export type ProgrammesProjectsTab = 'programme' | 'projects';

/** Préférence utilisateur (survit aux changements de vue) — clé locale au shell. */
const TAB_PERSIST_KEY = 'coya_programmes_projects_tab';

function readInitialProgrammesProjectsTab(): ProgrammesProjectsTab {
  if (typeof window === 'undefined') return 'programme';
  try {
    const raw = sessionStorage.getItem(NAV_SESSION_PROGRAMMES_PROJECTS_TAB);
    if (raw === 'programme' || raw === 'projects') {
      sessionStorage.removeItem(NAV_SESSION_PROGRAMMES_PROJECTS_TAB);
      return raw;
    }
  } catch {
    /* ignore */
  }
  try {
    const sticky = localStorage.getItem(TAB_PERSIST_KEY);
    if (sticky === 'programme' || sticky === 'projects') return sticky;
  } catch {
    /* ignore */
  }
  return 'programme';
}

export interface ProgrammesProjectsShellProps {
  canAccessProgramme: boolean;
  canAccessProjects: boolean;
  isFr: boolean;
  programmePane: React.ReactNode;
  projectsPane: React.ReactNode;
}

/**
 * Coquille « Programmes & Projets » alignée Figma (`make figma`).
 * - Onglets en pilule grise (`bg-gray-100 p-1 rounded-xl`).
 * - Aucune logique métier modifiée : composition des panneaux existants.
 */
const ProgrammesProjectsShell: React.FC<ProgrammesProjectsShellProps> = ({
  canAccessProgramme,
  canAccessProjects,
  isFr,
  programmePane,
  projectsPane,
}) => {
  /**
   * Onglet actif : lecture synchrone au premier rendu (session one-shot puis sticky localStorage)
   * pour éviter un flash « Programme » au retour depuis le workspace projet ou une restauration incorrecte.
   */
  const [tab, setTab] = useState<ProgrammesProjectsTab>(readInitialProgrammesProjectsTab);

  const setTabPersisted = useCallback((next: ProgrammesProjectsTab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_PERSIST_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  if (canAccessProgramme && !canAccessProjects) {
    return <div className="min-h-0 flex flex-col">{programmePane}</div>;
  }
  if (!canAccessProgramme && canAccessProjects) {
    return <div className="min-h-0 flex flex-col">{projectsPane}</div>;
  }
  if (!canAccessProgramme && !canAccessProjects) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 text-center text-gray-500">
        {isFr ? 'Vous n’avez pas accès à ce module.' : 'You do not have access to this module.'}
      </div>
    );
  }

  return (
    <div
      className="space-y-6 bg-[var(--coya-enterprise-bg,#F8FAFC)] p-6 font-coya text-[var(--coya-enterprise-text)]"
      data-testid="programmes-projects-shell"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--coya-enterprise-text)]">
            {isFr ? 'Programmes & Projets' : 'Programmes & Projects'}
          </h2>
          <p className="mt-1 text-sm text-[var(--coya-enterprise-muted)]">
            {isFr
              ? 'Gestion transverse des programmes et du delivery projets.'
              : 'Cross-cutting programme & project delivery management.'}
          </p>
        </div>
        <div className="coya-tabs-pill shrink-0" role="tablist" aria-label={isFr ? 'Programme ou Projets' : 'Programme or Projects'}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'programme'}
            data-testid="nav-programme-tab"
            onClick={() => setTabPersisted('programme')}
            className={tab === 'programme' ? 'coya-tabs-pill-item-active' : 'coya-tabs-pill-item'}
          >
            <i className="fas fa-chart-line mr-2" aria-hidden />
            {isFr ? 'Programme' : 'Programme'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'projects'}
            data-testid="nav-projects-tab"
            onClick={() => setTabPersisted('projects')}
            className={tab === 'projects' ? 'coya-tabs-pill-item-active' : 'coya-tabs-pill-item'}
          >
            <i className="fas fa-project-diagram mr-2" aria-hidden />
            {isFr ? 'Projets' : 'Projects'}
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] min-h-0 w-full flex-1 overflow-y-auto">
        {/* Les deux panneaux restent montés : un switch ternaire démontait Projects → conflits DOM/Recharts (cf. debug-5fe008 H5 puis H2 unmount). */}
        <div
          className={tab === 'programme' ? 'block min-h-0' : 'hidden'}
          aria-hidden={tab !== 'programme'}
        >
          {programmePane}
        </div>
        <div
          className={tab === 'projects' ? 'block min-h-0' : 'hidden'}
          aria-hidden={tab !== 'projects'}
        >
          {projectsPane}
        </div>
      </div>
    </div>
  );
};

export default ProgrammesProjectsShell;
