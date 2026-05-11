import type { ModuleName } from '../types';

/** Vue liste projets : coquille unifiée si les deux modules sont autorisés. */
export function projectsHomeView(canAccessModule: (m: ModuleName) => boolean): string {
  if (canAccessModule('programme') && canAccessModule('projects')) {
    return 'programmes_projects';
  }
  return 'projects';
}
