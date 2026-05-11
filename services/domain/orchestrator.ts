import { getDomainEventBus } from './bus';
import type { DomainEventEnvelope } from './envelope';
import { applyTaskStatusChangedPolicy } from './policies/projectPolicies';
import type { TaskStatusChangedPayload } from './events/projectDomainEvents';
import type { Project, TimeLog, Objective } from '../../types';

let wired = false;

export type OrchestratorContext = {
  /** Projet courant après mutation (pour recalcul read model) */
  project: Project;
  timeLogs: TimeLog[];
  objectives: Objective[];
};

/**
 * Branche les politiques par défaut sur le bus (idempotent).
 */
export function ensureDomainOrchestratorWired(): void {
  if (wired) return;
  const bus = getDomainEventBus();
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    bus.subscribeAll((e) => {
      // eslint-disable-next-line no-console -- instrumentation développement
      console.debug('[COYA domain]', e.type, e.eventId);
    });
  }
  bus.subscribe('Task.StatusChanged', (event) => {
    const env = event as DomainEventEnvelope<'Task.StatusChanged', TaskStatusChangedPayload>;
    const ctx = orchestratorContextRef.current;
    if (!ctx) return;
    const { derivedEvents } = applyTaskStatusChangedPolicy(env, {
      project: ctx.project,
      timeLogs: ctx.timeLogs,
      objectives: ctx.objectives,
    });
    derivedEvents.forEach((e) => bus.publish(e as DomainEventEnvelope));
  });
  wired = true;
}

/** Contexte volatil pour la transaction UI courante (pas de global state métier persistant). */
const orchestratorContextRef: { current: OrchestratorContext | null } = { current: null };

export function withOrchestratorContext<T>(ctx: OrchestratorContext, fn: () => T): T {
  const prev = orchestratorContextRef.current;
  orchestratorContextRef.current = ctx;
  try {
    return fn();
  } finally {
    orchestratorContextRef.current = prev;
  }
}

/**
 * Publie un lot d’événements (et dérivés synchrones) après mutation projet.
 */
export function dispatchProjectDomainEvents(
  events: DomainEventEnvelope[],
  ctx: OrchestratorContext,
): void {
  if (events.length === 0) return;
  ensureDomainOrchestratorWired();
  const bus = getDomainEventBus();
  const batchCorrelation =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `corr-${Date.now()}`;
  const stamped = events.map((e) => ({
    ...e,
    correlationId: e.correlationId ?? batchCorrelation,
  }));
  withOrchestratorContext(ctx, () => {
    stamped.forEach((e) => bus.publish(e));
  });
}
