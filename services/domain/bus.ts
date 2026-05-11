import type { DomainEventEnvelope } from './envelope';
import { persistDomainEventFireAndForget } from './domainEventPersistence';

type WildcardHandler = (event: DomainEventEnvelope) => void;

/**
 * Bus synchrone in-process (navigateur). Cible future : file + workers / Edge.
 */
export class DomainEventBus {
  private readonly wildcard = new Set<WildcardHandler>();
  private readonly byType = new Map<string, Set<WildcardHandler>>();

  subscribeAll(handler: WildcardHandler): () => void {
    this.wildcard.add(handler);
    return () => this.wildcard.delete(handler);
  }

  subscribe(eventType: string, handler: WildcardHandler): () => void {
    let set = this.byType.get(eventType);
    if (!set) {
      set = new Set();
      this.byType.set(eventType, set);
    }
    set.add(handler as WildcardHandler);
    return () => {
      set!.delete(handler as WildcardHandler);
      if (set!.size === 0) this.byType.delete(eventType);
    };
  }

  publish(event: DomainEventEnvelope): void {
    const typed = this.byType.get(event.type);
    if (typed) {
      typed.forEach((h) => {
        try {
          h(event);
        } catch (e) {
          console.error('[DomainEventBus] handler error', event.type, e);
        }
      });
    }
    this.wildcard.forEach((h) => {
      try {
        h(event);
      } catch (e) {
        console.error('[DomainEventBus] wildcard handler error', e);
      }
    });
    persistDomainEventFireAndForget(event);
  }
}

let singleton: DomainEventBus | null = null;

export function getDomainEventBus(): DomainEventBus {
  if (!singleton) singleton = new DomainEventBus();
  return singleton;
}

export function resetDomainEventBusForTests(): void {
  singleton = null;
}
