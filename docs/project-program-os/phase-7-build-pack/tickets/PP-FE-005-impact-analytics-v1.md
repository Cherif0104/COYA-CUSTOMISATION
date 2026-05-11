# PP-FE-005 — Impact analytics v1 (KPI read-only)

- **Priorité**: P1
- **Dépendances**: PP-DB-004, PP-DB-005, PP-BE-004, PP-OBS-002
- **Owner**: Frontend (placeholder)
- **Estimation**: M

## Objectif
Livrer une v1 d’“Impact analytics” (PHASE 4/5): écrans KPI **read-only** basés sur read-models/projections, filtrables et exportables, conçus pour la reproductibilité (sources + période + run_id).

## Périmètre / non-objectif
- **Périmètre**:
  - Dashboards KPI (v1) basés sur formules normalisées (PP-DB-004) et read-models (PP-DB-005).
  - Filtres: programme/projet/territoire + période; tri stable; pagination si nécessaire.
  - Visibilité qualité des données (indicateurs DQ) quand disponible.
- **Non-objectif**:
  - Génération de pack bailleur freeze+hash (voir PP-REP-001/002).
  - IA (voir tickets AI).

## Acceptance criteria
- ✅ Au moins 5 KPI prioritaires sont affichés avec définitions/formules accessibles (lien/infobulle) et unités.
- ✅ Les KPI sont strictement bornés tenant; tout cas cross-tenant retourne vide/403 et l’UI ne “dévine” rien.
- ✅ Pour chaque vue KPI, l’UI expose les paramètres de reproductibilité (période, filtres, version formules si exposée).
- ✅ Les états “données incomplètes / en retard / suspectes” sont visibles quand signalés (PP-OBS-002).

## Stratégie de test
- **Unit**: formatage KPI, unités, calcul de périodes/intervals.
- **Integration**: mocks read-models + tests de tri/filtre; tests “données manquantes”.
- **E2E**: tenant A vs tenant B + vérif reproductibilité (mêmes paramètres → mêmes résultats).
