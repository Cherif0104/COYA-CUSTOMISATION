# PP-OBS-001 — Logs structurés + corrélation (event_id/correlation_id)

- **Priorité**: P0
- **Dépendances**: PP-DB-003
- **Owner**: Platform/Backend (placeholder)
- **Estimation**: M

## Objectif
Rendre le système observable et débogable: logs JSON, corrélation, métriques de base (outbox/sync/workflows/RLS).

## Détail
- Standardiser un “log envelope”:
  - `organization_id`, `actor_id`, `event_id`, `correlation_id`, `target_type`, `target_id`, `action`, `severity`
- Instrumenter:
  - outbox publisher (pending/sent/failed, retries)
  - sync endpoints (latence, retries, conflicts)
  - governance/workflow (stuck timers, escalations)
  - erreurs RLS (count + top tables)
  - **projectors CQRS** (ex: `programme_cockpit`): durée rebuild, watermark, rows scanned, erreurs upsert/checkpoint

## Acceptance criteria
- ✅ Toute requête/commande critique écrit un log corrélable.
- ✅ Dashboard minimal possible (même via requêtes logs) pour: RLS errors, outbox backlog, sync failures, workflow stuck.
- ✅ Aucun log ne fuite de données inter-tenant (redaction champs sensibles).

## P0 — Cockpit Programme
- Le projector `programme-cockpit-rebuild` doit logger:
  - `organization_id`, `programme_id`, `projection_name='programme_cockpit'`
  - `generated_at`, `watermark_event_occurred_at`, `watermark_source_updated_at`
  - `severity` + `error_code` sur erreurs (upsert/checkpoint)

## Stratégie de test
- **Integration**: exécuter un parcours offline → sync → approval → vérifier propagation `correlation_id`.
- **Chaos**: simuler panne bus → retries visibles + métriques cohérentes.

