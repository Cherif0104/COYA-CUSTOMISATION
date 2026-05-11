import type { WorkforceTimelineSegmentRow } from '../types';

const DEMO_ORG = '00000000-0000-0000-0000-000000000001';
const DEMO_USER = '00000000-0000-0000-0000-000000000002';

function atLocalDay(dayKey: string, hour: number, minute: number): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

/**
 * Segments timeline Workforce pour le mode hors Supabase (démo locale).
 * Les `segmentKind` suivent `ActivityTimelineSegmentKind` (voir services/workforce).
 */
export function buildWorkforceDemoTimelineSegments(dayKey: string): WorkforceTimelineSegmentRow[] {
  const seg = (
    id: string,
    segmentKind: string,
    startH: number,
    startM: number,
    endH: number,
    endM: number,
    operationalContext?: string | null,
    payloadExtra?: Record<string, unknown>,
  ): WorkforceTimelineSegmentRow => ({
    id: `demo-seg-${id}`,
    organizationId: DEMO_ORG,
    createdByUserId: DEMO_USER,
    workerId: 'demo-local-worker',
    segmentKind,
    operationalContext: operationalContext ?? null,
    startedAt: atLocalDay(dayKey, startH, startM).toISOString(),
    endedAt: atLocalDay(dayKey, endH, endM).toISOString(),
    sourceClientEventId: `demo-client-${id}`,
    payload: { demo: true, ...payloadExtra },
    createdAt: atLocalDay(dayKey, 8, 0).toISOString(),
  });

  return [
    seg('morning', 'system_connected', 8, 30, 8, 45, 'remote', { label: 'Connexion matin' }),
    seg('focus1', 'productive_output', 9, 0, 10, 30, 'remote', { projectTitle: 'Campagne Q4' }),
    seg('break1', 'declared_break', 10, 30, 10, 45, null),
    seg('collab', 'collaboration', 10, 45, 11, 30, 'client_call', { label: 'Point équipe' }),
    seg('biz', 'business_activity', 11, 30, 12, 30, 'office', { label: 'Traitement courrier / admin' }),
    seg('afternoon', 'productive_output', 14, 0, 16, 0, 'remote', { projectTitle: 'Chatbot support' }),
    seg('overlap-demo', 'business_activity', 15, 0, 15, 45, 'hybrid', { note: 'Chevauche partiellement 14h–16h pour tester la fusion' }),
  ];
}
