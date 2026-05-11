# PHASE 7 — Stratégie de test consolidée

Objectif: garantir sécurité (RLS), fiabilité (idempotence/outbox), offline-first, workflows gouvernés et reporting reproductible.

## 1) Principes

- **Multi-tenant obligatoire**: chaque suite de tests a des scénarios “org A vs org B”.
- **Idempotence partout**: toute commande importante est rejouable (même `event_id`) sans double effet.
- **Outbox-first**: on teste la persistance avant la publication (et la publication avant la consommation).
- **Offline-first réaliste**: les tests incluent pertes réseau, latence, retries, collisions.
- **Audit vérifiable**: toute action gouvernée laisse un trail exploitable.

## 2) Pyramide de tests (minimum)

### Unit (rapides)
- DSL governance: parse/validate/compile
- Moteur de formule KPI (validation + évaluation sur jeux d’exemples)
- Normalisation events/outbox (schemas, validation)

### Integration (DB + services)
- Migrations up/down, contraintes, indexes
- RLS policies (select/insert/update/delete) par rôle/scopes
- Outbox worker: retries/backoff, dedup, dead-letter/max attempts
- Upload pipeline (presigned, checksum, antivirus si prévu)

### E2E (produit)
- Parcours mission offline → evidence → sync → validation gouvernance
- Incident offline → sync → escalade → notifications
- Génération export bailleur (run_id) → freeze → hash → audit trail

### Non-fonctionnel
- Perf: indexation `organization_id` + pivots (created_at/status)
- Concurrence: double submit, double approve, replay events
- Robustesse: panne réseau, timeouts, worker redémarré, duplication messages

## 3) Matrice des scénarios critiques (P0)

- **RLS**:
  - org A ne voit rien de org B (toutes tables “foundation” + audit + gouvernance)
  - UPDATE sans SELECT policy (piège Postgres) détecté
  - “break-glass” strictement limité (super_admin) et audité

- **Offline sync**:
  - mode avion: create mission/incident/evidence
  - resync: aucun doublon, ordre stable, conflits explicités
  - collision: deux modifications concurrentes → stratégie de merge conforme PHASE 3

- **Workflow**:
  - approvals conditionnels (ABAC)
  - quorum (committee) + délégation time-bounded
  - escalade SLA (timer) → notification → fallback approver

- **Outbox**:
  - worker idempotent (event_id)
  - retries/backoff (panne bus)
  - poison message → dead-letter / quarantine

## 4) Données de test (fixtures)

- 2 organisations (A/B), 2 programmes, 2 territoires, 1 cohorte
- 3 rôles: contributor terrain, manager programme, super_admin, + auditor (lecture)
- Jeux KPI: sum/rate/derived + désagrégations (genre/âge/territoire)

## 5) Outils / instrumentation (contrat)

- **Corrélation**: `correlation_id` (workflow) + `event_id` (idempotence)
- **Logs structurés**: JSON, champs standard (org_id, actor_id, target_type/id)
- **Métriques**:
  - taux erreurs RLS
  - backlog outbox (pending/failed)
  - sync failures/retries
  - workflows “stuck” (timer dépassé)

## 6) Gates qualité (Go/No-Go)

- Gate Data (G1): migrations + RLS tests verts
- Gate Workflow (G2): e2e governance (3 policies) vert
- Gate Offline (G3): e2e mode avion + conflit vert
- Gate Reporting (G5): export reproductible (hash stable) vert

