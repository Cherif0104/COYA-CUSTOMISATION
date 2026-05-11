# PP-BE-001 — API Foundation: contrats & erreurs (PHASE 3/4)

- **Priorité**: P0
- **Dépendances**: PP-SEC-001, PP-DB-001, PP-DB-002
- **Owner**: Backend (placeholder)
- **Estimation**: M

## Objectif
Poser une “API foundation” stable et multi-tenant pour les parcours PHASE 3–4: conventions d’authn/authz, envelopes de réponse, gestion d’erreurs, pagination/filtrage, idempotence des commandes, et contrats JSON versionnés.

## Détail
- Définir les conventions API:
  - auth: `organization_id` implicite via session + enforcement côté serveur
  - erreurs: format canonique (code, message, details, correlation_id)
  - pagination: cursor/limit (ou page/size) + tri stable
  - filtrage: par `programme_id`, `project_id`, `territory_id`, période
- Contrats versionnés pour les domaines:
  - Operations: missions/activities/incidents (PHASE 3)
  - M&E: measurements, KPI definitions/read-models (PHASE 4)
- Idempotence:
  - accepter `event_id`/`idempotence_key` sur endpoints mutatifs critiques
  - renvoyer des réponses déterministes en cas de replay
- Gouvernance “hooks”:
  - champs `correlation_id` pour lier workflows/approvals (PHASE 2)
- Alignement avec `TEST-STRATEGY.md`:
  - multi-tenant systématique, outbox-first, offline-first réaliste

## Acceptance criteria
- ✅ Un document de conventions API existe et est appliqué sur un premier set d’endpoints (au moins 3 read + 3 write).
- ✅ Toute réponse inclut un identifiant de corrélation utilisable (`correlation_id` ou équivalent) quand pertinent.
- ✅ Les erreurs RLS/authz reviennent avec un code stable (ex: `TENANT_SCOPE_VIOLATION`, `RLS_DENIED`) sans fuite de données.
- ✅ Les endpoints mutatifs P0 acceptent un `event_id` et sont idempotents (replay → no-op ou même résultat).

## Stratégie de test
- **Unit**: validation schémas (req/resp) + mapping erreurs → codes canoniques.
- **Integration**: matrice org A/org B sur endpoints list/detail (refus attendu cross-tenant).
- **E2E**: scénario offline → sync → commandes rejouées (même `event_id`) sans doublons.
