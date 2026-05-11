# PP-OFF-001 — Protocole de sync idempotent (serveur)

- **Priorité**: P0
- **Dépendances**: PP-DB-003, PP-SEC-001
- **Owner**: Backend/Platform (placeholder)
- **Estimation**: L

## Objectif
Implémenter le protocole offline sync décrit en PHASE 3 (`OFFLINE-SYNC-MODEL.md`): ingestion d’actions/events client avec idempotence, ack et erreurs actionnables.

## Détail
- Endpoints de sync:
  - push batch (actions/events) avec `event_id` et ordering
  - pull delta (depuis cursor/last_sync_at) borné par tenant
- Règles:
  - upserts idempotents
  - validation ABAC + RLS compatibles
  - erreurs par item (pas seulement “fail whole batch”)

## Acceptance criteria
- ✅ Batch push accepte N événements, renvoie ack par event.
- ✅ Rejouer un batch (mêmes event_id) n’applique aucun double effet.
- ✅ Pull delta ne fuit jamais cross-tenant et respecte scopes.

## Stratégie de test
- **Integration**: mode avion simulé (queue) → push → pull.
- **Collision**: deux clients modifient le même objet → conflit identifié (lien PP-OFF-002).

