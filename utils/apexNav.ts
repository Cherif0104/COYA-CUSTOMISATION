/**
 * Navigation sous-sections APEX (e-learning) — hash `#apex/<section>` + événement `coya-apex-section`.
 * Compat : `#formation/<ancienne>` est mappée vers les sections APEX équivalentes.
 */

export type ApexSection =
  | 'overview'
  | 'catalog'
  | 'cohorts'
  | 'studio'
  | 'sessions'
  | 'tracks'
  | 'pedagogy'
  | 'learners'
  | 'assessments'
  | 'certificates'
  | 'reports'
  | 'integrations';

const VALID = new Set<string>([
  'overview',
  'catalog',
  'cohorts',
  'studio',
  'sessions',
  'tracks',
  'pedagogy',
  'learners',
  'assessments',
  'certificates',
  'reports',
  'integrations',
]);

/** Anciennes sections `#formation/…` → APEX */
const LEGACY_FORMATION: Record<string, ApexSection> = {
  overview: 'overview',
  programmes: 'tracks',
  cohortes: 'cohorts',
  formations: 'studio',
  cours: 'catalog',
  formateurs: 'pedagogy',
  apprenants: 'learners',
  evaluations: 'assessments',
  certificats: 'certificates',
  rapports: 'reports',
};

export function isApexSection(value: string): value is ApexSection {
  return VALID.has(value);
}

export function parseApexSectionFromHash(): ApexSection | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  const apexMatch = hash.match(/^apex\/(.+)$/);
  if (apexMatch) {
    const raw = apexMatch[1];
    if (VALID.has(raw)) return raw as ApexSection;
    return null;
  }
  const legacy = hash.match(/^formation\/(.+)$/);
  if (legacy) {
    const mapped = LEGACY_FORMATION[legacy[1]];
    return mapped ?? null;
  }
  return null;
}

export function pushApexSectionToUrl(section: ApexSection): void {
  if (typeof window === 'undefined') return;
  const next = `#apex/${section}`;
  if (window.location.hash === next) {
    window.dispatchEvent(new CustomEvent('coya-apex-section'));
    return;
  }
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`);
  window.dispatchEvent(new CustomEvent('coya-apex-section'));
}

export const APEX_SIDEBAR_ITEMS: { section: ApexSection; label: string }[] = [
  { section: 'overview', label: "Vue d'ensemble" },
  { section: 'catalog', label: 'Catalogue' },
  { section: 'cohorts', label: 'Cohortes & sessions' },
  { section: 'studio', label: 'Studio pédagogique' },
  { section: 'sessions', label: 'Planification sessions' },
  { section: 'tracks', label: 'Parcours & durées' },
  { section: 'pedagogy', label: 'Formateurs & mentors' },
  { section: 'learners', label: 'Apprenants' },
  { section: 'assessments', label: 'Évaluations & examens' },
  { section: 'certificates', label: 'Certifications' },
  { section: 'reports', label: 'Rapports' },
  { section: 'integrations', label: 'Intégrations' },
];
