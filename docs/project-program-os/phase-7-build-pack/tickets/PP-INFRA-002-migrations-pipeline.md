# PP-INFRA-002 — Pipeline migrations (local → staging → prod)

- **Priorité**: P0
- **Dépendances**: PP-INFRA-001
- **Owner**: DevOps/DB (placeholder)
- **Estimation**: M

## Objectif
Sécuriser l’exécution des migrations: ordre, idempotence, rollback plan, et validation RLS.

## Détail
- Standardiser:
  - convention de nommage migrations
  - environnement staging obligatoire
  - step “RLS validation” post-migration (PP-SEC-001/PP-DB-002)
- Ajouter un mode “dry-run” + checks (tables, indexes, RLS enabled).

## Acceptance criteria
- ✅ Migrations exécutables de manière reproductible sur staging avant prod.
- ✅ Rollback documenté par migration (quand possible).
- ✅ Validation automatique: RLS activé + policies présentes pour nouvelles tables.

## Stratégie de test
- **Integration**: appliquer toutes migrations sur DB locale fraîche + re-run.
- **Staging**: exécuter pipeline complet et vérifier checks RLS.

