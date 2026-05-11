# PP-NOTIF-001 — Notification service (in-app/email)

- **Priorité**: P1
- **Dépendances**: PP-DB-003, PP-SEC-002, PP-OBS-001
- **Owner**: Backend/Platform (placeholder)
- **Estimation**: M

## Objectif
Fournir un service de notifications cohérent et multi-tenant (PHASE 2/3): in-app et/ou email, basé sur outbox, idempotence et audit, avec une interface stable pour les workflows et incidents.

## Périmètre / non-objectif
- **Périmètre**:
  - Modèle `notifications` + `notification_deliveries` (statuts, tentatives, next_retry_at).
  - Producteurs: workflow engine, sync observability, incidents (événements).
  - Canaux: in-app (obligatoire v1), email (optionnel v1 selon infra) avec templates minimalistes.
  - Déduplication: `event_id` unique par notification/delivery.
- **Non-objectif**:
  - Marketing/broadcasting (hors scope).
  - Centre de préférences utilisateur complet (peut venir ensuite).

## Acceptance criteria
- ✅ Un workflow/incident peut émettre une notification qui est persistée, dédupliquée et livrée.
- ✅ Les notifications sont strictement isolées par tenant; aucune lecture cross-tenant possible.
- ✅ Les retries sont traçables et observables (tentatives, erreurs, latence).
- ✅ Les événements de notification sont audités (qui/quoi/quand) et corrélables (`correlation_id`).

## Stratégie de test
- **Unit**: règles de déduplication, transitions d’état deliveries, rendu template minimal.
- **Integration**: publier N events → créer N notifications; replay events → pas de doublons.
- **E2E**: scénario workflow escaladé → notification in-app visible; vérif multi-tenant.
