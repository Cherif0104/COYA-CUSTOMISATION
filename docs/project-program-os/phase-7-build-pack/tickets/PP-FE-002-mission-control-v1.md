# PP-FE-002 — Mission Control v1 (ops dashboard)

- **Priorité**: P0
- **Dépendances**: PP-BE-001, PP-BE-004, PP-OFF-001, PP-OBS-001
- **Owner**: Frontend (placeholder)
- **Estimation**: M

## Objectif
Livrer une première version de “Mission Control” (PHASE 3/4) permettant aux équipes d’opérations de piloter l’exécution: visibilité sur missions/activités, état de sync, et accès aux actions critiques — sans compromettre l’isolation tenant (RLS-first).

## Périmètre / non-objectif
- **Périmètre**:
  - Vues read-only + actions minimales (P0) sur entités opérations (liste + détail).
  - Indicateurs de santé: sync (pending/failed), erreurs récentes corrélées (`correlation_id`).
  - Filtrage/tri stables (période, programme/projet/territoire) alignés sur conventions API.
- **Non-objectif**:
  - Analytics avancés (voir PP-FE-005).
  - Gestion complète des workflows/approvals (voir PP-FE-004 et WF tickets).

## Acceptance criteria
- ✅ La page Mission Control affiche au minimum: liste + détail + filtres de base sur un domaine opérationnel clé.
- ✅ Les appels API respectent le contrat multi-tenant: aucune donnée cross-tenant n’est affichée (tests dédiés).
- ✅ L’UI expose l’état de sync local (si offline/outbox présent) et un accès au détail des erreurs de sync (au moins un écran).
- ✅ Les éléments affichés peuvent être tracés via `correlation_id` (affichage/inspect) quand disponible.

## Stratégie de test
- **Unit**: logique de filtrage/tri, transformations read-model → UI, composants d’état.
- **Integration**: API mock + tests de non-régression sur pagination/tri stable; erreurs API mappées.
- **E2E**: parcours “opérateur” (tenant A) + tentative d’accès ressources tenant B (refus/empty) + vérif UI.
