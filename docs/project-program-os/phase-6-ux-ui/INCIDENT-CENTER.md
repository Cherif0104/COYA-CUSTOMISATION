# Incident Center

## But
Centraliser triage, escalade, résolution et capitalisation des incidents (opérationnels, financiers, conformité, qualité).

## Vues
- **Inbox**: incidents ouverts, triés par criticité/SLA
- **Triage**: catégorisation + assignation + plan d’action
- **War room (critique)**: incidents critiques + blocages + décisions (override)
- **Post-mortem**: résolution + leçons apprises → Knowledge

## Champs clés (UI)
- catégorie (retard/budget/conflit/matériel/validation bloquée/DQ)
- sévérité (low/medium/high/critical)
- SLA restant + escalade prochaine
- entité liée (programme/projet/activité/mission/dépense)

## Intégrations
- Gouvernance: escalades, overrides (break-glass) avec audit renforcé
- Notifications: email/sms/WA/push (selon criticité)
- IA (PHASE 5): résumé incident + recommandations (lecture seule, validation humaine)

## Offline UX
- création incident offline (payload minimal) + sync différée
- pièces jointes (preuves) en upload différé

## Acceptance Criteria
- **AC-INC-01**: triage impose catégorie + sévérité + assignation + SLA.
- **AC-INC-02**: escalade automatique visible (prochaine étape, timer).
- **AC-INC-03**: override possible uniquement via break-glass + audit immuable.

