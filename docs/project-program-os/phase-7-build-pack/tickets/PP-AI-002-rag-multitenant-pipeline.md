# PP-AI-002 — Pipeline RAG multi-tenant (index + retrieval)

- **Priorité**: P2
- **Dépendances**: PP-AI-001, PP-SEC-001, PP-DB-005, PP-OBS-002
- **Owner**: AI/Platform (placeholder)
- **Estimation**: L

## Objectif
Construire un pipeline RAG multi-tenant (PHASE 6) pour interroger de la documentation/exécution (tickets, décisions, runs de reporting) et des read-models, avec isolation stricte, traçabilité, et réponses **citées**.

## Périmètre / non-objectif
- **Périmètre**:
  - Ingestion: sources autorisées (docs internes, reporting manifests, read-models sélectionnés).
  - Indexation: partition par tenant (physique ou logique), politiques de rétention, versioning.
  - Retrieval: requêtes tenant-scopées, filtres par type/source/période, top-k contrôlé.
  - Observabilité: métriques (latence, hit rate), logs d’accès, audit.
- **Non-objectif**:
  - Ingestion de données sensibles non nécessaires (PII inutile).
  - “Write-back” automatique d’actions/opérations.

## Acceptance criteria
- ✅ L’index RAG est strictement isolé tenant (tests d’inférence: tenant B ne récupère rien de A).
- ✅ Chaque réponse RAG fournit des citations traçables (source_id, type, version, extrait).
- ✅ Les sources ingérées sont listées/contrôlées; aucune ingestion “open ended”.
- ✅ Les métriques/alertes minimales existent (erreurs ingestion, dérive volume, latence).

## Stratégie de test
- **Integration**: ingestion dataset synthétique A/B → retrieval tenant-scopé.
- **Security**: tests d’attaque par prompt/retrieval (injection, cross-tenant) → neutralisation/refus.
- **Eval**: set de requêtes “golden” avec attentes de citations (voir AI-003).
