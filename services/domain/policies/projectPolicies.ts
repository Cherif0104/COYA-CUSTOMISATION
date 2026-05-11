import type { DomainEventEnvelope } from '../envelope';
import type { TaskStatusChangedPayload } from '../events/projectDomainEvents';
import { newDomainEventId, DOMAIN_EVENT_SCHEMA_VERSION } from '../envelope';
import type { ProjectDomainEvent } from '../events/projectDomainEvents';
import { buildProjectCockpitReadModel } from '../../projectCockpitReadModel';
import type { Project, TimeLog, Objective } from '../../../types';

/**
 * Effets secondaires déterministes après événements projet (phase 1 : projection cockpit + événement dérivé).
 * Pas d’I/O réseau ici — uniquement structures pures pour enchaînements futurs (notif, persistance event store).
 */
export type ProjectPolicyResult = {
  /** Événements dérivés à publier après le traitement du lot courant */
  derivedEvents: DomainEventEnvelope<ProjectDomainEvent['type'], unknown>[];
  /** Snapshot cockpit post-changement (pour debug / futur cache read model) */
  cockpitSnapshot?: ReturnType<typeof buildProjectCockpitReadModel>;
};

export function applyTaskStatusChangedPolicy(
  event: DomainEventEnvelope<'Task.StatusChanged', TaskStatusChangedPayload>,
  context: { project: Project; timeLogs: TimeLog[]; objectives: Objective[] },
): ProjectPolicyResult {
  const { projectId } = event.payload;
  if (String(context.project.id) !== String(projectId)) {
    return { derivedEvents: [] };
  }
  const cockpitSnapshot = buildProjectCockpitReadModel(context.project, context.timeLogs, context.objectives);
  const derived: DomainEventEnvelope<'Project.HealthRecalculated', { projectId: string; reason?: string }>[] = [
    {
      eventId: newDomainEventId('evt.project.health'),
      type: 'Project.HealthRecalculated',
      occurredAt: new Date().toISOString(),
      schemaVersion: DOMAIN_EVENT_SCHEMA_VERSION,
      organizationId: event.organizationId,
      actorId: null,
      source: 'system',
      correlationId: event.correlationId ?? null,
      causationId: event.eventId,
      payload: {
        projectId: String(projectId),
        reason: 'Task.StatusChanged',
      },
    },
  ];
  return { derivedEvents: derived, cockpitSnapshot };
}
