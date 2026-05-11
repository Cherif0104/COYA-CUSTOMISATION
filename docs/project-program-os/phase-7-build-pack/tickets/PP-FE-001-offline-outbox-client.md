# PP-FE-001 — Offline outbox client (queue, retries, idempotence)

- **Priorité**: P0
- **Dépendances**: PP-OFF-001, PP-DB-003, PP-BE-001, PP-BE-003
- **Owner**: Frontend (placeholder)
- **Estimation**: L

## Objectif
Fournir un “offline outbox client” robuste pour capturer les actions utilisateur en mode avion, les rejouer de façon **idempotente** lors de la resynchronisation, et exposer un état UX explicite (en attente / envoi / échec / résolu).

## Périmètre / non-objectif
- **Périmètre**:
  - File locale persistante des commandes (actions) avec `event_id` / `idempotence_key`, `correlation_id`, horodatage, et tentative.
  - Moteur d’envoi: batching, backoff, retry, déduplication (replay-safe), gestion d’erreurs par item.
  - Intégration UX minimale: indicateurs “pending sync”, “syncing”, “failed”, actions de retry.
- **Non-objectif**:
  - Stratégie de résolution de conflits métier (couverte par PP-OFF-002).
  - UI Mission Control / Incident Center (tickets PP-FE-002/003).

## Acceptance criteria
- ✅ Toute commande mutative générée côté UI est stockée localement avec un `event_id` stable (replay = même id).
- ✅ Un même `event_id` n’est jamais envoyé deux fois de manière concurrente; la reprise après crash reprend l’état sans perdre d’événements.
- ✅ Les erreurs renvoyées par l’API sont mappées en états actionnables (retryable vs non-retryable) sans fuite de données.
- ✅ Le système supporte un batch push avec ACK par événement (aligné sur PP-OFF-001) et marque les items ACKés comme “done”.
- ✅ En cas d’échec réseau, un backoff est appliqué et l’UX reste utilisable (pas de blocage global).

## Stratégie de test
- **Unit**: sérialisation/stockage, transitions d’état, backoff (temps simulé), mapping erreurs → catégories.
- **Integration**: mock API sync push (ACK par item) + simulation crash/restart → reprise sans doublons.
- **E2E**: scénario mode avion → création de N actions → reconnexion → sync → relecture du même flux (mêmes `event_id`) sans double effet.
