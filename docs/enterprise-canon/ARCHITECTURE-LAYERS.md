# Couches d’architecture cible COYA

Séparation explicite pour sortir du modèle « tout dans React / App.tsx ».

## 1. Domain Layer (vérité métier)

- **Agrégats**, invariants, règles de cohérence.
- **Machines à états** et transitions autorisées (voir `states.md` par domaine).
- **Commandes** métier (créer tâche, valider écriture, approuver congé) — à terme : services / modules TypeScript dédiés ou équivalent serveur (Edge, RPC).
- La persistance (Supabase) reflète le modèle ; **RLS** alignée sur `permissions.md`.

## 2. Workflow Layer (événements & orchestration)

- **Événements domaine** nommés (catalogue `events.md` + `domains/workflows/`).
- Orchestration : règles du type « si X alors notifications + mise à jour read model + blocage Y ».
- État actuel : logique partiellement dans `services/workflowEngine.ts` — **cible** : bus d’événements + orchestrateur idempotent (voir `domains/workflows/overview.md`).

## 3. Read Model Layer (cockpits & analytics)

- Vues dérivées : KPI, santé projet, tableaux de bord, listes enrichies.
- **Pas** de source de vérité transactionnelle : recalcul / projection à partir d’événements ou de snapshots.
- Fichiers `read-models.md` et `kpis.md` par domaine.

## 4. Workspace Layer (expérience)

- Application stricte du [WORKSPACE-UX-CONTRACT.md](./WORKSPACE-UX-CONTRACT.md).
- Composants = **projections** ; pas de règles métier critiques cachées uniquement dans l’UI.

## Flux événementiel cible (résumé)

```
Domain (commande) → persistance + événements émis
    → Event bus
        → Workflow engine (règles)
        → Read models (KPI, cockpit)
        → Notifications / automatisations
        → Workspace UI (rafraîchissement / realtime)
```

## Règle d’or

**Une page React n’est pas un domaine** — c’est une projection. Le domaine vit dans la couche 1 et ses contrats (`aggregates.md`, `states.md`, `events.md`).
