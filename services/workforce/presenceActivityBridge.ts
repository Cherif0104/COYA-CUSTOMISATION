/**
 * Émet des Activity Events après changements de présence (Workforce OS).
 * @see docs/HUMAN-CAPITAL-WORKFORCE-INTELLIGENCE-OS-ARCHITECTURE.md
 */
import type { PresenceSession, PresenceStatus } from '../../types';
import { emitActivityEvent } from './activityEventEngine';

const PAUSE_STATUSES = new Set<PresenceStatus>(['pause', 'pause_coffee', 'pause_lunch']);

function isActiveSession(s: PresenceSession | null | undefined): boolean {
  if (!s) return false;
  if (s.status === 'absent') return false;
  if (s.endedAt) return false;
  return true;
}

function isPauseStatus(s: PresenceStatus): boolean {
  return PAUSE_STATUSES.has(s);
}

export type PresenceTransitionContext = {
  actorUserId: string;
  prevSession: PresenceSession | null;
  nextSession: PresenceSession | null;
  newStatus: PresenceStatus;
  /** Mise à jour meeting_id uniquement (statut inchangé) */
  meetingOnlyUpdate: boolean;
  meetingId?: string | null;
};

/**
 * À appeler après une transition réussie (état déjà cohérent côté client).
 * Ne lance pas d’exception (best-effort analytics).
 */
export function emitPresenceActivityEvents(ctx: PresenceTransitionContext): void {
  try {
    const { actorUserId, prevSession, nextSession, newStatus, meetingOnlyUpdate } = ctx;
    const prevStatus = prevSession?.status ?? 'absent';
    const prevActive = isActiveSession(prevSession);
    const nextActive = isActiveSession(nextSession);

    if (meetingOnlyUpdate) {
      emitActivityEvent({
        actor_worker_id: actorUserId,
        verb: 'imputation_recorded',
        object_refs: [],
        payload: {
          source: 'presence',
          metadata: {
            presence_session_id: String(nextSession?.id ?? prevSession?.id ?? ''),
            meeting_id: ctx.meetingId ?? null,
            kind: 'presence_meeting_link',
          },
        },
      });
      return;
    }

    if (prevSession && isPauseStatus(prevStatus) && !isPauseStatus(newStatus)) {
      emitActivityEvent({
        actor_worker_id: actorUserId,
        verb: 'break_end',
        object_refs: [],
        payload: {
          source: 'presence',
          metadata: { from_status: prevStatus, to_status: newStatus },
        },
      });
    }

    if (nextActive && isPauseStatus(newStatus) && prevActive && !isPauseStatus(prevStatus)) {
      emitActivityEvent({
        actor_worker_id: actorUserId,
        verb: 'break_start',
        object_refs: [],
        payload: {
          source: 'presence',
          metadata: { from_status: prevStatus, to_status: newStatus },
        },
      });
    }

    if (prevActive && !nextActive) {
      emitActivityEvent({
        actor_worker_id: actorUserId,
        verb: 'presence_session_closed',
        object_refs: [],
        payload: {
          source: 'presence',
          metadata: {
            presence_session_id: String(prevSession?.id ?? ''),
            ended_status: newStatus,
          },
        },
      });
    }

    if (!prevActive && nextActive) {
      emitActivityEvent({
        actor_worker_id: actorUserId,
        verb: 'presence_session_opened',
        object_refs: [],
        payload: {
          source: 'presence',
          metadata: {
            presence_session_id: String(nextSession?.id ?? ''),
            status: nextSession?.status ?? newStatus,
          },
        },
      });
    }
  } catch (e) {
    console.warn('[presenceActivityBridge]', e);
  }
}
