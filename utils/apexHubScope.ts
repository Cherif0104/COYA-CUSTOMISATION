import type { Role } from '../types';

/** Portée pilotage / permissions affichée dans le hub (spec APEX). */
export type ApexHubPilotScope = 'global' | 'programs' | 'cohorts' | 'personal';

const ADMIN_ROLES = new Set<Role>(['super_administrator', 'administrator']);
const MANAGER_ROLES = new Set<Role>([
  'manager',
  'supervisor',
  'team_lead',
  'hr_business_partner',
  'hr_officer',
  'recruiter',
  'payroll_specialist',
  'implementer',
  'funder',
]);
const TRAINER_ROLES = new Set<Role>(['trainer', 'coach', 'facilitator', 'partner_facilitator', 'mentor']);
const LEARNER_ROLES = new Set<Role>(['student', 'alumni']);

export function deriveApexHubPilotScope(role: string | undefined): ApexHubPilotScope {
  const r = role as Role | undefined;
  if (!r) return 'personal';
  if (ADMIN_ROLES.has(r)) return 'global';
  if (MANAGER_ROLES.has(r)) return 'programs';
  if (TRAINER_ROLES.has(r)) return 'cohorts';
  if (LEARNER_ROLES.has(r)) return 'personal';
  return 'programs';
}

export function apexPilotScopeLabel(scope: ApexHubPilotScope, isFr: boolean): string {
  if (isFr) {
    switch (scope) {
      case 'global':
        return 'Vue globale (admin)';
      case 'programs':
        return 'Programmes / projets assignés';
      case 'cohorts':
        return 'Cohortes & formations liées';
      default:
        return 'Vue personnelle (apprenant)';
    }
  }
  switch (scope) {
    case 'global':
      return 'Global view (admin)';
    case 'programs':
      return 'Assigned programs / projects';
    case 'cohorts':
      return 'Linked cohorts & trainings';
    default:
      return 'Personal (learner) view';
  }
}
