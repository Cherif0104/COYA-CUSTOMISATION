# PHASE 2 — Approval Matrix (réaliste)

Objectif: formaliser une matrice d’approbation **actionnable** couvrant:
- objets: programme, projet, activité, mission, dépense, rapport
- rôles OS: `super_admin`, `program_director`, `project_manager`, `regional_coordinator`, `field_officer`, `me_officer`, `finance_officer`, `partner`, `auditor`, `beneficiary`
- attributs ABAC: `territory_id`, `programme_id`, `project_id`, `budget_line`, `amount`, `severity`, contraintes `partner_id` / `funder_id`
- règles: quorum, escalation SLA, délégation, override (break-glass)

Cette matrice se traduit en policies dans `APPROVAL-DSL.md`.

---

## 1) Principes

- **RBAC + ABAC**: le rôle autorise l’action, l’ABAC décide le scope (territoire/programme/projet/partenaire) + contraintes financières.
- **Seuils financiers** via `approval_limit` (par utilisateur, typiquement `finance_officer` / `program_director`).
- **Séparation des tâches**: l’initiateur d’une dépense ne valide pas sa propre dépense (sauf emergency override, journalisé).
- **Bailleur/Partner constraints**: certaines lignes budgétaires ou montants exigent validation additionnelle (ex: partner/funder).
- **Escalation**: si SLA expirée, notification + reassignment + fallback.
- **Override**: break-glass uniquement, avec post-review obligatoire.

---

## 2) Seuils financiers (référence)

Notation:
- \(A\) = `amount` (montant)
- \(L_u\) = `approval_limit` du user (montant max approvable)

Règles:
- `finance_officer` peut approuver si \(A <= L_u\) et scope ABAC ok.
- au-delà, escalade vers `program_director` puis `super_admin` si besoin.

Seuils recommandés (à ajuster par org):
- **T0**: \(A <= 250_000\) XOF → finance + région (si terrain)
- **T1**: \(250_001 <= A <= 2_000_000\) XOF → finance + direction programme
- **T2**: \(2_000_001 <= A <= 10_000_000\) XOF → comité (quorum) + direction
- **T3**: \(A > 10_000_000\) XOF → comité + `super_admin` (double validation)

---

## 3) Matrice par objet (conditions → chaîne)

### 3.1 Programme

#### Création / modification structurante
- **Action**: `programme.submit_for_validation`
- **Conditions**:
  - scope `programme_id` (owner)
  - si bailleur impliqué (`funder_id != null`) → inclure `partner` (lecture/comment uniquement)
- **Chaîne**:
  - Step 1: `program_director` (1/1) — SLA 48h
  - Step 2: `finance_officer` (1/1) si budget initial présent — SLA 48h
  - Step 3: comité programme (2/3) si \(budget_total > T2\) — SLA 5 jours

#### Clôture programme
- **Action**: `programme.close`
- **Chaîne**:
  - `program_director` (1/1)
  - `auditor` (comment required, pas de veto) si bailleur → SLA 72h

### 3.2 Projet

#### Validation de lancement (go/no-go)
- **Action**: `project.validate_launch`
- **Conditions**: `programme_id` requis; territoire affecté requis
- **Chaîne**:
  - Step 1: `project_manager` (1/1) — SLA 24h
  - Step 2: `regional_coordinator` (1/1) si projet terrain — SLA 24h
  - Step 3: `finance_officer` (1/1) si budget activé — SLA 48h
  - Step 4: `program_director` (1/1) si \(budget_total > T1\) ou bailleur strict — SLA 48h

### 3.3 Activité (terrain)

#### Validation activité avant exécution (terrain)
- **Action**: `activity.validate`
- **Conditions**:
  - `territory_id` obligatoire
  - si `partner_id` contraignant (ex: ONG partenaire exécute) → `partner` doit “acknowledge” (non bloquant) ou “co-approve” selon bailleur
- **Chaîne standard**:
  - Step 1: `regional_coordinator` (1/1) — SLA 24h
  - Step 2: `finance_officer` (1/1) si activité engage budget/dépenses — SLA 24h
  - Escalation: si SLA step1 expirée → assign à `program_director`; si step2 expirée → assign à finance fallback (groupe)

### 3.4 Mission (ordre de mission)

#### Autorisation de mission
- **Action**: `mission.authorize`
- **Conditions**:
  - mission liée à `activity_id`
  - si `severity` incident associé \(\ge high\) → route “incident critique” (cf. 3.6)
- **Chaîne**:
  - Step 1: `project_manager` (1/1) — SLA 12h
  - Step 2: `regional_coordinator` (1/1) si déplacement inter-zone — SLA 12h
  - Step 3: `finance_officer` (1/1) si per diem / transport > T0 — SLA 24h

### 3.5 Dépense

#### Soumission dépense (submit)
- **Action**: `expense.submit`
- **Pré-contrôles**:
  - `budget_line` obligatoire
  - justificatif obligatoire sauf exceptions (per diem standard)
  - anti-self-approval (initiator != approver)

#### Validation dépense (approve)
- **Action**: `expense.approve`
- **Conditions & chaîne**:
  - **A <= T0**:
    - Step 1: `finance_officer` (1/1) si \(A <= L_u\) — SLA 24h
    - Step 2: `project_manager` (1/1) si dépense projet — SLA 24h (optionnel selon org)
  - **T0 < A <= T1**:
    - `finance_officer` (1/1)
    - `program_director` (1/1)
  - **T1 < A <= T2**:
    - `finance_officer` (1/1)
    - comité finance (2/3) — SLA 5 jours
    - `program_director` (1/1)
  - **A > T2**:
    - `finance_officer` (1/1)
    - comité finance (2/3)
    - `super_admin` (1/1)

#### Lignes budgétaires sensibles
Si `budget_line` ∈ {“consulting”, “procurement”, “asset”, “cash_advance”}:
- augmenter exigence: comité requis dès T1
- `auditor` reçoit notification et peut commenter (non bloquant), sauf bailleur impose veto

#### Contraintes bailleur / partenaire
Si `funder_policy.requires_partner_signoff = true`:
- ajouter step `partner`:
  - mode `acknowledge` (non bloquant) ou `co-approve` (bloquant), selon bailleur

### 3.6 Incident critique (governance)

#### Déclenchement incident critique
- **Action**: `incident.declare_critical`
- **Conditions**: `severity >= critical`
- **Chaîne**:
  - Step 1: `regional_coordinator` (1/1) — SLA 2h
  - Step 2: `program_director` (1/1) — SLA 4h
  - Step 3: comité crise (2/3) OU `super_admin` break-glass si urgence — SLA 6h

---

## 4) Règles d’override (break-glass)

Override autorisé uniquement si:
- `severity >= critical` OU blocage sécurité/opérations terrain documenté
- justification textuelle + pièces (si existantes)
- actor ∈ {`super_admin`} (et éventuellement `program_director` si policy le permet)

Effets:
- l’approval passe en `overridden` (jamais “approved” silencieusement)
- un **post-review** est automatiquement créé (comité/auditor)
- outbox event `governance.approval.overridden` + audit renforcé (`break_glass=true`)

---

## 5) Sécurité / RLS (note PHASE 1)

Contrat minimal:
- tables gouvernance et logs: RLS activé + policies avant exposition.
- **UPDATE nécessite SELECT policy** en Postgres: prévoir policies de lecture pour permettre update.
- `auditor`: lecture des décisions + logs (scope org), pas d’écriture sauf commentaires (optionnel).
- `partner` / `beneficiary`: aucune capacité `approve/delegate/override`; lecture limitée (si exposée) à leurs objets.

