# PHASE 5 — Prompt Orchestration (Router/Tools/Policies) — contractuel

Objectif: définir une orchestration “prompt + tools” **sans dépendre d’un LLM spécifique**, garantissant:
- **idempotence** (replays sans double effet),
- **audit complet** (runs traçables),
- **PII handling** (minimisation + redaction),
- **séparation multi-tenant** (RLS-first),
- **no auto-approval** et **no irreversible actions**.

Cette doc décrit la **logique contractuelle**; l’implémentation runtime est en PHASE 7.

---

## 1) Architecture d’orchestration (vue d’ensemble)

### 1.1 Composants
- **AI Router**: route une demande vers une capability (`generate_report`, `detect_anomalies`, etc.) selon l’intent, le scope et les policies.
- **Policy Gate** (Policy as Code): évalue les contraintes (citations, stale data, PII, write-actions).
- **Retrieval Planner**: construit un plan de retrieval (RAG) avec filtres multi-tenant et contraintes de fraîcheur.
- **Tool Executor**: exécute des “tools” internes (DB read, doc store read, aggregation snapshot read) en lecture seule.
- **Composer**: assemble un output strictement conforme aux contrats (`AI-CONTRACTS.md`).
- **Audit Logger**: écrit un journal complet (run, inputs normalisés, policy decisions, tool calls, citations).

### 1.2 Principe “Read-only by default”
Toutes les capabilities sont **read-only**. Toute mutation souhaitée (ex: “créer une demande d’approbation”) doit être produite comme:
- `next_actions[]` **non exécutées**,
- ou `draft` à soumettre au Governance Engine.

---

## 2) Routing (router) — règles contractuelles

### 2.1 Inputs router (conceptuel)
- `intent`: demande utilisateur ou déclencheur système (ex: cron deferred AI).
- `organization_id` + `scope` + `period`.
- `actor`: rôle (RBAC/ABAC), mais **l’AI n’excède jamais** les droits de lecture du rôle.
- `offline_mode`: `deferred|online|local_templates_only`.

### 2.2 Décision de route
Le router sélectionne:
- la capability,
- un “policy profile” (ex: `donor_pack_strict`, `incident_summary_strict_pii`),
- un plan de retrieval minimal.

### 2.3 Refus contrôlé
Le router doit renvoyer `refused_by_policy` si:
- scope incomplet ou non autorisé,
- citations exigées mais sources indisponibles,
- tentative d’“action irréversible” (même si formulée en langage naturel).

---

## 3) Tools (lecture) — catalogue minimal

> Les tools réels (DB / storage / search) seront implémentés en PHASE 7. Ici, contrat de comportements.

### 3.1 Tools autorisés (read)
- `read_entity(entity_type, id, organization_id)`
- `query_entities(filter, organization_id, scope, period)`
- `read_document_version(document_version_id, organization_id)`
- `read_evidence_item(evidence_item_id, organization_id)`
- `read_audit_logs(filter, organization_id)`
- `read_governance_decisions(filter, organization_id)`
- `read_aggregation_snapshot(aggregation_run_id, organization_id)`

### 3.2 Tools interdits (write/irreversible)
Interdiction contractuelle pour AI Ops:
- `delete_*`, `publish_*`, `approve_*`, `override_*`, `apply_migration`, `update_rls`, etc.

---

## 4) Policies & guardrails (policy as code)

### 4.1 Policies minimales (exemples)
- **P1 — No auto-approval**: toute sortie contenant “approved/frozen/published” doit être bloquée; convertir en `next_actions`.
- **P2 — Citations required**: pour toute assertion factuelle/chiffrée, exiger `citations[]`.
- **P3 — Tenant boundary**: refuser toute donnée sans `organization_id` match.
- **P4 — Read-only**: refuser tout plan impliquant un tool write.
- **P5 — PII minimization**: redacter/éviter PII; refuser si demande de données sensibles non nécessaires.
- **P6 — Freshness**: si `max_source_age_seconds` > TTL, produire `stale_data_warning` ou refuser selon profile (bailleur: strict).

### 4.2 Traces policy (audit)
Chaque run doit enregistrer:
- policy profile,
- décisions (allow/block) + raisons,
- exceptions (break-glass: **jamais** déclenché par AI; seulement référencé).

---

## 5) Retries, timeouts, et idempotence

### 5.1 Idempotence keys
Chaque requête capability inclut `event_id`.
Règles:
- même `event_id` ⇒ même `run_id` (ou “run reused”) si replay à contenu identique,
- un `event_id` ne doit pas produire deux drafts distincts sans `revision_id`.

### 5.2 Retry policy (lecture)
- Tools read: retries avec backoff borné (réseau/transient).
- Pas de retries aveugles si erreur “scope/tenant” (traiter comme policy violation).

### 5.3 Déduplication
L’orchestrateur doit dédupliquer:
- replays offline (ex: job deferred AI relancé),
- triggers multiples d’un même incident.

---

## 6) Logging & audit (obligatoire)

### 6.1 Journal d’exécution (run log)
Chaque run doit inclure:
- `run_id`, `event_id`, `correlation_id`, `organization_id`,
- actor role (pas de PII inutile),
- capability + schema_version,
- retrieval plan (sources, filtres, top_k),
- citations consolidées,
- outputs + status,
- hash/empreinte (optionnelle) pour détection de dérive.

### 6.2 Niveaux de logs
- **audit log**: durable, minimal, non-PII.
- **debug log**: éphémère, fortement redacted, accès restreint.

---

## 7) PII handling (minimisation + redaction)

### 7.1 Principes
- Minimiser: ne récupérer que les champs nécessaires.
- Redacter: masquer noms, téléphones, adresses, IDs personnels quand non requis.
- Éviter: ne jamais inclure PII dans prompts/logs si non strictement nécessaire.

### 7.2 Champs sensibles (exemples)
Catégories à traiter “strict”:
- identités nominatives, numéros, adresses,
- données médicales/handicap (si existantes),
- contenu de pièces pouvant contenir PII (docs scannés).

### 7.3 Mode offline/deferred
En deferred AI:
- ne pas exiger de “recontacter” l’utilisateur; produire une liste d’actions recommandées (ex: “ajouter preuve X”).
- marquer les outputs avec `freshness` et `needs_more_evidence` si sources manquantes.

---

## 8) Prompt injection & contenu non fiable

Le système doit supposer que:
- les documents (uploads) peuvent contenir des instructions malveillantes,
- les champs texte (notes terrain) peuvent être non fiables.

Contrat:
- les tools de retrieval doivent **isoler** les sources et ne jamais exécuter des instructions issues des documents,
- toute “instruction” trouvée dans une source est traitée comme **donnée**, jamais comme policy.

Référence: `GOVERNANCE-GUARDRAILS.md`.

