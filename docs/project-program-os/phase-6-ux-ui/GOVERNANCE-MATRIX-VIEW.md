# Governance Matrix View

## But
Rendre la gouvernance “observable”: qui doit valider quoi, quand, selon quelles conditions (territoire, seuils, bailleur), et avec quel quorum.

## Éléments UI
- **Matrice**: lignes = objets (activité/mission/dépense/rapport), colonnes = étapes validation
- **Panneau latéral**: détails d’une approbation (policy, conditions, délégation, evidence requise)
- **Historique**: timeline des décisions + signatures + commentaires

## Fonctions
- Valider / Rejeter avec motif
- Déléguer (time-bound) + révocation
- Escalade (manuel) + justification
- Override (break-glass) avec double-confirmation

## Données requises (read-model)
Projection `governance_matrix_read_model`:
- `items[]`: {entity_type, entity_id, title, territory, amount?, status, dq_flags}
- `approval_steps[]`: {step_key, state, assigned_to, quorum, sla_due_at}
- `audit_links[]`: {audit_log_id, workflow_event_id}

## Acceptance Criteria
- **AC-GOV-01**: tout “pending approval” est visible et filtrable (territoire, bailleur, SLA).
- **AC-GOV-02**: délégation et override sont traçables (qui/quoi/pourquoi/quand).
- **AC-GOV-03**: la matrice reflète la DSL (PHASE 2) — pas de règles cachées en UI.

