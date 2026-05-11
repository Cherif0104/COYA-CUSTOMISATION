/**
 * Émet un Activity Event lors de l’enregistrement d’un temps sur entité métier.
 */
import type { TimeLog } from '../../types';
import { emitActivityEvent } from './activityEventEngine';
import type { WorkforceObjectRef } from './types/workforceEvents';

function refsFromTimeLog(log: TimeLog): WorkforceObjectRef[] {
  const id = String(log.entityId);
  switch (log.entityType) {
    case 'project':
      return [{ type: 'project', id }];
    case 'programme':
      return [{ type: 'programme', id }];
    case 'task':
      return [{ type: 'task', id }];
    case 'course':
      return [];
    default:
      return [];
  }
}

export function emitTimeLogImputationEvent(log: TimeLog): void {
  try {
    const durationSeconds = Math.max(0, Math.round(Number(log.duration) * 60));
    const refs = refsFromTimeLog(log);
    emitActivityEvent({
      actor_worker_id: String(log.userId),
      verb: 'imputation_recorded',
      object_refs: refs,
      payload: {
        source: 'planning',
        duration_seconds: durationSeconds,
        note: log.description?.slice(0, 500) || undefined,
        metadata: {
          time_log_id: String(log.id),
          entity_type: log.entityType,
          entity_title: log.entityTitle,
          date: log.date,
          ...(log.entityType === 'course'
            ? { course_entity_id: String(log.entityId) }
            : {}),
        },
      },
    });
  } catch (e) {
    console.warn('[timeLogActivityBridge]', e);
  }
}
