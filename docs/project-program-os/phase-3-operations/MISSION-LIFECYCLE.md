# Mission Lifecycle (terrain) — Contrat

Ce document définit le cycle de vie d’une `mission` (ordre d’exécution terrain) aligné avec:
- tables PHASE 1: `missions`, `mission_team_members`, `evidence_items`, `incidents`, `outbox_events`, `workflow_*`
- gouvernance PHASE 2: validation/autorisation via Approval DSL + outbox + audit idempotent
- offline-first: outbox locale + replay + résolution conflits (PHASE 3)

---

## 1) États mission (state machine)

États canoniques:

1. `draft`
2. `validated`
3. `deployed`
4. `in_progress`
5. `completed`
6. `reported`
7. `archived`

État terminal: `archived`.

Notes:
- Le statut “cancellation” n’est pas un état canonique ici; si nécessaire, le runtime PHASE 7 l’implémente comme **compensation** (ex: `mission.cancelled_at` + event), sans casser l’historique (audit immuable).
- `archived` s’aligne avec la politique PHASE 1 (lecture OK, écriture bloquée).

---

## 2) Transitions, préconditions, effets

### 2.1 `draft` → `validated`

Déclencheur: `mission.validate` (ou `mission.authorize` selon policy organisationnelle).

Préconditions minimales:
- `organization_id`, `activity_id`, `territory_id` présents.
- fenêtre de déploiement définie (dates).
- équipe minimale définie dans `mission_team_members` (au moins un `field_officer`).
- si la mission implique un déplacement inter-zone ou un budget (per diem/transport), le contexte est prêt pour gouvernance (montants/ligne).

Gouvernance (PHASE 2):
- policy type `mission`, action `authorize` (cf. matrice: `project_manager`, `regional_coordinator`, `finance_officer` selon conditions).
- idempotence: `event_id` unique pour la demande.

Données collectées / audit:
- audit: qui a soumis, quand, champs clés (activity_id, territory_id, window, priority).
- outbox: `mission.validated` (après approval) + `governance.approval.*` associés.

### 2.2 `validated` → `deployed`

Déclencheur: `mission.deploy`.

Préconditions:
- mission `validated`.
- équipe confirmée (membres `accepted` ou assignés selon policy).
- packages offline prêts (si mobile): caches + checklist + documents requis.
- si gouvernance impose “deployment approval” distincte: demande validée.

Effets:
- assignation “active” de la mission aux devices/users (via mécanisme app, hors DB).
- outbox: `mission.deployed`.

### 2.3 `deployed` → `in_progress`

Déclencheur: `mission.check_in` (premier check-in).

Préconditions:
- mission `deployed`.
- acteur est membre de mission (contrôle RLS/ABAC).
- géolocalisation: si disponible, capture `geo_point` + précision; sinon, marquer `geo_unavailable=true`.

Effets:
- création d’un événement opérationnel check-in (outbox): `mission.check_in`.
- état mission devient `in_progress`.

### 2.4 `in_progress` → `completed`

Déclencheur: `mission.complete`.

Préconditions:
- au moins une preuve minimale collectée OU justification “no_evidence_reason” auditable.
- checklist complétée (si applicable).
- tous incidents critiques résolus ou escaladés (si `severity>=critical`, governance déclenchée).

Effets:
- état mission `completed`.
- outbox: `mission.completed`.

### 2.5 `completed` → `reported`

Déclencheur: `mission.submit_report`.

Préconditions:
- synthèse/rapport mission présent (texte + métriques minimales).
- liens vers preuves (`evidence_items`) attachés.
- si l’organisation impose validation M&E: génération/liaison measurements (PHASE 4) (non bloquant PHASE 3, mais interface prévue).

Effets:
- état mission `reported`.
- outbox: `mission.reported`.

### 2.6 `reported` → `archived`

Déclencheur: `mission.archive`.

Préconditions:
- mission `reported`.
- fenêtre de révision close (ou action admin/audit).

Effets:
- `archived_at`, `archived_by`.
- outbox: `mission.archived`.

---

## 3) Données collectées par phase (minimum viable)

### 3.1 Pendant `draft`
- contexte: `activity_id`, `territory_id`, période, priorité, objectifs.
- équipe: membres + rôles (`mission_team_members`).
- consignes: checklist / instructions.

### 3.2 Pendant `deployed` / `in_progress`
- check-in/out (timestamps device + geo si disponible).
- preuves: `evidence_items` (au fil de l’eau).
- incidents: `incidents` (au fil de l’eau).
- logs offline: tentatives d’upload / erreurs RLS / retries (events sync).

### 3.3 Pendant `completed` / `reported`
- synthèse opérationnelle (texte + champs structurés).
- rattachements: preuves / incidents / éventuellement measurements.

---

## 4) Audits (contractuels)

Chaque transition d’état mission doit produire:
- un enregistrement d’audit immuable (PHASE 1/2),
- un `outbox_events` correspondant (PHASE 1),
- une idempotence key stable (PHASE 1/3) permettant replay sans double effet.

Champs d’audit minimaux:
- `event_id`, `correlation_id` (mission flow),
- `actor_id`, `actor_role`,
- `target_type="mission"`, `target_id`,
- `from_state`, `to_state`,
- `reason` (obligatoire pour exceptions: override, completion sans preuve),
- `device_id` et `client_timestamp` si offline.

---

## 5) Cas offline / sync (règles)

### 5.1 Actions autorisées offline
- `mission.check_in`, `mission.check_out` (si mission déjà `deployed` dans le cache).
- création de preuves (`evidence_items`) en “pending upload”.
- déclaration d’incident (non critique) en local.

### 5.2 Actions nécessitant serveur/gouvernance
- `draft` → `validated` (souvent), `validated` → `deployed` (souvent), `reported` → `archived`.

Contrat UX:
- si offline: l’action est acceptée en **pending** (outbox locale) OU bloquée explicitement selon policy.

### 5.3 Erreurs RLS
Exemples:
- user non assigné (`mission_team_members`) → refus.
- scope territoire invalide → refus.

Contrat:
- pas de boucle de retry infinie: marquer l’événement `failed_permanent` et exiger action humaine.
- produire `sync.rls_denied` + diagnostic minimal (pas de données sensibles).

