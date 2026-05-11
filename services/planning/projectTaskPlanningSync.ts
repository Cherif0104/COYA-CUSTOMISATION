import type { Project, Task } from '../../types';
import { DataAdapter } from '../dataAdapter';
import { timeToMinutes, minutesToHHmm } from './dayTimelineLayout';

const notesMarker = (projectId: string, taskId: string) => `COYA_TASK_SYNC:${projectId}:${taskId}`;
export const taskSyncNotesPrefix = (projectId: string) => `COYA_TASK_SYNC:${projectId}:`;

function resolveAssigneeUserId(task: Task): string | null {
  if (task.assignee?.id != null && String(task.assignee.id).trim()) return String(task.assignee.id);
  const first = task.assigneeIds?.find((id) => id && String(id).trim());
  return first ? String(first) : null;
}

function resolveSlotDate(task: Task): string | null {
  const raw = (task.scheduledDate || task.dueDate || '').trim().slice(0, 10);
  if (raw.length >= 10 && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

/**
 * Recrée les créneaux planning issus des tâches projet (date + assigné + plage horaire).
 * Les lignes précédentes portent le marqueur `notes` = `COYA_TASK_SYNC:{projectId}:{taskId}`.
 */
export async function syncProjectTasksToPlanningSlots(project: Project): Promise<void> {
  const prefix = taskSyncNotesPrefix(project.id);
  try {
    await DataAdapter.deletePlanningSlotsByNotesPrefix(prefix);
  } catch {
    return;
  }

  const tasks = project.tasks || [];
  for (const task of tasks) {
    if (task.status === 'Completed') continue;
    const userId = resolveAssigneeUserId(task);
    const slotDate = resolveSlotDate(task);
    if (!userId || !slotDate) continue;

    const startM = timeToMinutes((task.scheduledTime || '09:00').slice(0, 5)) ?? 9 * 60;
    const dur = Math.max(15, Math.min(task.scheduledDurationMinutes ?? 60, 12 * 60));
    const endM = Math.min(startM + dur, 24 * 60 - 1);
    const startTime = minutesToHHmm(startM);
    const endTime = minutesToHHmm(endM);

    await DataAdapter.createPlanningSlot({
      userId,
      slotDate,
      slotType: 'other',
      startTime,
      endTime,
      title: `Tâche : ${(task.text || 'Sans titre').slice(0, 120)}`,
      notes: notesMarker(project.id, task.id),
    });
  }
}
