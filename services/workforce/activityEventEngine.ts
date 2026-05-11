import type { ActivityEvent, ActivityEventInput } from './types/workforceEvents';

/** Persistance append-only — implémentations fournies : noop, mémoire */
export interface ActivityEventPersistence {
  append(event: ActivityEvent): void | Promise<void>;
}

export class NoopActivityEventPersistence implements ActivityEventPersistence {
  append(): void {}
}

export class InMemoryActivityEventPersistence implements ActivityEventPersistence {
  private readonly events: ActivityEvent[] = [];

  append(event: ActivityEvent): void {
    this.events.push(event);
  }

  /** Lecture débogage / tests — log append-only */
  getSnapshot(): readonly ActivityEvent[] {
    return this.events;
  }
}

/** Enchaîne plusieurs persisteurs (événements + segments timeline, etc.). */
export class ChainedActivityEventPersistence implements ActivityEventPersistence {
  constructor(private readonly chain: ActivityEventPersistence[]) {}

  append(event: ActivityEvent): void | Promise<void> {
    const pending: Promise<void>[] = [];
    for (const p of this.chain) {
      const r = p.append(event);
      if (r instanceof Promise) pending.push(r);
    }
    if (pending.length === 0) return;
    return Promise.all(pending).then(() => undefined);
  }
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

export function normalizeActivityEvent(input: ActivityEventInput): ActivityEvent {
  const occurred_at = input.occurred_at ?? new Date().toISOString();
  const event_id = input.event_id ?? newEventId();
  return {
    ...input,
    event_id,
    occurred_at,
    object_refs: input.object_refs ?? [],
  };
}

export class ActivityEventEngine {
  private readonly persistence: ActivityEventPersistence;
  private readonly subscribers = new Set<(event: ActivityEvent) => void>();

  constructor(options?: { persistence?: ActivityEventPersistence }) {
    this.persistence = options?.persistence ?? new NoopActivityEventPersistence();
  }

  subscribeActivityEvents(handler: (event: ActivityEvent) => void): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  emitActivityEvent(input: ActivityEventInput): ActivityEvent {
    const event = normalizeActivityEvent(input);
    const appendResult = this.persistence.append(event);
    if (appendResult instanceof Promise) {
      appendResult.catch((e) =>
        console.error('[ActivityEventEngine] persistence append failed', e),
      );
    }
    this.subscribers.forEach((h) => {
      try {
        h(event);
      } catch (e) {
        console.error('[ActivityEventEngine] subscriber error', e);
      }
    });
    return event;
  }
}

let defaultEngine: ActivityEventEngine | null = null;

function getOrCreateDefaultEngine(): ActivityEventEngine {
  if (!defaultEngine) defaultEngine = new ActivityEventEngine();
  return defaultEngine;
}

/**
 * Enregistre une implémentation de persistance sur le moteur par défaut.
 * À appeler une fois au démarrage si vous sortez du noop / mémoire.
 */
export function configureDefaultActivityEventPersistence(
  persistence: ActivityEventPersistence,
): void {
  defaultEngine = new ActivityEventEngine({ persistence });
}

/** Réinitialise le singleton (tests uniquement) */
export function resetDefaultActivityEventEngineForTests(): void {
  defaultEngine = null;
}

export function emitActivityEvent(input: ActivityEventInput): ActivityEvent {
  return getOrCreateDefaultEngine().emitActivityEvent(input);
}

export function subscribeActivityEvents(
  handler: (event: ActivityEvent) => void,
): () => void {
  return getOrCreateDefaultEngine().subscribeActivityEvents(handler);
}
