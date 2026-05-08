# PHASE 3 — Operation Engine (Terrain) — Overview

Statut: **contrat de build** (exécutable en PHASE 7, sans modification DB à ce stade).

Objectif: spécifier un **Operation Engine** terrain **offline-first** pour exécuter des missions et activités, capturer des preuves, gérer la géolocalisation/logistique, tracer les incidents, et s’intégrer au **Governance Engine** (PHASE 2) + outbox/events (PHASE 1).

Contraintes:
- **Aucune modification de DB distante**.
- **Aucune modification de code app**.
- Alignement strict avec les tables PHASE 1: `activities`, `missions`, `mission_team_members`, `evidence_items`, `incidents`, `outbox_events`, `workflow_*`.

---

## 1) Scope

Le Operation Engine couvre:
- **Planification & exécution terrain**
  - création/édition d’`activities` (cadre opérationnel),
  - création/édition d’`missions` (ordre d’exécution terrain),
  - affectation équipe (via `mission_team_members`),
  - calendrier, checklists, consignes, points de contrôle.
- **Collecte de preuves (evidence)**
  - capture photo/doc, présence, signature, géo,
  - métadonnées minimales, horodatage, hash, chaîne d’audit,
  - upload différé (faible connectivité).
- **Géolocalisation & logistique**
  - points/trajectoires (optionnel), zones, check-in/out,
  - contraintes de déplacement (inter-zone), besoins logistiques (transport/per diem/équipements).
- **Incidents & conflits**
  - déclaration incident en mission/activité,
  - gestion des conflits offline (concurrency + résolution),
  - escalades gouvernance si criticité.
- **Offline-first**
  - cache chiffré, outbox locale, idempotence, replays,
  - UX “mode dégradé”, backoff, erreurs RLS, reprises.

Hors scope (mais interfaces prévues):
- Implémentation runtime (workers, apps mobiles, SDK sync) → **PHASE 7**.
- Modèle M&E complet (indicateurs/targets/measurements) → **PHASE 4**.
- UX/UI complète (Mission Control, Incident Center) → **PHASE 6**.

---

## 2) Entités opérationnelles (contrat)

### 2.1 `activities` (Activité)

Rôle: **conteneur opérationnel** rattaché à un `project`, planifié sur une période, exécutable via missions.

Champs conceptuels attendus (alignés PHASE 1/2, sans imposer une implémentation):
- Identité: `id`, `organization_id`, `project_id`, `programme_id` (si denormalisé), `territory_id`.
- Pilotage: `owner_id`, `created_by`, `assigned_region_id` (si distinct).
- Planning: `start_date`, `end_date`, `planned_outputs[]`, `constraints`.
- Gouvernance: `workflow_instance_id` / `workflow_state` (via `workflow_*`), `validated_at`, `validated_by`.
- Statut opérationnel: voir `ACTIVITY-STATES.md`.
- Audit: `created_at`, `updated_at`, `archived_at`, `deleted_at` (PHASE 1).

### 2.2 `missions` (Mission / ordre terrain)

Rôle: **unité d’exécution terrain** (déployée à une équipe, produisant preuves + incidents + éventuellement coûts).

Champs conceptuels:
- Identité: `id`, `organization_id`, `activity_id`, `project_id`, `territory_id`.
- Exécution: `deployment_window` (dates/heure), `priority`, `instructions`, `checklist`.
- Affectation: équipe via `mission_team_members`.
- Géolocalisation: `planned_location` (zone) + `actual_checkins` (événements).
- Gouvernance: autorisation mission (PHASE 2) + audit.
- Statut: voir `MISSION-LIFECYCLE.md`.

### 2.3 `mission_team_members`

Rôle: **projection d’affectation** (qui fait quoi sur la mission).

Champs conceptuels:
- `mission_id`, `user_id`, `role_in_mission` (ex: lead, enumerator, driver),
- `assigned_at`, `assigned_by`,
- `accepted_at` (si opt-in) / `status` (assigned|accepted|declined|replaced),
- invariants: un membre actif unique par `(mission_id, user_id)` (contractuel).

### 2.4 `evidence_items` (Preuves)

Rôle: **preuve rattachée** à une mission (et éventuellement à activité/mesure).

Champs conceptuels minimaux (voir `EVIDENCE-COLLECTION.md`):
- Liaison: `mission_id` (obligatoire), `activity_id` (optionnel), `incident_id` (optionnel), `measurement_id` (optionnel, PHASE 4).
- Type: `evidence_type` (photo, doc, signature, presence, geo, note).
- Intégrité: `captured_at` (device), `received_at` (serveur), `content_hash` (SHA-256), `idempotence_key`.
- Traçabilité: `captured_by`, `device_id`, `geo_point` (si disponible), `metadata`.
- Stockage: référence `document_versions`/Storage (PHASE 1) quand applicable.

### 2.5 `incidents`

