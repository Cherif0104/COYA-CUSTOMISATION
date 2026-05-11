/**
 * Événements Workforce liés aux tâches projet.
 */
import { emitActivityEvent } from './activityEventEngine';

export function emitTaskCompletedWorkforce(params: {
  actorId: string | null;
  projectId: string;
  taskId: string;
  taskTitle?: string;
  previousStatus: string;
  nextStatus: string;
}): void {
  try {
    const prev = String(params.previousStatus).toLowerCase().replace(/\s+/g, '');
    const next = String(params.nextStatus).toLowerCase().replace(/\s+/g, '');
    if (next !== 'completed' || prev === 'completed') return;
    const aid = params.actorId ? String(params.actorId) : '';
    if (!aid) return;
    emitActivityEvent({
      actor_worker_id: aid,
      verb: 'task_completed',
      object_refs: [
        { type: 'task', id: String(params.taskId) },
        { type: 'project', id: String(params.projectId) },
      ],
      payload: {
        source: 'projects',
        metadata: {
          task_title: params.taskTitle?.slice(0, 240) ?? '',
        },
      },
    });
  } catch (e) {
    console.warn('[taskActivityBridge]', e);
  }
}
