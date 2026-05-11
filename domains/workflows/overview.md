# Domaine — Workflows & orchestration

## Vision

**Orchestration transverse** : bus d’événements domaine, règles d’automatisation, notifications, idempotence, files, compensations — pont entre tous les bounded contexts.

## État actuel (code)

- `services/workflowEngine.ts` : logique **transversale** partielle (cycle, KPI, actions).
- **`services/domain/` (v0 — Executable Canon)** : bus synchrone `DomainEventBus`, enveloppes `DomainEventEnvelope`, commande `collectTaskStatusDomainEvents`, orchestrateur `ensureDomainOrchestratorWired` + `dispatchProjectDomainEvents`, politique `applyTaskStatusChangedPolicy` (recalcul read model cockpit + événement dérivé `Project.HealthRecalculated`). Branchement UI : changement de statut de tâche dans `ProjectDetailPage.tsx` et `Projects.tsx` (`ProjectDetailModal`).
- **Event store** : table Supabase `domain_events` + `persistDomainEventFireAndForget` après chaque `publish` (append-only, RLS org, idempotence client `eventId`).
- **Cible** : files async, replay, règles externalisées, fusion contrôlée avec `runWorkflowCycle`.

## Principes

- Les domaines **émettent** des événements ; ce module **ne possède** pas la vérité métier des agrégats.
- Règles **nommées**, **testables**, **idempotentes**.

## Relation IA

L’IA consomme les mêmes **événements** et **read models** ; elle ne court-circuite pas les validations métier.
