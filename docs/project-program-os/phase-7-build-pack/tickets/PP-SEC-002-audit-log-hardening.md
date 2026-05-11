# PP-SEC-002 — Durcissement audit logs (immutabilité, rétention, accès)

- **Priorité**: P0
- **Dépendances**: PP-SEC-001, PP-DB-003
- **Owner**: Security/Platform (placeholder)
- **Estimation**: M

## Objectif
Rendre le journal d’audit exploitable et sûr: écritures systématiques, accès strict, et stratégie de rétention/partition.

## Détail
- Définir le contrat minimal d’audit:
  - `actor_id`, `organization_id`, `action`, `target_type/id`, `reason`, `metadata`, `event_id`, `created_at`
- Accès:
  - lecture: `auditor` + `super_admin` + owners métiers selon règles
  - écriture: uniquement services/app (pas de “manual edits”)
- Rétention/volume:
  - stratégie de partitionnement ou archivage (si nécessaire)
  - index sur `organization_id`, `created_at`, `target_type/id`

## Acceptance criteria
- ✅ Toutes actions gouvernées (approve/reject/delegate/override) génèrent un audit log.
- ✅ Audit lisible en UI (timeline) via read-models, sans fuite inter-tenant.
- ✅ Stratégie de rétention documentée, sans perte des événements critiques.

## Stratégie de test
- **Integration**: déclencher 10 actions de workflow → 10 logs attendus.
- **RLS**: auditor org A ne lit pas org B.
- **Perf**: requête “timeline” sous index (EXPLAIN).

# PP-SEC-002 — Durcissement audit logs (immutabilité, rétention, accès)

- **Priorité**: P0
- **Dépendances**: PP-SEC-001, PP-DB-003
- **Owner**: Security/Platform (placeholder)
- **Estimation**: M

## Objectif
Rendre le journal d’audit exploitable et sûr: écritures systématiques, accès strict, et stratégie de rétention/partition.

## Détail
- Définir le contrat minimal d’audit:
  - `actor_id`, `organization_id`, `action`, `target_type/id`, `reason`, `metadata`, `event_id`, `created_at`
- Accès:
  - lecture: `auditor` + `super_admin` + owners métiers selon règles
  - écriture: uniquement services/app (pas de “manual edits”)
- Rétention/volume:
  - stratégie de partitionnement ou archivage (si nécessaire)
  - index sur `organization_id`, `created_at`, `target_type/id`

## Acceptance criteria
- ✅ Toutes actions gouvernées (approve/reject/delegate/override) génèrent un audit log.
- ✅ Audit lisible en UI (timeline) via read-models, sans fuite inter-tenant.
- ✅ Stratégie de rétention documentée, sans perte des événements critiques.

## Stratégie de test
- **Integration**: déclencher 10 actions de workflow → 10 logs attendus.
- **RLS**: auditor org A ne lit pas org B.
- **Perf**: requête “timeline” sous index (EXPLAIN).

