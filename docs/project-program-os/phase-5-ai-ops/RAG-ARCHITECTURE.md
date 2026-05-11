# PHASE 5 — RAG Architecture (vectorisation & retrieval) — contractuel

Objectif: définir une stratégie RAG (Retrieval Augmented Generation) **alignée COYA**:
- sources internes versionnées (documents/evidence/audit),
- citations obligatoires,
- isolation multi-tenant (`organization_id`),
- filtres de scope (`programme_id`, `territory_id`, …),
- compatibilité offline/deferred AI (freshness/TTL, snapshots).

Cette doc décrit la couche **d’indexation/retrieval**; la génération reste hors implémentation dans PHASE 5.

---

## 1) Sources indexables (canon)

### 1.1 Documents & versioning (PHASE 1)
Indexer prioritairement:
- `document_versions` (texte extrait) + métadonnées (type, created_at, author_role),
- liens `entity_documents` (mission/incident/report/approval).

Invariant:
- RAG doit citer une **version** (`document_version_id`), jamais un “document” non versionné.

### 1.2 Evidence terrain (PHASE 3)
Indexer:
- métadonnées `evidence_items` (type, captured_at, mission_id, territory_id, hash),
- texte extrait si `document` (OCR) sous contrôle (PII redaction).

### 1.3 M&E (PHASE 4)
Indexer:
- définitions indicateurs (KPI framework, formules, règles qualité),
- résultats “gelés” (snapshots / `aggregation_run_id`) sous forme textuelle “readable” pour citations.

### 1.4 Governance & audit (PHASE 2)
Indexer:
- décisions gouvernance (approved/rejected/overridden) avec raisons,
- `audit_logs` (événements) en version “résumée”, sans PII.

---

## 2) Modèle d’index (conceptuel)

### 2.1 Unité indexée = “Evidence Chunk”
Chaque chunk doit contenir:
- `chunk_id`
- `organization_id` (obligatoire)
- `source_type` + `source_id` (ex: `document_version`, `evidence_item`, `audit_log`)
- `source_locator` (page/section/timecode)
- `text` (extrait)
- `created_at`, `as_of` (temps source)
- `scope_tags` (programme/projet/territoire/partner)
- `security_tags` (classification)
- `pii_risk` (low|medium|high) + `redaction_applied`

Exemple (pseudo):

```json
{
  "chunk_id": "uuid",
  "organization_id": "uuid",
  "source_type": "document_version",
  "source_id": "uuid",
  "source_locator": { "page": 4, "section": "2.1" },
  "text": "…",
  "as_of": "ISO-8601",
  "scope_tags": { "programme_id": "uuid", "territory_id": "uuid", "project_id": null },
  "security_tags": ["internal", "audit_relevant"],
  "pii_risk": "low",
  "redaction_applied": true
}
```

---

## 3) Chunking (stratégie)

### 3.1 Principes
- Chunks stables et citables (page/section).
- Éviter les chunks trop longs (dilution) ou trop courts (perte contexte).
- Respecter frontières logiques (titres, paragraphes, tableaux).

### 3.2 Recommandations (contractuelles)
- Documents structurés (Markdown/PDF extrait):
  - chunk par section \(~300–800 tokens\) avec overlap modéré.
- Logs/audit:
  - chunk par événement ou par fenêtre temporelle (ex: 1 jour) selon volume.
- Snapshots KPI:
  - chunk par indicateur + scope + période, pour citations précises.

### 3.3 Tableaux
Les tables doivent être:
- soit indexées en “rows chunks” (une ligne = un chunk),
- soit converties en texte structuré (clé:valeur) pour retrieval.

---

## 4) Embeddings (choix & versioning)

### 4.1 Versioning des embeddings
Contrat:
- chaque embedding doit porter `embedding_model_id` + `embedding_version`.
- un changement de modèle déclenche une **re-indexation** versionnée (pas de mélange silencieux).

### 4.2 Normalisation langue
Contrainte:
- contenu majoritairement FR; le pipeline doit gérer FR (accents, abréviations métiers).

### 4.3 Stockage & audit
À conserver:
- texte chunk original (redacted),
- métadonnées,
- hash du texte (détection drift),
- timestamps d’indexation.

---

## 5) Multi-tenant isolation (obligatoire)

### 5.1 Partitionnement
Deux niveaux (minimum):
- partition logique par `organization_id`,
- filtres de scope (`programme_id`, `territory_id`, `project_id`) appliqués **avant** scoring final.

### 5.2 Règles d’accès
Le retrieval doit respecter:
- mêmes contraintes que RLS (PHASE 1),
- RBAC/ABAC de l’acteur (via scope tags).

### 5.3 Test anti-fuite
Toute requête RAG doit échouer (refused) si:
- `organization_id` absent,
- filtre tenant incohérent,
- tentative d’accès cross-tenant détectée.

---

## 6) Retrieval filters (obligatoires)

### 6.1 Filtres minimum
Le retrieval planner doit appliquer au minimum:
- `organization_id = X`
- au moins un scope: `programme_id` ou `project_id` ou `territory_id` (selon capability)
- `period` si la question est temporelle (incidents/rapports/KPI)

### 6.2 Filtres recommandés
- `source_type` (ex: préférer snapshots KPI pour chiffres)
- `security_tags` (ex: exclure “restricted” si rôle insuffisant)
- `freshness` (ex: exclure chunks dont `as_of` dépasse TTL)

### 6.3 Exemple de plan retrieval (pseudo)

```json
{
  "query": "Synthèse bailleur Q2",
  "filters": {
    "organization_id": "uuid",
    "programme_id": "uuid",
    "period": { "start": "2026-04-01", "end": "2026-06-30" },
    "source_type_allow": ["aggregation_run", "kpi_definition", "document_version", "evidence_item"],
    "max_source_age_seconds": 1209600
  },
  "top_k": 24
}
```

---

## 7) Freshness & offline/deferred AI

### 7.1 Freshness contract
Chaque run doit calculer:
- `as_of` global,
- `max_source_age_seconds`,
- liste `stale_sources[]`.

### 7.2 Deferred AI
Scénarios supportés:
- Sync en retard → retourner `stale_data_warning` + recommandations.
- Snapshot non disponible → exiger “numbers not frozen” (blocker pour donor pack).

### 7.3 Priorité aux sources “gelées”
Pour reporting bailleur:
- prioriser `aggregation_run_id` (snapshots) comme source-of-truth,
- refuser d’inventer/estimer si `allow_estimates=false`.

---

## 8) Traçabilité & citations (RAG → output)

Le pipeline doit garantir un mapping:
- chunk(s) récupérés → `citations[]` canoniques → sections/claims.

Règles:
- un claim doit lister ses `citation_ids`.
- une citation doit pointer sur `source_type/source_id` + locator.
- pas de “source: internet”; uniquement sources internes COYA.

