# COYA Enterprise Canon

**Source de vérité** pour l’architecture métier, les événements, les permissions, les workspaces et les projections (cockpits, KPI).

Ce référentiel est **normatif** : le code et l’UI doivent s’y conformer progressivement ; toute dérogation est **documentée et datée**.

## Principes

1. **Domain-first** — la vérité métier vit dans les domaines et agrégats, pas dans les composants React.
2. **Projection** — un écran est une **projection** d’un agrégat ou d’un read model.
3. **Workspace** — toute vue métier suit le [contrat workspace](./WORKSPACE-UX-CONTRACT.md) (5 zones + interdits).
4. **Traçabilité** — états, transitions et événements sont nommés et versionnés.

## Couches cibles

Voir [ARCHITECTURE-LAYERS.md](./ARCHITECTURE-LAYERS.md) : Domain → Workflow (événements) → Read models → Workspace UI.

## Stack COYA (résumé)

| Couche | Rôle | Emplacement principal |
|--------|------|-------------------------|
| **Enterprise Canon** | Vérité métier, événements, permissions, workspaces | `docs/enterprise-canon/`, `domains/` |
| **Runtime domaine** | Bus, commandes, policies, event store | `services/domain/` |
| **UI runtime** | Floorplans et primitives **MAKE FIGMA** | [ui-runtime/index.ts](../../ui-runtime/index.ts) (+ référence `make figma/`) |

**UI unique** : [FIGMA-UI-SOURCE-OF-TRUTH.md](./FIGMA-UI-SOURCE-OF-TRUTH.md) — *MAKE FIGMA = runtime UI officiel* ; le reste est legacy tant qu’il n’est pas migré.

## Runtime exécutable (implémentation v0)

Le canon **n’est pas que de la doc** : une première couche **domaine exécutable** vit dans `services/domain/` (export barrel `services/domain/index.ts`).

- **Bus** : `getDomainEventBus()` — publication / abonnements **synchrones** in-process (navigateur).
- **Événements projet** : `Task.StatusChanged`, `Project.HealthRecalculated` — types dans `services/domain/events/projectDomainEvents.ts`.
- **Commande** : `collectTaskStatusDomainEvents` — transitions alignées sur le modèle UI actuel (`To Do` / `In Progress` / `Completed`).
- **Orchestration** : `dispatchProjectDomainEvents` + politiques dans `services/domain/policies/projectPolicies.ts` (recalcul `buildProjectCockpitReadModel` après changement de statut).
- **UI** : émission après mutation dans `components/ProjectDetailPage.tsx` et le modal liste `ProjectDetailModal` dans `components/Projects.tsx`.
- **Event store (Supabase)** : table append-only `public.domain_events` (migration `supabase/migrations/20260506140000_domain_events_event_store.sql`). Chaque `publish` sur le bus déclenche `persistDomainEventFireAndForget` (`services/domain/domainEventPersistence.ts`) : idempotence `(organization_id, client_event_id)`, RLS par organisation, champs `correlation_id` / `causation_id` (chaîne causale, ex. `Project.HealthRecalculated` causé par `Task.StatusChanged`). `dispatchProjectDomainEvents` assigne un **UUID de corrélation** commun à tout le lot initial.

Évolution prévue : file d’attente, replay contrôlé, générateur de types depuis `domains/*/events.md`, projections matérialisées, rapprochement avec `runWorkflowCycle`.

### Gouvernance événements (anti-chaos)

- [domains/shared/event-catalog.md](../../domains/shared/event-catalog.md) — registre des noms, owners, stabilité.
- [domains/shared/event-classification.md](../../domains/shared/event-classification.md) — domain / integration / internal.
- [domains/shared/event-policies-registry.md](../../domains/shared/event-policies-registry.md) — policies orchestrées.

### Lecture timeline projet

- `listDomainEventsForProject({ organizationId, projectId, limit? })` — `services/domain/domainEventQueries.ts` (export `services/domain`).
- `listDomainEventsByCorrelation(...)` — chaîne liée à un `correlation_id` (support / UX groupée).
- **Commande** `applyTaskStatusChange(project, taskId, updates, ctx)` — mutations tâche centralisées (`services/domain/commands/applyTaskStatusChange.ts`) ; UI (`ProjectDetailPage`, `ProjectDetailModal`) appelle la commande puis `dispatchProjectDomainEvents`.
- **View models** `formatProjectDomainEventViewModel` — libellés métier pour la timeline (`services/domain/viewModels/formatProjectDomainEvent.ts`).

## Domaines (`domains/` à la racine du dépôt)

Index : [domains/README.md](../../domains/README.md).

| Domaine | Dossier | Rôle |
|--------|---------|------|
| Core | `domains/core/` | Multi-tenant, utilisateurs, permissions, audit, notifications |
| Programmes & Projets | `domains/projects/` | Programmes, projets, activités, tâches, exécution |
| Finance & Comptabilité | `domains/finance/` | OHADA, écritures, budgets, trésorerie |
| RH & Présence | `domains/hr/` | Employés, congés, présence, charge |
| CRM | `domains/crm/` | Leads, contacts, opportunités, bailleurs |
| Documents | `domains/documents/` | GED, versions, liens entités, validations |
| Analytics | `domains/analytics/` | KPI, alertes, prévisions (couche lecture) |
| Workflows & orchestration | `domains/workflows/` | Bus d’événements, règles, automatisations transverses |

Chaque dossier contient les **10 fichiers canon** (`overview.md`, `aggregates.md`, …). La **granularité** attendue : une **ligne = une capacité métier** dans les tableaux (agrégats, événements, permissions).

## Phases d’application (rappel)

1. **Geler** le contrat workspace ([WORKSPACE-UX-CONTRACT.md](./WORKSPACE-UX-CONTRACT.md)).
2. **Canoniser** le domaine pilote `projects/` (première source de vérité complète).
3. **Évoluer** le moteur transversal vers un orchestrateur d’événements domaine (voir `domains/workflows/`).
4. **Découper** le routage applicatif (réduction de `App.tsx` monolithique).
5. **Étendre** les autres domaines avec le même niveau de détail.

## Version

| Version | Date | Notes |
|---------|------|--------|
| 0.1.0 | 2026-05-06 | Création du squelette canon + domaine `projects` détaillé |
| 0.2.0 | 2026-05-06 | Runtime `services/domain/` (bus, orchestrateur, branchement changement statut tâche) |
| 0.3.0 | 2026-05-06 | Persistance `domain_events` + corrélation / causalité sur enveloppes |
| 0.4.0 | 2026-05-06 | Gouvernance `domains/shared/` + `listDomainEventsForProject` / by correlation |
| 0.5.0 | 2026-05-06 | Commande `applyTaskStatusChange`, view models d’affichage, timeline corrélée (Historique projet) |
| 0.6.0 | 2026-05-06 | Doctrine MAKE FIGMA = source UI unique + `ui-runtime/` (roadmap) |
| 0.7.0 | 2026-05-06 | UI-2 : primitives + floorplans dans `ui-runtime/` (barrel `index.ts`) |
