# PP-BE-002 — Governance Runtime (PHASE 2) — décisions + audit

- **Priorité**: P0
- **Dépendances**: PP-WF-001, PP-SEC-001, PP-SEC-002, PP-DB-003
- **Owner**: Backend/Governance (placeholder)
- **Estimation**: L

## Objectif
Implémenter le runtime de gouvernance qui exécute les policies compilées (PHASE 2) pour produire des décisions traçables: création de demandes d’approbation, collecte des votes/quorum, délégation/override, escalades, et émission d’événements outbox + audit.

## Détail
- Runtime “decisioning”:
  - instancier une demande d’approbation à partir d’une policy (policy_key + version)
  - évaluer conditions ABAC (rôles + scopes programme/projet/territoire + context)
  - gérer quorum (committee) + règles de vote
- Traçabilité:
  - écrire des entrées d’audit exploitables (acteur, cible, décision, raison)
  - publier des événements (outbox) pour workflow engine (PP-WF-002)
- Gestion des cas non-happy:
  - policy invalide/inconnue → erreur actionnable (sans fuite)
  - tentatives cross-tenant → blocage + audit sécurité
  - actions “break-glass” (super_admin) strictement limitées et auditées
- Interfaces attendues (contrat):
  - commande `RequestApproval(target, policy_key, context, event_id, correlation_id)`
  - commandes `CastVote`, `Delegate`, `Escalate`, `Override` (si autorisé)

## Acceptance criteria
- ✅ 3 flows fonctionnels bout-en-bout: activité (PHASE 3), dépense/budget (PHASE 1/2), incident critique (PHASE 3/6).
- ✅ Quorum + délégation time-bounded pris en charge au minimum sur 1 policy.
- ✅ Toute décision (approve/reject/escalate/override) produit audit + événement outbox corrélé.
- ✅ Multi-tenant: une org ne peut pas créer/voir/voter sur une demande d’une autre org.

## Stratégie de test
- **Unit**: evaluation ABAC + quorum + transitions (approve/reject/override) avec golden files.
- **Integration**: DB + RLS, vérifier qu’un manager org A ne peut pas lire une demande org B.
- **E2E**: déclencher une demande via Operation Engine → vote → transition workflow → audit consultable.
