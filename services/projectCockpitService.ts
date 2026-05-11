import type { Objective, Project, TimeLog } from '../types';
import { buildProjectCockpitReadModel, type ProjectCockpitReadModel } from './projectCockpitReadModel';

/**
 * UI consumer helper — évite de disperser des calculs KPI dans les composants.
 * À terme, ce service sera remplacé par une projection CQRS côté DB (project_cockpit_read_models).
 */
export function getProjectCockpitSnapshot(params: {
  project: Project;
  timeLogs: TimeLog[];
  objectives?: Objective[];
}): ProjectCockpitReadModel {
  return buildProjectCockpitReadModel(params.project, params.timeLogs, params.objectives ?? []);
}

