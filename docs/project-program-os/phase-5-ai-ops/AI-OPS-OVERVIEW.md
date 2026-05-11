# PHASE 5 — AI Ops Layer — Overview (contractuel)

Objectif: spécifier une **couche AI Ops** pour COYA Project & Program OS afin d’augmenter la capacité d’exécution (reporting, détection, recommandations, copilots) **sans auto-approval**, avec **citations internes obligatoires**, **audit complet**, **séparation multi-tenant**, et **compatibilité offline (AI différée)**.

Ce dossier produit des **artefacts de build** (docs/contrats/guardrails) — **pas d’intégration réelle LLM** dans cette phase.

---

## 1) Positionnement dans la roadmap

La PHASE 5 s’interface avec:
- **PHASE 1 (Data)**: documents/versioning, outbox, audit logs, RLS / isolation `organization_id`.
- **PHASE 2 (Governance)**: approvals/override/break-glass, “policy as code”, workflows (idempotence, audit).
- **PHASE 3 (Operations)**: evidence terrain, incidents, offline sync (replays idempotents).
- **PHASE 4 (M&E)**: KPI framework, règles qualité, packs bailleurs, evidence-linked + run_id/snapshots.

---

## 2) Scopes (capabilities) — ce que l’AI Ops couvre

### 2.1 Génération de rapports (report generation)
- Construire un **rapport gouverné** (narratif + tableaux + annexes) à partir de sources internes: mesures (PHASE 4), activités/missions (PHASE 3), documents & preuves (PHASE 1/3), décisions gouvernance (PHASE 2).
- Production d’un artefact **avec citations** (sources internes) et un **run_id** (traçabilité).

### 2.2 Détection d’anomalies (anomaly detection)
- Détecter des écarts et signaux faibles: incohérences KPI, dérive budgétaire, données manquantes, ruptures de séries, conflits offline, indicateurs “trop parfaits”, pièces manquantes.
- Sortie: **alertes explicables** + références de données (evidence) + sévérité.

### 2.3 Recommandations (recommendations)
- Proposer des actions opérationnelles: relance preuves, correction de données, escalade gouvernance, ajustement de planification, demandes d’audit.
- Sortie: recommandations **non-exécutables** (pas d’écriture), priorisées, justifiées, avec “human decision required”.

### 2.4 Copilots (assistants de travail)
- Copilot “Program Manager”: préparer pack, checklists, synthèses d’activité, risques.
- Copilot “Field Ops”: préparation mission, liste preuves attendues, résumé incident.
- Copilot “M&E”: complétude désagrégation, qualité, cohérence, narration.
- Copilot “Finance/Compliance”: contrôles, anomalies, liens evidence, conformité bailleur.

### 2.5 Compliance assistant (assistant conformité)
- Répondre à des questions de conformité **uniquement avec citations** (policies, règles qualité, exigences bailleur, décisions).
- Générer des checklists et pré-audits, préparer des “evidence packs”.

---

## 3) Invariants (hard rules) — non négociables

### 3.1 Human-in-the-loop (pas d’auto-approval)
- Aucune capability ne peut **approuver/publier/geler** un artefact à la place d’un humain.
- Toute action “impactante” se traduit en **recommandation** ou **draft** soumis au Governance Engine (PHASE 2).

### 3.2 Citations internes obligatoires
- Toute sortie “assertive” (chiffres, faits, conformité) doit inclure des **citations** vers des sources internes:
  - `document_version_id`, `evidence_item_id`, `measurement_id`, `audit_log_id`, `outbox_event_id`, etc.
- Sans citations suffisantes: la sortie doit être `needs_more_evidence=true` et se limiter à des questions/next steps.

### 3.3 Audit & reproductibilité
- Chaque exécution AI Ops produit:
  - un `run_id`,
  - un **journal d’audit** (inputs normalisés, politiques appliquées, retrieval plan, citations),
  - des **artefacts versionnés** (drafts) quand applicable.

### 3.4 Safety & action boundary
- **Interdiction d’actions irréversibles** (delete, publish final, override) par AI.
- Toute suggestion d’override doit exiger une procédure **break-glass** (PHASE 2) et déclencher post-review.

### 3.5 Séparation multi-tenant / RLS-first
- Le retrieval et la génération doivent être strictement bornés par `organization_id` et scopes:
  - `programme_id`, `project_id`, `territory_id`, `partner_id`, fenêtres temporelles.
- Aucune fuite inter-tenant n’est acceptable; la sortie doit refléter les mêmes contraintes que la lecture UI.

### 3.6 Compatibilité offline / AI différée
- Le système doit supporter un mode **deferred AI**:
  - collecte offline → sync → exécution AI côté serveur plus tard,
  - ou exécution locale limitée à des templates/checklists **sans knowledge externe**.
- Toute sortie doit indiquer le **niveau de fraîcheur** des données (freshness) et les éventuels retards de sync.

---

## 4) Intégration avec Governance Workflows (PHASE 2)

### 4.1 Artefacts gouvernés
Les objets produits par AI Ops sont des **artefacts** soumis aux mêmes états que le build:
- `draft → in_review → approved → frozen → published` (ex: pack bailleur, rapport incident).

### 4.2 Interaction type (pattern)
- AI produit un **draft** + citations + checklist.
- Un humain déclenche `RequestApproval` (policy appropriée) sur le draft.
- Le Governance Engine décide; l’AI n’est jamais un approver.

### 4.3 Policies “AI-aware”
Les policies peuvent imposer:
- seuil minimum de citations,
- exigences evidence par section,
- quorum renforcé si `break_glass=true`,
- interdiction de publication si données “stale” au-delà d’un TTL.

---

## 5) Livrables PHASE 5 (ce dossier)

- `AI-OPS-OVERVIEW.md` (ce document)
- `AI-CONTRACTS.md` (contrats d’inputs/outputs)
- `PROMPT-ORCHESTRATION.md` (router/outils/policies/retries/audit)
- `RAG-ARCHITECTURE.md` (vectorisation, chunking, filtres, multi-tenant, freshness)
- `GOVERNANCE-GUARDRAILS.md` (guardrails & checklist)
- `EVAL-AND-TEST-STRATEGY.md` (eval offline, red-teaming, monitoring)

---

## 6) Acceptance Criteria (mini)

- **AC1**: Chaque capability a un contrat d’E/S versionné + citations.
- **AC2**: Les invariants (no auto-approval, audit, multi-tenant, offline) sont traduits en policies + guardrails.
- **AC3**: Les outputs sont intégrables aux workflows gouvernés (PHASE 2) via `run_id` + `event_id`.
- **AC4**: La stratégie RAG est compatible RLS/scopes et supporte la fraîcheur + sources de vérité (documents/versioning/evidence/audit).

