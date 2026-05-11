# PP-AI-001 — AI contracts (implémentation read-only + citations)

- **Priorité**: P2
- **Dépendances**: PP-BE-001, PP-SEC-001, PP-SEC-002, PP-DB-005
- **Owner**: Backend/AI (placeholder)
- **Estimation**: M

## Objectif
Implémenter les contrats “AI Ops” (PHASE 6) sous forme **read-only**: endpoints/tools qui ne produisent aucun effet de bord, et qui retournent systématiquement des réponses avec **citations** (sources traçables: read-models, reporting runs, audit events).

## Périmètre / non-objectif
- **Périmètre**:
  - Endpoints AI read-only: recherche/QA sur read-models, résumé d’un run de reporting, diagnostics ops.
  - Format de réponse contractuel: contenu + liste de citations (type, identifiant, champ, timestamp).
  - Guardrails: scoping tenant, refus sur données sensibles, quotas/limites de taille.
  - Journalisation: requêtes AI tracées (sans exfiltration), corrélation et audit.
- **Non-objectif**:
  - Automatisations “agentic” qui écrivent/modifient des données.
  - Fine-tuning/entrainement (hors scope).

## Acceptance criteria
- ✅ Tous les endpoints AI sont strictement read-only et ne déclenchent aucun write/outbox.
- ✅ Chaque réponse contient au moins une citation lorsque des données du système sont utilisées; sinon “no evidence”.
- ✅ Les citations pointent vers des artefacts internes stables (IDs) et respectent l’isolation tenant.
- ✅ Les requêtes invalides/risquées sont refusées de façon explicite (codes stables) et auditées.

## Stratégie de test
- **Unit**: validateurs de schéma réponse (citations), règles de refus, redaction.
- **Integration**: tenant A/B sur mêmes prompts → résultats tenant-scopés; aucune fuite.
- **Security**: tests de prompts malveillants (exfiltration) → refus/neutralisation.
