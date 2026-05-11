# PP-INFRA-001 — CI “quality gates” (tests, lint, sécurité)

- **Priorité**: P0
- **Dépendances**: —
- **Owner**: DevOps (placeholder)
- **Estimation**: S

## Objectif
Mettre en place des gates CI minimales pour empêcher les régressions de sécurité/fiabilité.

## Détail
- Gates obligatoires:
  - lint/typecheck
  - unit tests
  - integration tests DB (migrations + RLS matrix smoke)
  - vérification “no secrets committed”
- Sorties attendues: rapport de tests + artefacts.

## Acceptance criteria
- ✅ PR bloquée si lint/tests/migrations échouent.
- ✅ Un job dédié vérifie migrations + RLS smoke.
- ✅ Un job vérifie conventions `event_id`/idempotence (au minimum via tests).

## Stratégie de test
- **CI dry-run**: exécuter pipeline sur une branche exemple.