Rôle: **événement anormal** (sécurité, qualité, fraude, logistique, blocage) sur mission/activité.

Champs conceptuels:
- Liaison: `mission_id` (optionnel), `activity_id` (optionnel), `project_id`, `territory_id`.
- Classification: `incident_type`, `severity` (low|medium|high|critical), `status`.
- Gouvernance: si `severity>=critical` → route governance (PHASE 2 / DSL incident).
- Preuves: `evidence_items` liés.

### 2.6 `outbox_events` (événements fiables)

Rôle: garantir la publication fiable et idempotente des événements domaine (PHASE 1).

Contrat:
- chaque mutation opérationnelle significative écrit un `outbox_events` dans la **même transaction DB** côté serveur,
- côté mobile/offline: une **outbox locale** rejoue des commandes (voir `OFFLINE-SYNC-MODEL.md`) et se dédoublonne par `event_id`/`idempotence_key`.

---

## 3) Invariants (hard rules)

### 3.1 Isolation tenant & RLS-first
- Toute entité opérationnelle est scellée par `organization_id`.
- UX: un refus RLS ne doit jamais être “silencieux”; il doit produire:
  - un état d’erreur local explicite (ex: “Accès refusé — scope territoire/programme”), et
  - un **événement sync** en diagnostic (sans fuite de données).

### 3.2 Idempotence bout-en-bout
- Toute commande offline qui peut être rejouée porte une **idempotence key** stable.
- Côté serveur, toute opération mutante doit être rejouable en **no-op** si `event_id` déjà traité (référence PHASE 1/2).

### 3.3 Audit immuable
Toute transition d’état mission/activité + toute création de preuve/incident doit produire:
- `audit_logs` (ou équivalent) avec `actor`, `target`, `timestamp`, `reason` (si applicable),
- un événement outbox (`outbox_events`) minimal (voir `EVENT-CATALOG-OPERATIONS.md`).

### 3.4 Immutabilité des preuves
- Une preuve capturée est **append-only**: on ne “modifie” pas le contenu, on crée une nouvelle version/entrée ou une preuve corrective.
- Les champs d’intégrité (hash, timestamps capture) ne sont jamais réécrits, uniquement complétés (ex: `received_at`).

### 3.5 Archivage
- Une mission/activité `archived` est **lisible**, mais non modifiable (sauf événements de correction explicitement autorisés et audités).

---

## 4) Points d’intégration (PHASE 1/2/4)

### 4.1 Governance Engine (PHASE 2)

Les transitions “bloquantes” (contractuelles) ne peuvent aboutir sans gouvernance:
- `activity.validate` (validation région/finance selon matrice),
- `mission.authorize` / `mission.deploy` (ordre mission, selon conditions),
- `incident.declare_critical` (si criticité).

Interface attendue:
- commande `RequestApproval(target, policy_key, context, event_id, correlation_id)`
- événements `governance.approval.*` consommés par Workflow/Operation Engine.

### 4.2 Budget / Finance (PHASE 1 + matrice PHASE 2)

L’Operation Engine:
- ne “décide” pas les seuils; il **applique** les décisions governance,
- lie les missions à des dépenses (si présentes) et à des lignes budgétaires (via entités finance existantes).

### 4.3 M&E (PHASE 4)

Prévoir l’attache:
- `indicator_measurements` ↔ `evidence_items` (preuve comme support d’une mesure),
- événements `measurement.*` (PHASE 4) pouvant référencer mission/activité.

---

## 5) Events (vue d’ensemble)

L’Operation Engine publie des événements “domaine” (outbox) et des événements “sync” (diagnostic/rejeu).

Voir:
- `EVENT-CATALOG-OPERATIONS.md` (catalogue + payload minimal + idempotence),
- `OFFLINE-SYNC-MODEL.md` (outbox locale, replay, conflits).

---

## 6) UX patterns offline (contractuel)

### 6.1 Mode dégradé (faible connectivité)
- Afficher l’état réseau + “dernière sync réussie”.
- Autoriser:
  - création de missions/notes/preuves en mode offline,
  - file d’attente d’upload pour médias,
  - consultation cache (lecture) si scopes valides.
- Interdire (ou mettre en attente) les actions nécessitant governance/serveur si non disponibles:
  - `validate`, `authorize`, `deploy` (selon policy).

### 6.2 Retry / backoff
- Retries exponentiels bornés + jitter pour:
  - publication outbox locale,
  - uploads médias.
- UX: bouton “Réessayer maintenant” + diagnostic simple.

### 6.3 Erreurs RLS / scope
Cas typiques:
- user hors `territory_scope` → refus sur mission/activité.
- user non assigné à mission → lecture/écriture refusée.

Contrat UX:
- afficher message clair + action de remédiation (changer territoire, demander affectation, contacter manager),
- loguer un événement `sync.rls_denied` (sans payload sensible).

