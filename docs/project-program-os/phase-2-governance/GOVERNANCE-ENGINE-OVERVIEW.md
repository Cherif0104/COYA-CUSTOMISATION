# PHASE 2 — Governance Engine — Overview

Objectif: spécifier un **Governance Engine** exécutable (policies + flows) pour orchestrer les validations et décisions sur les objets Project & Program OS, avec **audit immuable**, **escalade SLA**, **délégation bornée**, **quorum**, et **break-glass** (override d’urgence).

Ce dossier produit des **artefacts de build** (docs + drafts) sans modifier la DB distante.

---

## 1) Scope (dans PHASE 2)

Le Governance Engine couvre:
- **Chaînes de validation** multi-étapes (programme/projet/activité/mission/dépense/rapport).
- **Approvals conditionnels** (ABAC): `territory_id`, `programme_id`, `budget_line`, `amount`, `severity`, contraintes bailleur/partner.
- **Quorum** (ex: comité 2/3) et votes.
- **Délégation** (time-bounded) et substitution automatique (absence).
- **Escalation** (timers/SLA): notifications → reassignment → fallback approver.
- **Override d’urgence** (“break-glass”) avec journalisation renforcée et post-review obligatoire.
- **Journalisation**: décisions, commentaires, pièces, timestamps, acteurs, raisons, event_id idempotent.

Hors scope PHASE 2 (mais interfaces prévues):
- UI/UX détaillée (PHASE 6).
- Moteur M&E, incident analytics, exports bailleur (PHASE 4/5/6).
- Implémentation runtime (workers/Temporal/Edge) (PHASE 7).

---

## 2) Concepts clés (contrat)

### 2.1 Approval Request (demande de validation)
Une entité “target” (ex: `activity`, `expense`) déclenche une demande:
- `target_type`, `target_id`, `organization_id`
- `policy_key` (référence DSL)
- `state`: `pending | approved | rejected | cancelled | expired | overridden | reopened`
- `event_id` (idempotence) + `correlation_id` (flow)

### 2.2 Validation chain (chaîne)
Une policy se matérialise en:
- `steps[]` ordonnés (role/committee/actor set)
- `quorum` par step (optionnel)
- `constraints` (bailleur/partner, scope territorial)
- `escalation` (timers + fallback)

### 2.3 Delegation (délégation)
Un acteur `delegator` peut déléguer à `delegatee`:
- bornée par temps (`valid_from`, `valid_to`)
- bornée par scope (programme/projet/territoire, actions)
- bornée par seuil (`approval_limit`, `amount_max`)

Règle: la délégation **n’augmente jamais** les droits (principe du “min”).

### 2.4 Conditional approvals (ABAC)
Les steps et quorum varient selon conditions:
- `amount` (seuils)
- `territory_id` (région)
- `programme_id` / `project_id`
- `budget_line` (catégories sensibles)
- `severity` (incident)
- `partner_id` / `funder_id` (exigences bailleur)

### 2.5 Escalation (SLA)
Chaque step peut définir:
- `sla`: durée max avant escalade (timer)
- `notify`: canaux (in-app/email)
- `auto_assign`: assignation à un groupe/role
- `fallback`: acteur(s) ou rôle(s) de secours

### 2.6 Quorum (committee)
Une step “committee” est validée si:
- \(approvals >= required\) (ex: 2) et \(approvals / members >= ratio\) (ex: 2/3), selon policy
- les votes sont distincts (un même user ne compte qu’une fois)
- les délégations sont appliquées avant calcul du quorum

### 2.7 Emergency override (break-glass)
Action exceptionnelle `override` pour débloquer une exécution critique.
Contrat:
- réservé à `super_admin` (et éventuellement `program_director` sous conditions strictes)
- nécessite un **motif** + **pièces** si disponibles
- produit un log renforcé + déclenche un **post-review** (audit)
- ne supprime jamais l’historique; marque l’approbation comme `overridden`

---

## 3) Invariants (hard rules)

- **Idempotence**: toute décision doit être rejouable sans double effet via `event_id` unique (ex: `workflow_events.event_id`, `outbox_events.event_id`).
- **Trace complète**: chaque action gouvernance (approve/reject/delegate/override/comment/reopen) écrit dans `audit_logs` (ou équivalent) avec `actor`, `target`, `timestamp`, `reason`, `metadata`.
- **Non-répudiation**: on conserve l’identité de l’acteur initial même en délégation (champ `delegated_by`).
- **Séparation des tâches**: un initiateur ne peut pas approuver sa propre demande si policy l’interdit (ex: dépense).
- **Override = exception**: toujours journalisé et révisable; jamais silencieux.
- **RLS-first**: aucune table gouvernance exposée en `public` sans RLS + policies validées (cf. alerte PHASE 1).

---

## 4) Interfaces avec Workflow Engine + Outbox

### 4.1 Workflow Engine (états/transitions)
Le Governance Engine agit comme un **garde-barrière** de transitions:
- commande `RequestApproval(target, policy_key, event_id)`
- signaux `Approve/Reject/Delegate/Override/Comment/Reopen`
- le Workflow Engine ne passe en `Validated/Approved/...` qu’après événement gouvernance `approval.completed`

### 4.2 Outbox (événements fiables)
Chaque changement de state gouvernance publie via outbox (pattern fiable):
- `governance.approval.requested`
- `governance.step.assigned`
- `governance.step.escalated`
- `governance.approval.approved | rejected | overridden | expired | reopened`
- `governance.delegation.created | revoked | expired`

Règle: **outbox d’abord**, puis bus/notifications; pas d’envoi direct “best effort”.

---

## 5) Sécurité / RLS (obligatoire)

Contexte: PHASE 1 a identifié des tables `public.*` avec **RLS désactivé**. PHASE 2 ne doit pas aggraver la surface d’attaque.

Contrat gouvernance:
- toutes les écritures gouvernance exigent:
  - `organization_id` match (tenant isolation)
  - actor authentifié (`auth.uid()`) + rôle OS
  - ABAC scope (programme/projet/territoire) quand applicable
- les logs (audit) restent lisibles uniquement par `super_admin` + `auditor` + owners métiers (selon policy)
- le break-glass exige un canal d’audit renforcé (événement + attribut `break_glass=true`)

Drafts à produire en PHASE 7:
- RLS sur tables gouvernance (select/insert/update) + vues de lecture pour UI
- policies spécifiques pour `auditor` (lecture, pas d’écriture)

---

## 6) Références PHASE 2 (ce dossier)

- `APPROVAL-MATRIX.md`: matrice réaliste (seuils, bailleurs, territorial).
- `APPROVAL-DSL.md`: DSL déclarative + exemples complets.
- `TEMPORAL-FLOWS-DRAFT.md`: orchestration (Temporal ou équivalent) + idempotence/outbox.
- `PERMISSIONS-GOVERNANCE.md`: mapping RBAC+ABAC → actions gouvernance + audit immuable.

