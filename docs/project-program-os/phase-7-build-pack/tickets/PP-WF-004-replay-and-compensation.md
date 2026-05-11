# PP-WF-004 — Replay & compensation (reliability)

- **Priorité**: P1
- **Dépendances**: PP-WF-002, PP-DB-003, PP-OBS-001
- **Owner**: Backend (placeholder)
- **Estimation**: L

## Objectif
Rendre le moteur de workflow “replay-safe” et résilient: capacité de rejouer un workflow/une transition à partir d’un journal immuable, et mécanismes de compensation pour corriger des effets partiels — en cohérence avec outbox/idempotence.

## Périmètre / non-objectif
- **Périmètre**:
  - Journal d’événements immuables comme source de vérité (workflow_events/outbox).
  - APIs/outils internes: “replay from event_id”, “recompute projection”, “mark step compensated”.
  - Compensations: patterns explicites (sagas) pour un set limité d’actions P0/P1.
  - Traces: chaque replay/compensation est auditée avec `correlation_id`.
- **Non-objectif**:
  - Compensation universelle (tout domaine). On cible d’abord les opérations/workflows critiques.
  - Feature d’administration avancée (UI) au-delà d’une surface minimale.

## Acceptance criteria
- ✅ Il est possible de rejouer un workflow instance depuis un `event_id`/offset sans double effet.
- ✅ Les projections/read-models restent déterministes après replay (pas de double comptage, pas de drift).
- ✅ Une compensation type est implémentée et testée (ex: annulation d’une transition avec effet métier).
- ✅ Observabilité: logs + métriques sur replays/compensations, latence, erreurs, et taux de succès.

## Stratégie de test
- **Integration**: exécuter un workflow, simuler panne à mi-chemin, replay → même état final attendu.
- **Replay**: rejouer 2 fois le même segment → no-op sur effets déjà appliqués.
- **Compensation**: simuler un effet partiel → compensation → état cohérent + audit trail complet.
