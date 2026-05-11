# PP-DB-001 — Foundation tables en migrations (PHASE 1)

- **Priorité**: P0
- **Dépendances**: —
- **Owner**: DB/Backend (placeholder)
- **Estimation**: L

## Objectif
Implémenter en migrations (Supabase/Postgres) le schéma “foundation” défini dans `phase-1-data/POSTGRES-SCHEMA-DRAFT.sql`, en mode **additive first** et compatible prod.

## Détail
- Traduire le draft SQL en migrations idempotentes (IF NOT EXISTS, contraintes progressives).
- Ajouter indexes pivots (au minimum `organization_id`, `created_at`, `status`, relations programme/projet/territoire).
- Préparer la base des write-models “operations” (PHASE 3) et “governance” (PHASE 2) sans casser les tables existantes.

## Acceptance criteria
- ✅ Migrations applicables en local/dev/staging (up/down) sans erreurs.
- ✅ Tables/colonnes/contraintes existantes non détruites (“additive first”).
- ✅ Indexes clés présents (tenant isolation + requêtes list/detail).
- ✅ Aucune table créée en `public` n’est exposée sans RLS (voir PP-DB-002 / PP-SEC-001).

## Stratégie de test
- **Migration tests**: exécuter up/down, vérifier idempotence (re-run sans changement).
- **Smoke**: CRUD minimal sur tables foundation avec rôle `authenticated` + org scope.
- **Perf**: EXPLAIN sur requêtes list “par org / programme / date”.

