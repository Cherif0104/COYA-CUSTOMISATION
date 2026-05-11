# PP-WF-002 — Workflow engine (états/transitions) + audit

- **Priorité**: P0
- **Dépendances**: PP-WF-001, PP-SEC-002
- **Owner**: Backend/Workflow (placeholder)
- **Estimation**: L

## Objectif
Implémenter un moteur de workflow qui applique les transitions (PHASE 3: activity/mission/incident) et bloque/débloque via Governance Engine (PHASE 2).

## Détail
- Matérialiser les états (référence: `phase-3-operations/ACTIVITY-STATES.md`, `MISSION-LIFECYCLE.md`).
- Règles:
  - transitions validées (guard clauses)
  - journalisation `workflow_events` + audit logs
  - idempotence via `event_id`
- Intégration:
  - commande “request approval” → état “in_review”
  - completion approval → transition “approved/validated”

## Acceptance criteria
- ✅ Transitions principales implémentées (activité/mission/incident) + refus si transition illégale.
- ✅ Chaque transition écrit `workflow_events` + audit log.
- ✅ Replays sans doubles effets (mêmes event_id).

## Stratégie de test
- **E2E**: 3 parcours complets (mission, incident, dépense/artefact) avec approvals.
- **Replay**: rejouer 50 événements dans le même ordre + ordre inversé (où applicable).

