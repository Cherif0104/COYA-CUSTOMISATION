# KPI — Workforce Cockpit & analytics

Indicateurs pour **Workforce Cockpit** (homepage RH) et dashboards transverses.

## Présence & temps

| ID | Nom | Notes |
|----|-----|--------|
| KPI-HR-PRESENT-NOW | Présents maintenant | agrégat temps réel |
| KPI-HR-LATE-TODAY | Retards du jour | seuils policy |
| KPI-HR-OT-PENDING | Heures sup en attente validation | lien manager |
| KPI-HR-ABS-RATE | Taux d’absentéisme | rolling 30j |

## Congés & charge

| ID | Nom |
|----|-----|
| KPI-HR-LEAVE-PENDING | Congés en attente validation |
| KPI-HR-LOAD | Charge moyenne vs capacité (tâches + planning) |

## Contrats & paie

| ID | Nom |
|----|-----|
| KPI-HR-CONTRACT-EXPIRING | Contrats < 30 jours |
| KPI-HR-PAYROLL-MASS-INDEX | Masse salariale projetée (simulation run ouvert) |

## People & risques

| ID | Nom |
|----|-----|
| KPI-HR-TURNOVER | Turnover (si définition données OK) |
| KPI-HR-TURNOVER-RISK | Salariés flag risque départ |
| KPI-HR-PERF-OUTLIERS | Sous-performance / surperformance (score) |

## Engagement RH (optionnel)

| ID | Nom |
|----|-----|
| KPI-HR-RH-SLA | SLA traitement demandes RH |

Les KPIs doivent être **alimentés par read models** ([read-models.md](./read-models.md)), pas par requêtes ad hoc non documentées.
