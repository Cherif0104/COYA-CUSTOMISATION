# Activity States (terrain) — Contrat

Ce document définit les états d’une `activity` et son lien avec:
- les `missions` (exécution terrain),
- la gouvernance (PHASE 2: validation région/finance),
- le calendrier (planning),
- l’offline-first (PHASE 3: sync/outbox/conflits).

Tables d’alignement PHASE 1: `activities`, `missions`, `workflow_*`, `outbox_events`.

---

## 1) Principes

- Une `activity` est un **conteneur de planification**. L’exécution terrain est portée par des `missions`.
- Les états “gouvernance” (validation) et “opérationnel” (exécution) doivent rester cohérents via:
  - **workflow** (`workflow_*`) pour la partie “approvals / gates”,
  - **état opérationnel** (ci-dessous) pour “ready / running / done”.
- L’activity ne peut pas être “exécutée” si elle n’est pas validée (sauf exceptions break-glass, PHASE 2).

---

## 2) États canoniques

États:

1. `draft`
2. `pending_validation`
3. `validated`
4. `scheduled`
5. `in_execution`
6. `paused`
7. `completed`
8. `reported`
9. `archived`

État terminal: `archived`.

Notes:
- `pending_validation` correspond à l’envoi en gouvernance (PHASE 2) et peut être reflété dans `workflow_state`.
- `scheduled` signifie: fenêtre/planification figée et au moins une mission planifiée.
- `in_execution` signifie: au moins une mission liée est `in_progress`.

---

## 3) Transitions et validations (région/finance)

### 3.1 `draft` → `pending_validation`

Déclencheur: `activity.submit_for_validation`.

Préconditions:
- `territory_id` obligatoire (PHASE 2 l’exige explicitement).
- période définie: `start_date`, `end_date`.
- objectifs/outputs minimalement décrits.

Effets:
- création `workflow_instance` (si applicable) et demande d’approval (policy `activity.field.validation.v1` ou équivalent).
- outbox: `activity.validation_requested` (idempotent).

### 3.2 `pending_validation` → `validated`

Déclencheur: `governance.approval.approved` corrélé à l’activity.

Préconditions:
- validation région (ex: `regional_coordinator`) obtenue.
- validation finance si l’activité engage des dépenses (voir matrice PHASE 2).

Effets:
- marquer `validated_at`, `validated_by` (contractuel).
- outbox: `activity.validated`.

### 3.3 `validated` → `scheduled`

Déclencheur: `activity.schedule`.

Préconditions:
- `validated`.
- au moins une `mission` créée et liée à l’activity, avec fenêtre de déploiement.

Effets:
- planification figée (contrat): modifications majeures exigent re-validation si elles changent:
  - territoire, période, budget engagé, partenaire contraignant.
- outbox: `activity.scheduled`.

### 3.4 `scheduled` → `in_execution`

Déclencheur: première mission liée passant `in_progress`.

Préconditions:
- au moins une mission `deployed` puis `check_in`.

Effets:
- outbox: `activity.execution_started`.

### 3.5 `in_execution` → `paused`

Déclencheur: `activity.pause`.

Préconditions:
- justification requise.
- aucun incident critique non traité (ou escalade en cours).

Effets:
- suspension des nouveaux déploiements de missions (contrat).
- outbox: `activity.paused`.

### 3.6 `paused` → `in_execution`

Déclencheur: `activity.resume`.

Préconditions:
- raison de reprise.
- si pause due à incident critique: gouvernance/close du post-review (PHASE 2) selon policy.

Effets:
- outbox: `activity.resumed`.

### 3.7 `in_execution` → `completed`

Déclencheur: `activity.complete`.

Préconditions:
- toutes les missions liées sont en état terminal compatible: `completed` ou `reported` ou `archived`.
- incidents critiques clos ou explicitement escaladés et acceptés.

Effets:
- outbox: `activity.completed`.

### 3.8 `completed` → `reported`

Déclencheur: `activity.submit_report`.

Préconditions:
- rapport d’activité présent (résumé + liens preuves + (option) mesures M&E).

Effets:
- outbox: `activity.reported`.

### 3.9 `reported` → `archived`

Déclencheur: `activity.archive`.

Préconditions:
- période de révision close.
- si bailleur impose audit: confirmation d’audit (PHASE 2/4) selon policy.

Effets:
- `archived_at`, `archived_by`.
- outbox: `activity.archived`.

---

## 4) Relation `activity` ↔ `missions` (invariants)

- Une `mission` doit référencer une `activity_id` valide (FK contractuelle).
- Une `activity` `draft` ne doit pas avoir de mission `deployed` (enforcement par workflow/permissions).
- Une `activity` passe à `in_execution` dès qu’une mission liée est `in_progress`.
- Une `activity` ne peut passer `completed` que si toutes les missions liées ont terminé.

---

## 5) Calendrier & modifications (règles de re-validation)

Changements “mineurs” (sans re-validation, sous audit):
- mise à jour consignes/checklist,
- ajout d’une mission supplémentaire dans la même fenêtre,
- correction typographique.

Changements “majeurs” (re-validation requise, policy PHASE 2):
- changement `territory_id`,
- changement période (start/end) au-delà d’un seuil (à définir),
- ajout d’un partenaire contraignant (bailleur/partner rules),
- modification impactant dépenses/ligne budgétaire.

---

## 6) Offline UX (mode dégradé)

- En lecture: permettre consultation cache des activités validées/schedulées.
- En écriture: autoriser uniquement les modifications “mineures” offline; mettre le reste en attente (outbox locale) ou bloquer.
- En cas d’erreur RLS (scope): marquer l’activité “locked” localement, empêcher les writes, et proposer remédiation (demande d’accès/assignation).

