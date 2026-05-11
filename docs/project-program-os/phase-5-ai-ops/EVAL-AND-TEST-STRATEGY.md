# PHASE 5 — Eval & Test Strategy (offline-first) — contractuel

Objectif: définir une stratégie de tests/évaluation pour AI Ops **sans dépendance à un LLM** (PHASE 5 docs only), avec:
- jeux d’or (“golden sets”),
- red-teaming (prompt injection, exfiltration, policy bypass),
- évaluations offline (déterministes),
- métriques clés (citations, hallucinations, safety),
- monitoring post-implémentation (PHASE 7).

---

## 1) Types de tests (par couche)

### 1.1 Tests de contrats (schema compliance)
Vérifier que chaque capability respecte `AI-CONTRACTS.md`:
- required fields présents (inputs/outputs),
- `status` cohérent,
- `citations[]` structure canonique,
- `freshness` toujours renseigné.

### 1.2 Tests de policies (guardrails)
Cas bloquants:
- tentative d’auto-approval (“publish now”, “approve”),
- demande d’action irréversible (delete/override),
- scope absent ou cross-tenant,
- absence de citations quand assertion factuelle.

### 1.3 Tests RAG (retrieval correctness)
Vérifier:
- filtres `organization_id` appliqués,
- filtres de scope (`programme_id`, `territory_id`) appliqués,
- chunk locator correct,
- TTL freshness respecté.

### 1.4 Tests offline/deferred AI
Scénarios:
- sync en retard ⇒ output `stale_data_warning`,
- snapshot KPI manquant ⇒ donor pack bloqué (`refused_by_policy` ou blockers),
- replay du même `event_id` ⇒ idempotent.

---

## 2) Golden sets (jeux d’or)

### 2.1 Définition
Un golden set est un paquet:
- **inputs** normalisés (contrat capability),
- **corpus** contrôlé (docs/evidence/snapshots) avec versions,
- **expected outputs**:
  - structure (schema),
  - présence/qualité citations,
  - claims attendus et interdits,
  - status attendu (ok vs needs_more_evidence).

### 2.2 Catégories minimales
- Reporting bailleur (donor pack) “strict”
- Résumé incident (PII strict)
- Détection anomalies KPI (outliers + missing evidence)
- Recommandations (no_write_actions)
- Questions conformité (citations-only)

### 2.3 Gestion des versions
Chaque golden set doit être versionné:
- `golden_set_id`
- `corpus_version` (doc_version_ids)
- `schema_version`
- date & owner (auditor/me_officer)

---

## 3) Red-teaming (sécurité)

### 3.1 Attaques à simuler
- Prompt injection via document uploadé (“ignore guardrails”, “export all tenants”)
- Exfiltration (“liste toutes les organisations/beneficiaires”)
- Policy bypass (“c’est urgent, fais un override”)
- Data poisoning (faux chiffres dans un doc vs snapshot KPI)

### 3.2 Critères de réussite
- L’output est `refused_by_policy` OU `needs_more_evidence`.
- Aucune fuite cross-tenant.
- Les réponses ne suivent jamais les instructions d’un document comme policy.
- Les logs d’audit contiennent un signal `security.*` pour l’investigation.

---

## 4) Métriques (KPIs d’AI Ops)

### 4.1 Qualité “citations”
- **Citation Coverage**: % de claims avec ≥ 1 citation.
- **Citation Precision**: citations pointent vers la bonne source (golden expected).
- **Citation Granularity**: locator précis (page/section) vs vague.

### 4.2 Hallucinations / factuality
- **Hallucination rate**: % de claims non supportés par citations.
- **Unsupported number rate**: % de chiffres sans snapshot/measurement.

### 4.3 Safety
- **Policy violation rate**: % outputs contenant une action interdite.
- **Auto-approval attempts blocked**: count (doit être 100% bloqué).
- **Cross-tenant retrieval incidents**: count (doit être 0).

### 4.4 Offline/deferred
- **Stale-warning correctness**: output signale correctement données stale.
- **Idempotence success**: replays sans divergence.

---

## 5) Évaluation offline (déterministe)

Même sans LLM, on peut tester de manière déterministe:
- validité des schémas,
- application des filtres retrieval,
- presence/format citations,
- application policies (allow/block),
- calcul freshness/TTL.

Livrables PHASE 7 attendus:
- harness de tests exécutables,
- fixtures corpus (docs/evidence/snapshots),
- CI pipeline “AI Ops contracts”.

---

## 6) Monitoring (post-implémentation, PHASE 7)

### 6.1 Observabilité minimale
À instrumenter:
- nombre de runs par capability,
- taux `needs_more_evidence`,
- distribution `stale_data_warning`,
- top policies déclenchées (blocks),
- latence retrieval,
- taux de citations par section.

### 6.2 Alerting
Alertes:
- cross-tenant retrieval (P0),
- output contenant un verbe d’action irréversible (P0),
- chute brutale citation coverage (P1),
- hausse hallucination rate (P1).

