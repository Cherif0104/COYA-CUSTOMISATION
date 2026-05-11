/** Path canonique workspace salarié (identifiant d’URL = `profiles.id` / `Employee.profileId`). */
export const HR_EMPLOYEES_PATH_PREFIX = '/hr/employees';

export function getEmployeeProfileIdFromPathname(pathname: string): string | null {
  const m = pathname.replace(/\/$/, '').match(/^\/hr\/employees\/([^/]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function getEmployeeProfileIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return getEmployeeProfileIdFromPathname(window.location.pathname);
  } catch {
    return null;
  }
}

/** Ouvre le workspace salarié : URL `/hr/employees/:profileId`. */
export function navigateToEmployeeWorkspace(profileId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const u = new URL(window.location.href);
    u.pathname = `${HR_EMPLOYEES_PATH_PREFIX}/${encodeURIComponent(profileId)}`;
    window.history.pushState({}, '', u.toString());
  } catch {
    /* ignore */
  }
}

/**
 * Quitte `/hr/employees` ou `/hr/employees/:id` si l’app change de vue (évite URL incohérente).
 */
export function clearHrEmployeePathSegmentIfPresent(): void {
  if (typeof window === 'undefined') return;
  try {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === HR_EMPLOYEES_PATH_PREFIX || path.startsWith(`${HR_EMPLOYEES_PATH_PREFIX}/`)) {
      const u = new URL(window.location.href);
      u.pathname = '/';
      window.history.replaceState({}, '', u.toString());
    }
  } catch {
    /* ignore */
  }
}
