# PP-OBS-002 — Monitoring KPI & qualité des données (DQ)

- **Priorité**: P1
- **Dépendances**: PP-OBS-001, PP-DB-004, PP-DB-005
- **Owner**: Platform/Data (placeholder)
- **Estimation**: M

## Objectif
Mettre en place un monitoring contractuel des KPI et de la qualité des données (PHASE 4/5): contrôles DQ, métriques d’intégrité, et alertes minimales pour prévenir exports/reporting incorrects.

## Périmètre / non-objectif
- **Périmètre**:
  - Contrôles DQ: complétude, unicité, cohérence de périodes, valeurs hors bornes, retards de refresh.
  - Métriques: freshness des projections, taux d’échec de refresh, anomalies par tenant (sans fuite).
  - Alerting minimal: seuils sur failures, retards, drift important.
  - Traçabilité: lier anomalies à `run_id` reporting quand applicable.
- **Non-objectif**:
  - Plateforme monitoring exhaustive si déjà existante (on s’intègre).
  - Correction automatique des données.

## Acceptance criteria
- ✅ Un set de contrôles DQ est défini et exécuté régulièrement sur read-models/KPI.
- ✅ Les anomalies sont catégorisées et observables (métriques + logs corrélés).
- ✅ Les alertes minimales existent (au moins: refresh en échec, freshness dépassée, anomalies critiques).
- ✅ Les métriques sont tenant-scopées et n’exposent pas de données sensibles.

## Stratégie de test
- **Integration**: injecter des anomalies (valeurs nulles, doublons, retard) → détection attendue.
- **Perf**: exécution des contrôles sur dataset réaliste (temps borné).
- **Security**: vérifier que les sorties/alertes ne leakent pas de contenu cross-tenant.
