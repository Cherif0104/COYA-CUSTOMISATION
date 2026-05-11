# PP-WF-001 — Compiler Approval DSL (PHASE 2) → policy exécutable

- **Priorité**: P0
- **Dépendances**: PP-SEC-001, PP-DB-003
- **Owner**: Backend/Workflow (placeholder)
- **Estimation**: M

## Objectif
Passer de `phase-2-governance/APPROVAL-DSL.md` à une policy exécutable (validate/compile) produisant une chaîne d’approbation (steps, quorum, escalation, delegation).

## Détail
- Parser/valider DSL (schema + invariants).
- Compiler en runtime model:
  - steps (role/committee), quorum, conditions ABAC, timers SLA, fallback approver
- Versionner la policy (policy_key + version).

## Acceptance criteria
- ✅ DSL invalide rejetée avec erreurs actionnables.
- ✅ 3 policies “réalistes” compilées (activité, dépense, incident) (PHASE 2).
- ✅ La compilation ne dépend pas de données cross-tenant.

## Stratégie de test
- **Unit**: parse/validate/compile + golden files.
- **Integration**: charger policy → générer steps pour 10 cas (amount/severity/territory).

