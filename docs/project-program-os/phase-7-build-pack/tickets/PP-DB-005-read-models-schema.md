# PP-DB-005 — Schéma read-models (CQRS projections)

- **Priorité**: P0 (cockpit Programme minimal)
- **Dépendances**: PP-DB-001, PP-DB-002, PP-DB-003, PP-BE-004
- **Owner**: Backend/DB (placeholder)
- **Estimation**: L

## Objectif
Définir et migrer les schémas de read-models nécessaires aux vues opérationnelles, workflows et KPI (PHASE 3–5) en alignement CQRS: tables matérialisées/projections, clés de jointure stables, et auditabilité.

## Périmètre / non-objectif
- **Périmètre**:
  - Tables de projections par domaine (ops, workflow, incidents, KPI aggregations) avec `organization_id`.
  - Stratégie de refresh: incrémental via événements/outbox; marqueurs de version/offset (watermarks).
  - Indexation et contraintes garantissant des lectures rapides (dashboards/exports).
- **Non-objectif**:
  - Implémentation du worker de projections (côté backend, PP-BE-004).
  - Visualisation UI (tickets FE/REP).

## Acceptance criteria
- ✅ Les schémas des projections P0/P1 existent, migrés, et documentés (colonnes, clés, sources).
- ✅ Chaque projection a un “watermark” (event offset / last_event_id / last_processed_at) pour audit et replay.
- ✅ RLS/policies couvrent toutes les tables de read-models; aucune table read-model n’est accessible cross-tenant.
- ✅ Les index supportent les requêtes clés (tenant + période + filtre) sans scans complets.

## Spécification P0 implémentée (Programme Cockpit)
- **Migration**: `supabase/migrations/20260508140000_programme_cockpit_read_model.sql`
- **Tables**:
  - `public.programme_cockpit_read_models` (PK: `organization_id, programme_id`)
  - `public.projection_checkpoints` (PK: `projection_name, organization_id, programme_id`)
- **RLS**:
  - SELECT: `authenticated` scoping `profiles.organization_id`
  - WRITE: **désactivé côté client** (service_role/Edge Function uniquement)

## Stratégie de test
- **Integration**: migrations + chargement d’un dataset de test → requêtes KPI/ops stables.
- **Replay**: simuler reprocessing (mêmes events) → read-models déterministes (pas de double comptage).
- **Perf**: checks de plans sur requêtes “dashboard” (tenant + période).
