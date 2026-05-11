/** Enveloppe commune des événements domaine (Executable Canon v0). */

export const DOMAIN_EVENT_SCHEMA_VERSION = 1 as const;

export type DomainEventSource = 'ui' | 'api' | 'workflow' | 'system';

export interface DomainEventEnvelope<TType extends string = string, TPayload = unknown> {
  eventId: string;
  type: TType;
  occurredAt: string;
  schemaVersion: typeof DOMAIN_EVENT_SCHEMA_VERSION;
  /** Multi-tenant — requis dès que disponible côté appelant */
  organizationId: string | null;
  actorId?: string | null;
  source: DomainEventSource;
  payload: TPayload;
  /** Identifiant de corrélation (même workflow / même commande utilisateur) */
  correlationId?: string | null;
  /** Id d’événement parent (chaîne de causalité) */
  causationId?: string | null;
}

export function newDomainEventId(prefix: string): string {
  const base =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}:${base}`;
}
