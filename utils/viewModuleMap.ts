import { ModuleName } from '../types';

/**
 * Associe une vue App (`currentView`) au module métier contrôlé par `useModulePermissions`.
 * Retourne `null` pour les vues internes (notifications, etc.) sans garde module.
 */
export function viewNameToModuleName(view: string): ModuleName | null {
  if (!view || view === 'login' || view === 'signup' || view === 'pending_access') return null;

  if (view === 'notifications_center' || view === 'activity_logs' || view === 'status_selector') {
    return null;
  }

  /** Coquille UX combinée : garde d’accès gérée dans App (programme OU projects). */
  if (view === 'programmes_projects') {
    return null;
  }

  const map: Record<string, ModuleName> = {
    dashboard: 'dashboard',
    projects: 'projects',
    goals_okrs: 'goals_okrs',
    courses: 'courses',
    /** Hub LMS e-learning APEX (`handleSetView` normalise `courses` / `formation` → `apex`). */
    apex: 'courses',
    formation: 'courses',
    course_detail: 'courses',
    course_management: 'course_management',
    jobs: 'jobs',
    create_job: 'jobs',
    job_management: 'job_management',
    crm_sales: 'crm_sales',
    coya_drive: 'coya_drive',
    /** Ancien slug (bookmarks / historique). */
    knowledge_base: 'coya_drive',
    daf_services: 'daf_services',
    leave_management: 'leave_management',
    leave_management_admin: 'leave_management_admin',
    comptabilite: 'comptabilite',
    rh: 'rh',
    /** Coquille salarié `/hr/employees/:id` — même garde d’accès que le module RH. */
    employee_workspace: 'rh',
    planning: 'planning',
    user_management: 'user_management',
    organization_management: 'organization_management',
    department_management: 'department_management',
    settings: 'settings',
    programme: 'programme',
    trinite: 'trinite',
    logistique: 'logistique',
    studio: 'studio',
    parc_auto: 'parc_auto',
    ticket_it: 'ticket_it',
    messagerie: 'messagerie',
    qualite: 'qualite',
    collecte: 'collecte',
    postes_management: 'postes_management',
  };

  if (map[view]) return map[view];
  if (view.startsWith('project') && view !== 'programmes_projects') return 'projects';
  if (view.startsWith('course')) return 'courses';
  return null;
}

const LANDING_ORDER: ModuleName[] = [
  'dashboard',
  'settings',
  'crm_sales',
  'projects',
  'rh',
  'planning',
  'messagerie',
  'goals_okrs',
  'courses',
  'jobs',
  'comptabilite',
  'coya_drive',
  'daf_services',
  'leave_management',
  'programme',
  'trinite',
  'logistique',
  'studio',
  'parc_auto',
  'ticket_it',
  'qualite',
  'collecte',
  'postes_management',
  'department_management',
  'user_management',
  'organization_management',
  'course_management',
  'job_management',
  'leave_management_admin',
];

/** Première vue accessible après connexion (hors super-admin géré par l’appelant). */
export function getFirstAccessibleView(canAccessModule: (m: ModuleName) => boolean): string {
  for (const m of LANDING_ORDER) {
    if (canAccessModule(m)) {
      if (m === 'dashboard') return 'dashboard';
      if (m === 'settings') return 'settings';
      return m;
    }
  }
  return 'pending_access';
}
