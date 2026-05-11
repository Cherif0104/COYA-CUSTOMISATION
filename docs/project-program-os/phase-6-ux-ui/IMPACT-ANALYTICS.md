# Impact Analytics

## But
Afficher l’impact comme cockpit M&E: KPIs, tendances, désagrégations, qualité données, preuves.

## Widgets recommandés
- KPI tiles (target vs actual + trend)
- Graphes séries temporelles (par territoire / cohorte / genre)
- Heatmap territoriale (couverture + DQ)
- “Evidence completeness” (preuves attendues vs reçues)
- “DQ incidents” (qualité) + corrections en cours

## Read-model
Projection `impact_analytics_read_model`:
- `kpis[]`: {code, name, unit, target, actual, trend, dq_flag}
- `series[]`: {kpi_code, buckets[], breakdowns[]}
- `dq`: {score, missingness, outliers, inconsistencies}
- `evidence`: {required, received, missing, last_upload_at}

## Offline UX
- snapshot last-known (read-only)
- bannière “données non à jour”

## Acceptance Criteria
- **AC-IMP-01**: désagrégation par territoire/cohorte/genre disponible sur KPIs critiques.
- **AC-IMP-02**: DQ score visible + liens vers corrections (incidents qualité).
- **AC-IMP-03**: evidence completeness visible pour rapports/exports.

