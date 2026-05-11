# PP-INFRA-003 — Release train & rollbacks (déploiements sûrs)

- **Priorité**: P1
- **Dépendances**: PP-INFRA-001, PP-INFRA-002, PP-OBS-001, PP-SEC-003
- **Owner**: Platform/DevOps (placeholder)
- **Estimation**: M

## Objectif
Définir et implémenter un processus de release “train” avec rollbacks sûrs: versionning, migrations contrôlées, compatibilité ascendante, et gates observabilité/sécurité avant promotion.

## Périmètre / non-objectif
- **Périmètre**:
  - Stratégie de version (app + DB) et politiques de compatibilité (N/N-1 si requis).
  - Runbooks: promotion dev→staging→prod, rollback applicatif, rollback migrations (si possible) ou forward-fix.
  - Feature flags (si applicable) pour réduire les risques.
  - Gates: checks CI, smoke tests, signaux observabilité, sécurité (secrets/rotation).
- **Non-objectif**:
  - Refonte complète de l’infra d’hébergement.
  - Automatisation “one-click” sans garde-fous.

## Acceptance criteria
- ✅ Un document release train existe (cadence, gates, rôles) et est appliqué au moins une fois sur staging.
- ✅ Le rollback applicatif est possible sans casser les contrats API/clients (backward compatible).
- ✅ Les migrations suivent une discipline “expand/contract” (ou équivalent) limitant les risques.
- ✅ Des smoke tests et checks observabilité bloquent la promotion si signaux rouges.

## Stratégie de test
- **Drill**: exercice de rollback sur staging (app + DB) avec vérification de service.
- **Integration**: pipeline CI/CD exécute migrations + smoke tests; échec contrôlé bloque.
- **Observability**: vérifier que la version déployée est traçable (logs/metrics tags).
