/**
 * Événements domaine « Programmes & Projets » — alignés sur domains/projects/events.md.
 * Les types UI (Task.status) sont mappés en codes canon pour la traçabilité.
 */

import type { Task } from '../../../types';

/** Codes état tâche canon (doc domains/projects/states.md) — sous-ensemble couvert par l’UI actuelle */
export type TaskStatusCanon = 'todo' | 'in_progress' | 'done';

export function taskUiStatusToCanon(status: Task['status']): TaskStatusCanon {
  if (status === 'Completed') return 'done';
  if (status === 'In Progress') return 'in_progress';
  return 'todo';
}

export type ProjectDomainEventType = 'Task.StatusChanged' | 'Project.HealthRecalculated';

export type TaskStatusChangedPayload = {
  projectId: string;
  taskId: string;
  from: TaskStatusCanon;
  to: TaskStatusCanon;
  taskTitle?: string;
};

export type ProjectHealthRecalculatedPayload = {
  projectId: string;
  /** Résumé optionnel pour read models / logs */
  reason?: string;
};

export type ProjectDomainEvent =
  | { type: 'Task.StatusChanged'; payload: TaskStatusChangedPayload }
  | { type: 'Project.HealthRecalculated'; payload: ProjectHealthRecalculatedPayload };
