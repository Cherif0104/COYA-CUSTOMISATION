# Offline UX Patterns (terrain)

## Objectif
Rendre l’offline **compréhensible, fiable, observable**.

## Composants UI (réutilisables)
- **SyncBadge**: online/offline + last sync + outbox count
- **OutboxPanel**: liste actions en attente (create/update/upload), retry, cancel
- **ConflictBanner**: conflit détecté + options (server-wins / keep-local / merge)
- **ReadOnlyModeNotice**: “lecture seule” si politiques/gouvernance exigent online
- **UploadQueue**: statut pièces (pending/uploaded/failed) + backoff

## États standard
- **Online (Healthy)**: realtime + sync transparent
- **Offline (Working)**: actions autorisées limitées + queue visible
- **Degraded (Partial)**: lecture OK, écriture restreinte, uploads différés
- **Blocked (RLS/Policy)**: action refusée → proposer “Demander accès”/“Créer incident”

## Erreurs & retries
- 401/403: session/permissions → re-login, demander accès
- 409: conflit → ConflictBanner
- 5xx: retry exponentiel + “send later”

## Acceptance Criteria
- **AC-OFF-01**: tout écran terrain affiche SyncBadge.
- **AC-OFF-02**: outbox visible et contrôlable (retry/cancel) par l’utilisateur.
- **AC-OFF-03**: conflits explicités + résolution guidée.

