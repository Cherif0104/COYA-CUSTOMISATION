# Executable Canon Audit — COYA (event-driven)

## 1. Périmètre analysé

- `services/domain/` (bus, orchestrateur, commandes, events, policies, persistance, queries)
- `services/workflowEngine.ts` (cycle transverse)
- Références `domain_events` dans l’UI (`HistoryWorkspaceTab`, etc.)

## 2. Event Bus (`bus.ts` + `orchestrator.ts`)

| Critère | Évaluation |
|---------|------------|
| Architecture | **Bus synchrone** + orchestrateur ; contexte explicite |
| Couplage | **Modéré** : consommateurs enregistrés sur le bus projet |
| Cycles | Risque **moyen** si handlers se rappellent mutuellement — à surveiller lors d’extensions |
| Duplication | **workflowEngine** vs **domain bus** : deux styles ; **documenter** la règle d’usage |

## 3. Event Store (`domain_events`)

| Critère | Évaluation |
|---------|------------|
| Append-only | **Intention** via `persistDomainEventEnvelope` |
| Schéma | Envelope versionnée (`envelope.ts`) |
| RLS / index | **À valider** en base (audit Supabase hors ce fichier) |
| Replayabilité | **Partielle** — pas d’outil de replay documenté dans le repo |
| Idempotence | **À renforcer** côté insert (clé idempotence métier si multi-clients) |

## 4. Policies

- **Projets** : `projectPolicies.ts` — **lisible**, testable.
- **Transverse** : workflowEngine contient des **règles ad hoc** — risque de **dispersion** si elles dupliquent le domaine.

## 5. Read models

- **Projet** : `buildProjectCockpitReadModel`, vues dans `ProjectDetailPage`.
- **Global** : pas de couche read-model **unique** pour tous modules.

## 6. Commands

| Exemple | Statut |
|---------|--------|
| `applyTaskStatusChange` | **Bien** : point d’entrée commande + events |
| Mutations React directes | **Nombreuses** hors ce chemin (dettes) |

## 7. Synthèse « Executable Canon »

| Force | Limite |
|-------|--------|
| Pattern **command + event + policy** sur **tâches/projet** | Non généralisé |
| Persistance `domain_events` | **Usage UI** dépend migrations / RLS |
| Orchestration | **Claire** pour dispatch projet |

**Recommandations prioritaires**

1. Écrire **`docs/runtime-boundary.md`** : quand utiliser `workflowEngine` vs `dispatchProjectDomainEvents`.
2. Ajouter **tests d’intégration** bus + `applyTaskStatusChange` (voir `erp-test-strategy/`).
3. Planifier **envelope unique** pour événements RH une fois le moteur présence stabilisé.
