# PP-BE-003 — Operations Write Model (PHASE 3) — commandes idempotentes

- **Priorité**: P0
- **Dépendances**: PP-BE-001, PP-DB-001, PP-DB-003, PP-SEC-001, PP-WF-002
- **Owner**: Backend/Operations (placeholder)
- **Estimation**: L

## Objectif
Implémenter les commandes “write-model” du Operation Engine (PHASE 3) de manière **idempotente**, multi-tenant, auditée et compatible offline-first: créer/mettre à jour missions/activities/incidents, initier les transitions gouvernées, et publier les événements via outbox.

## Détail
- Commands minimales (P0):
  - `activity.create|update`
  - `mission.create|update|assign_team`
  - `evidence.register_metadata` (sans upload media direct)
  - `incident.declare` (+ `declare_critical` si requis)
- Contrats:
  - chaque commande accepte `event_id` + `correlation_id`
  - invariants (PHASE 3): append-only pour preuves, transitions validées, pas de mutation cross-tenant
- Outbox-first:
  - écrire `outbox_events` dans la même transaction DB que la mutation (PP-DB-003)
  - déduplication par `event_id`
- Gouvernance:
  - certaines transitions déclenchent `RequestApproval` (PP-BE-002 / PP-WF-001)
- Audit:
  - toute mutation significative génère une trace audit exploitable (PP-SEC-002)

## Acceptance criteria
- ✅ Les commandes P0 sont idempotentes (replay même `event_id` → aucun double effet).
- ✅ Outbox: chaque commande P0 publie un événement domaine minimal (event catalog PHASE 3).
- ✅ RLS/tenant isolation: aucune écriture possible hors `organization_id`.
- ✅ Un parcours “mission terrain” minimal fonctionne avec transitions clés (draft → assigned → in_progress → completed) selon `MISSION-LIFECYCLE.md`.

## Stratégie de test
- **Unit**: validation invariants + mapping erreurs (ex: transitions interdites).
- **Integration**: tests DB: write + outbox dans une transaction, dedup, RLS matrix.
- **E2E**: scénario offline (replays) → sync → aucune duplication de missions/incidents/preuves.
