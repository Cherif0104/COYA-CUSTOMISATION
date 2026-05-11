/**
 * COYA — Executable Canon (runtime domaine v0)
 *
 * Bus synchrone + orchestrateur + commandes / événements projet.
 * Voir docs/enterprise-canon et domains/projects/.
 */

export { DOMAIN_EVENT_SCHEMA_VERSION, newDomainEventId, type DomainEventEnvelope, type DomainEventSource } from './envelope';
export { getDomainEventBus, resetDomainEventBusForTests, DomainEventBus } from './bus';
export {
  ensureDomainOrchestratorWired,
  dispatchProjectDomainEvents,
  withOrchestratorContext,
  type OrchestratorContext,
} from './orchestrator';
export { collectTaskStatusDomainEvents, isAllowedTaskStatusTransition } from './commands/taskStatus';
export { applyTaskStatusChange, type ApplyTaskStatusChangeContext, type ApplyTaskStatusChangeResult } from './commands/applyTaskStatusChange';
export {
  taskUiStatusToCanon,
  type TaskStatusCanon,
  type ProjectDomainEvent,
  type ProjectDomainEventType,
  type TaskStatusChangedPayload,
} from './events/projectDomainEvents';
export { applyTaskStatusChangedPolicy, type ProjectPolicyResult } from './policies/projectPolicies';
export { persistDomainEventEnvelope, persistDomainEventFireAndForget } from './domainEventPersistence';
export {
  listDomainEventsForProject,
  listDomainEventsByCorrelation,
  type DomainEventRow,
  type ListDomainEventsForProjectParams,
  type ListDomainEventsByCorrelationParams,
} from './domainEventQueries';
export { formatProjectDomainEventViewModel, type DomainEventViewModel } from './viewModels/formatProjectDomainEvent';
