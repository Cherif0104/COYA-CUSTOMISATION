# PP-DB-003 — Schéma outbox + workflow_events (idempotence)

- **Priorité**: P0
- **Dépendances**: PP-DB-001
- **Owner**: Backend/DB (placeholder)
- **Estimation**: M

## Objectif
Standardiser le stockage des événements fiables (outbox) et des événements de workflow avec clés d’idempotence (`event_id`) et corrélation (`correlation_id`).

## Détail
- Créer/adapter:
  - `outbox_events` (pending/sent/failed, attempt_count, next_retry_at)
  - `workflow_events` (historique immuable des transitions)
- Contraintes:
  - `event_id` unique (déduplication globale)
  - index sur `organization_id`, `created_at`, `correlation_id`
- Préparer une surface minimale consommable par workers (PP-OBS-001, PP-BE-001).

## Acceptance criteria
- ✅ Outbox persistante, requêtable et “replay-safe”.
- ✅ Un doublon `event_id` n’entraîne aucun double effet (contrainte + logique).
- ✅ États et retries traçables (attempts, erreurs, last_error).

## Stratégie de test
- **Integration**: insérer N events, simuler envoi, vérifier transitions d’état.
- **Replay**: rejouer le même `event_id` (mêmes payloads) → pas de doublon.
- **Index**: vérifier plans sur `organization_id` + `created_at`.

