/** Paramètre d’URL hérité pour la fiche projet (?projectId=) — compat liens anciens. */
export const PROJECT_WORKSPACE_URL_PARAM = 'projectId';

const PROJECTS_LIST_PATH = '/projects';

/** Correspondance pathname canonique : `/projects/:id`. */
export function getProjectIdFromPathname(pathname: string): string | null {
  const m = pathname.replace(/\/$/, '').match(/^\/projects\/([^/]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function getProjectIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromPath = getProjectIdFromPathname(window.location.pathname);
    if (fromPath) return fromPath;
    return new URLSearchParams(window.location.search).get(PROJECT_WORKSPACE_URL_PARAM);
  } catch {
    return null;
  }
}

/** Ouvre le workspace projet : URL `/projects/:id` (sans query legacy). */
export function navigateToProjectWorkspace(projectId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const u = new URL(window.location.href);
    u.pathname = `${PROJECTS_LIST_PATH}/${encodeURIComponent(projectId)}`;
    u.searchParams.delete(PROJECT_WORKSPACE_URL_PARAM);
    window.history.pushState({}, '', u.toString());
  } catch {
    /* ignore */
  }
}

/** Liste projets : `/projects`. */
export function navigateToProjectsListPath(): void {
  if (typeof window === 'undefined') return;
  try {
    const u = new URL(window.location.href);
    u.pathname = PROJECTS_LIST_PATH;
    u.searchParams.delete(PROJECT_WORKSPACE_URL_PARAM);
    window.history.pushState({}, '', u.toString());
  } catch {
    /* ignore */
  }
}

/**
 * Quitte `/projects` ou `/projects/:id` sans forcer une fausse « liste » si l’app repart sur une autre vue.
 */
export function clearProjectPathSegmentIfPresent(): void {
  if (typeof window === 'undefined') return;
  try {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === PROJECTS_LIST_PATH || path.startsWith(`${PROJECTS_LIST_PATH}/`)) {
      const u = new URL(window.location.href);
      u.pathname = '/';
      u.searchParams.delete(PROJECT_WORKSPACE_URL_PARAM);
      window.history.replaceState({}, '', u.toString());
    }
  } catch {
    /* ignore */
  }
}

/** @deprecated Préférer `navigateToProjectWorkspace` / `navigateToProjectsListPath`. */
export function setProjectWorkspaceUrlParam(projectId: string | null): void {
  if (projectId) navigateToProjectWorkspace(projectId);
  else navigateToProjectsListPath();
}
