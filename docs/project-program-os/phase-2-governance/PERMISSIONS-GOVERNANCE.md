# PHASE 2 — Permissions Governance (RBAC+ABAC)

Objectif: mapper RBAC+ABAC vers les actions de gouvernance:
- `approve`, `reject`, `delegate`, `override`, `comment`, `reopen`, `view`
avec règles d’audit immuable et contraintes (séparation des tâches, scopes, thresholds).

Référence rôles OS (canon):
`super_admin`, `program_director`, `project_manager`, `regional_coordinator`, `field_officer`, `me_officer`, `finance_officer`, `partner`, `auditor`, `beneficiary`.

---

## 1) Actions de gouvernance (contrat)

- **`governance.view`**: lire une demande/step/votes (selon scope).
- **`governance.comment`**: ajouter commentaire non décisionnel (audit).
- **`governance.approve`**: voter “approve” sur une step.
- **`governance.reject`**: voter “reject” sur une step.
- **`governance.delegate`**: créer une délégation time-bounded.
- **`governance.reopen`**: rouvrir une demande (compensation).
- **`governance.override`**: break-glass (exception).
- **`governance.admin.policy_manage`**: gérer version/policies (PHASE 7).

---

## 2) ABAC (attributs) — champs attendus

Attributs utilisateur (exemples):
- `organization_id`
- `role`
- `territory_scope[]` ou `territory_scope=all`
- `programme_scope[]`
- `project_scope[]`
- `partner_scope[]`
- `approval_limit` (montant)

Attributs cible (target):
- `programme_id`, `project_id`, `territory_id`
- `partner_id`, `funder_id`
- `amount`, `budget_line`
- `severity`
- `created_by` (actor initial)

---

## 3) Matrice RBAC → actions (baseline)

### 3.1 Règles générales

- `auditor`: **lecture** + **commentaire** (optionnel) uniquement; jamais approve/reject/delegate/override.
- `partner`: lecture limitée au périmètre partenaire; commentaire/acknowledge si policy le permet; jamais override.
- `beneficiary`: aucune action gouvernance (sauf commentaire sur feedback si exposé).

### 3.2 Tableau (baseline)

Notation:
- ✅ autorisé (sous ABAC)
- ⚠️ autorisé sous contraintes supplémentaires
- ❌ interdit

| Rôle | view | comment | approve/reject | delegate | reopen | override |
|---|---:|---:|---:|---:|---:|---:|
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (break-glass) |
| `program_director` | ✅ | ✅ | ✅ (scope programme) | ✅ | ⚠️ (policy) | ⚠️ (si activé) |
| `project_manager` | ✅ | ✅ | ✅ (scope projet) | ✅ (scope projet) | ⚠️ (policy) | ❌ |
| `regional_coordinator` | ✅ | ✅ | ✅ (scope territoire) | ✅ (territoire) | ❌ | ❌ |
| `finance_officer` | ✅ | ✅ | ✅ (si \(amount <= approval_limit\)) | ✅ (scope finance) | ❌ | ❌ |
| `field_officer` | ✅ (assignés) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `me_officer` | ✅ (rapports) | ✅ | ⚠️ (report publish uniquement) | ❌ | ❌ | ❌ |
| `partner` | ✅ (scope partner) | ✅ | ⚠️ (co-approve si policy bailleur) | ❌ | ❌ | ❌ |
| `auditor` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `beneficiary` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4) Règles ABAC (décision)

### 4.1 Scope organisation (tenant)
Toujours: `user.organization_id == target.organization_id`.

### 4.2 Scope territorial / programme / projet
L’action est autorisée si:
- `territory_id` ∈ `user.territory_scope` (si applicable)
- ET `programme_id` ∈ `user.programme_scope` (si applicable)
- ET `project_id` ∈ `user.project_scope` (si applicable)

Principe: si un champ est présent sur le target, il doit être couvert par le scope correspondant (sauf `super_admin`).

### 4.3 Finance threshold (`approval_limit`)
Pour `governance.approve` sur une dépense:
- autorisé si `amount <= user.approval_limit`
- sinon: refuser et exiger escalade vers un approver avec plafond suffisant (step suivante)

### 4.4 Separation of duties (SoD)
Si policy l’exige (ex: dépense):
- `target.created_by != actor_id` pour approve/reject
- exception: break-glass (override) uniquement, avec post-review obligatoire

### 4.5 Contrainte bailleur / partenaire
Si `funder_policy.requires_partner_signoff=true`:
- `partner` peut `approve` uniquement si:
  - `partner_id` ∈ `user.partner_scope`
  - step = `partner_signoff`
Sinon: `partner` limité à `comment/acknowledge`.

---

## 5) Audit immuable (obligatoire)

Chaque action gouvernance écrit un événement d’audit avec:
- `event_id` (idempotence) + `correlation_id`
- `actor_id`, `actor_role`
- `action` (approve/reject/delegate/override/comment/reopen)
- `target_type`, `target_id`, `policy_key`, `step_key`
- `decision` (si applicable)
- `reason` (obligatoire pour reject/override/reopen)
- `delegated_by` (si applicable)
- `break_glass=true` (override)

Règle: l’audit ne se “corrige” pas; on ajoute un événement de compensation.

---

## 6) Sécurité / RLS (rappel PHASE 1)

Contexte: plusieurs tables `public.*` ont été observées avec RLS désactivé.

Contrat pour la gouvernance:
- activer RLS sur les tables gouvernance + audit/outbox associées **avant** exposition UI/API.
- policies minimales:
  - `SELECT`: acteurs impliqués (assignees/voters), owners (programme/projet), `super_admin`, `auditor`
  - `INSERT/UPDATE`: uniquement les actions autorisées par RBAC+ABAC (via RPC contrôlées ou policies strictes)
- **Postgres gotcha**: pour `UPDATE`, un `SELECT` policy peut être requis; prévoir policies cohérentes.

