# Executable Canon Audit — event-driven (COYA)

## Zone analysée

- `services/domain/*` : bus, orchestrateur, commandes, events, policies, persistance `domain_events`
- `services/workflowEngine.ts`
- UI qui lit / affiche `domain_events` (workspace projet)

## Constats

- **Pattern command/event/policy** est bien amorcé sur **projets**.
- **Event store** : table `domain_events` (append-only intention), envelope versionné.
- **Duplication philosophique** : `workflowEngine` (automation imperatif) vs `services/domain` (write-side métier).

## Risques

- Extension RH/finance sans boundary = spaghetti runtime.
- Idempotence/replay `domain_events` à renforcer si multi-clients / offline.

## Recommandations

1. Document normatif : `docs/runtime-boundary.md`.
2. Tests d’intégration bus + commande projet (et plus tard RH présence).
3. Préparer envelope unique RH après stabilisation présence.

