# PHASE 7 — Build Execution Pack (README)

But: exécuter les spécifications des PHASES 1–6 en un **pack de build** structuré (tickets, ordre, gates, définition de “done”) sans toucher à une DB distante autrement que via migrations contrôlées.

## 1) Artefacts de PHASE 7

- **Index**: `BUILD-TICKETS.md`
- **Tickets**: `tickets/PP-<AREA>-###-<slug>.md`
- **Stratégie de test**: `TEST-STRATEGY.md`
- **Résumé global programme**: `../EXEC-SUMMARY.md`

## 2) Ordre d’exécution recommandé (gates)

### Gate G0 — Préflight (avant tout)
- Environnements prêts (local/dev/staging), secrets provisionnés, CI verte.
- Inventaire RLS/policies existantes et tables “RLS disabled” (référence: PHASE 1).
- Observabilité minimale (logs structurés + corrélation `event_id`/`correlation_id`).

### Gate G1 — Data/DB Foundation (P0)
- Schéma foundation + indexes + contraintes.
- Outbox + audit logs (durcis) + RLS activé partout (policies minimales, tenant isolation).

### Gate G2 — Workflows fiables (P0)
- Runtime gouvernance (DSL compilée → chaîne exécutable).
- Workflow engine (états/transitions) + timers/escalations.
- Idempotence end-to-end (replay safe).

### Gate G3 — Offline sync (P0)
- Protocole de sync idempotent + outbox client.
- Résolution de conflits + stratégie de merge (contrats PHASE 3).

### Gate G4 — UX opérationnelle (P0/P1)
- Mission Control + Incident Center (v1) + visibilité sync.
- Vues gouvernance (matrice) et commandes principales.

### Gate G5 — M&E/Reporting (P1)
- KPI/formules + read-models/projections.
- Pack bailleur (freeze + hash + audit trail).

### Gate G6 — AI Ops (P2, uniquement si G1–G5 stables)
- Endpoints read-only avec citations obligatoires.
- Pipeline RAG multi-tenant + eval/red-team.

## 3) Definition of Done (DoD) — PHASE 7

PHASE 7 est “done” si:
- **Sécurité**: aucune table exposée sans RLS; tests multi-tenant verts; audit exploitable.
- **Fiabilité**: outbox idempotente; retries/backoff; pas de doublons; replays validés.
- **Offline-first**: mode avion → créations → resync sans perte; conflits gérés; UX explicite.
- **Workflow**: approvals/quorum/escalations/override fonctionnent et sont audités.
- **M&E/Reporting**: export pack reproductible (run_id + hash) + sources de vérité tracées.
- **Observabilité**: métriques clés + alerting minimal (RLS errors, sync failures, workflow stuck).
- **Documentation**: tickets à jour, décisions d’archi capturées dans `EXEC-SUMMARY.md`.

## 4) Conventions (tickets)

Chaque ticket doit contenir:
- Priorité (P0/P1/P2), dépendances, owner (placeholder), estimation t-shirt (S/M/L)
- Acceptance criteria (testables)
- Stratégie de test (unit/int/e2e/chaos/offline, + jeux de données)

