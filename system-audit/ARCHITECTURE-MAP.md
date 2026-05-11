# System Architecture Map — COYA

## 1. Vue d’ensemble

COYA est une **application React (Vite) monolithique frontale** avec **Supabase** (auth, données, temps réel) et une **orientation progressive** vers un **runtime domaine** (projets) et un **canon métier documenté** (`domains/`).

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  (orchestration vues, état global, chargement données)       │
└───────────────┬─────────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬──────────────┬──────────────────┐
    ▼           ▼           ▼              ▼                  ▼
 Sidebar    Header      renderView()   PresenceProvider   AIAgent / overlays
                │
                ├── viewRegistry (modules tech, messagerie, …)
                ├── switch(currentView) → Dashboard, CRM, RhModule, Finance…
                └── URLs legacy : /projects/:id, /hr/employees/:profileId
```

## 2. Frontend — structure

| Couche | Rôle | Emplacement typique |
|--------|------|----------------------|
| **Vues / modules** | Écrans métier | `components/*.tsx`, `components/*/` |
| **Design system runtime** | Floorplans, KPI, tabs, workspace shell | `ui-runtime/` |
| **RH workforce UI** | Live, dock, workspace shell | `components/hr/`, `components/hr/workforce-live/` |
| **Contexts** | Auth, présence, localisation, navigation | `contexts/` |
| **Hooks** | Permissions, labels modules | `hooks/` |
| **Types** | Modèle de données partagé | `types.ts` |

## 3. Accès données & services

| Type | Rôle |
|------|------|
| **DataAdapter** | Façade API / Supabase métier | `services/dataAdapter.ts` |
| **DataService** | Accès bas niveau / profiles / sessions | `services/dataService.ts` |
| **Services métier** | CRM, paie, planning, journal, etc. | `services/*.ts` |
| **Analytics RH** | Présence, compliance, agrégats | `services/hrAnalyticsService.ts` |

## 4. Runtime domaine (exécutable partiel)

| Élément | Rôle | Emplacement |
|---------|------|-------------|
| **Bus + orchestrateur** | Dispatch synchrone, contexte | `services/domain/bus.ts`, `orchestrator.ts` |
| **Commandes** | Ex. changement statut tâche | `services/domain/commands/` |
| **Événements projet** | Types + collecte | `services/domain/events/projectDomainEvents.ts` |
| **Policies** | Règles projet (tâches) | `services/domain/policies/projectPolicies.ts` |
| **Persistance événements** | Table `domain_events` | `domainEventPersistence.ts`, `domainEventQueries.ts` |

**Limite actuelle** : le runtime « exécutable » est **centré projet / tâches** ; RH, finance, CRM ne passent pas encore par le même bus de manière homogène.

## 5. Workflows transverses

| Composant | Rôle |
|-----------|------|
| **workflowEngine** | Cycle de scan (projets, objectifs, congés, factures, réunions) → actions (notif, mises à jour) | `services/workflowEngine.ts` |
| **Realtime** | Abonnements | `services/realtimeService.ts` |

## 6. Canon domaine (documentation)

| Dossier | Rôle |
|---------|------|
| `domains/` | Bounded contexts : overview, events, commands, policies, read-models, workspace-contract |
| `domains/shared/` | Catalogue d’événements transverses |
| `domains/hr/attendance-runtime.md` | Cible RH-5 présence / événements |

## 7. Dépendances critiques

- **App.tsx** : point central (navigation, données, vues) — voir [technical-debt](../technical-debt/TECHNICAL-DEBT-REPORT.md).
- **Supabase** : auth + RLS (non audité ligne par ligne dans ce pack ; risque à traiter au [Domain Runtime Audit](../domain-audit/DOMAIN-RUNTIME-AUDIT.md) et tests RLS).

## 8. Schéma logique « plateforme »

```txt
[ UX Workspaces + CRUD legacy ]
           │
           ▼
[ DataAdapter / Services ] ─────► [ Supabase + RLS ]
           │
           ├──► [ workflowEngine ] ──► notifications / mises à jour
           │
           └──► [ domain / projet ] ──► domain_events (piloté projet)
```

**Écart ERP idéal** : une couche **Command** et des **projections** explicites par module, avec bus unique et politiques versionnées — partiellement en place pour **projets** seulement.
