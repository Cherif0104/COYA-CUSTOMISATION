# Funding Oversight (Budget & Dépenses)

## But
Piloter financement/budget comme une “tour de contrôle”: lignes budgétaires, engagements, dépenses, justificatifs, validations, dépassements.

## Layout
- Header: programme/projet + état conformité + currency
- KPIs: planned/committed/spent/remaining + burn rate + alerts
- Tabs: Lignes / Dépenses / Justificatifs / Validations / Exports

## Features clés
- **Budget lines**: planifié vs consommé, seuils, lignes sensibles
- **Dépenses**: soumission, attachement justificatifs, statut approbation (PHASE 2)
- **Dépassements**: alertes + incident auto si seuil critique
- **Pack bailleur**: export (PDF/ZIP) + gel versionné + audit

## Offline UX
- création dépense offline (payload minimal) + justificatif différé
- avertissement “approbation requise online”

## Acceptance Criteria
- **AC-FUND-01**: aucune dépense sans justificatif (ou statut “pending evidence” explicite).
- **AC-FUND-02**: dépassement déclenche alerte + trace (timeline/audit).
- **AC-FUND-03**: export bailleur produit une version figée + hash + audit.

