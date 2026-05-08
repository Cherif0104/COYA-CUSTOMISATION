# Conflict Resolution — Stratégies (Opérations & Offline)

Objectif: définir des stratégies de résolution des conflits cohérentes avec:
- tables PHASE 1 (`activities`, `missions`, `evidence_items`, `incidents`, `outbox_events`, `workflow_*`),
- invariants audit/idempotence (PHASE 1/2),
- modèle offline/outbox/cursors (PHASE 3).

Ce document s’applique aux conflits:
- **client-client** (deux devices offline),
- **client-serveur** (stale cache),
- **droits** (RLS/ABAC changeants),
- **ordering** (événements hors ordre).

---

## 1) Taxonomie de conflits

### 1.1 Write-write (WW)
Deux acteurs écrivent la même entité avant synchronisation.

Ex: deux managers modifient la fenêtre d’une mission.

### 1.2 Write-after-archive (WAA)
Un client tente une mutation sur une entité archivée/supprimée.

### 1.3 Permission drift (PD)
Un objet en cache n’est plus accessible (scope révoqué, mission réassignée).

### 1.4 Causal ordering (CO)
Un événement “enfant” arrive après un “parent” terminal.

Ex: upload preuve après `mission.archived`.

### 1.5 Duplicate replay (DR)
Ré-envoi d’un `event_id` déjà traité (doit être no-op).

---

## 2) Stratégies générales (contractuelles)

### 2.1 Règles de priorité
Priorité (du plus strict au plus permissif):
1. **Invariant violation** → `reject` (erreur permanente)
2. **RLS/ABAC** → `reject` (permanent, sauf re-auth)
3. **Workflow gate** (gouvernance) → `defer` (en attente) ou `reject` selon policy
4. **Merge safe** (append-only) → `merge`
5. **Sinon** → `server-wins` ou `client-wins` selon champ (voir par entité)

### 2.2 Modèles de résolution disponibles
- **server-wins**: le serveur fait foi (utile pour planification partagée).
- **client-wins**: rare, réservé aux champs “device truth” (captured_at, geo capture) quand validés.
- **merge**: concat/union déterministe (append-only).
- **reject**: refus avec raison; nécessite intervention utilisateur.
- **defer**: mise en attente jusqu’à condition (gouvernance/parent existant).

### 2.3 Exigences d’audit
Toute résolution (automatique ou manuelle) doit produire:
- un log d’audit (ou event outbox) `sync.conflict_resolved` / `sync.conflict_rejected`,
- `event_id`, `correlation_id`, références versions (etag/updated_at/row_version).

---

## 3) Stratégies par entité

### 3.1 `activity`

Conflits typiques:
- WW sur champs planification (dates, territoire),
- changements majeurs vs mineurs (re-validation).

Stratégie:
- Champs “mineurs” (instructions, checklist, notes):
  - **merge** si append-only / **server-wins** sinon.
- Champs “majeurs” (territory_id, start/end, partner constraints, budget flags):
  - **reject** si l’activity est `pending_validation|validated|scheduled|in_execution` et la mutation n’a pas été re-validée.
  - **defer** si la mutation vise à créer une nouvelle demande de validation (en attente serveur).

Exemple:
- Client A (offline) modifie `end_date`.
- Serveur a déjà `validated`.
Résolution: `reject` + message “modification majeure requiert re-validation”.

### 3.2 `mission`

Conflits typiques:
- WW sur fenêtre, équipe, instructions,
- WAA (mission archivée),
- CO (preuves après archive).

Stratégie:
- `draft`:
  - **server-wins** sur champs partagés (titre, window) sauf si mutation porte `event_id` plus récent et aucune version serveur (option).
- `validated|deployed|in_progress`:
  - instructions/checklist: **server-wins** (éviter divergence),
  - check-in/out: **client-wins** si signé par device + append-only (événement), sinon **reject**.
- `completed|reported|archived`:
  - toute modification structurelle: **reject** (WAA),
  - ajout de preuve tardive:
    - **defer** si policy autorise “late evidence window”,
    - sinon **reject**.

Exemple:
- Client A (offline) fait `mission.check_in` à 10:05.
- Client B a déjà `mission.completed` côté serveur à 10:02.
Résolution: **reject** + audit “late check-in rejected”.

### 3.3 `evidence_item`

Conflits typiques:
- duplicate proof (même photo envoyée 2 fois),
- upload partiel, retries, reorder.

Stratégie:
- Preuves: **append-only**.
- Dédoublonnage:
  - par `content_hash` + `captured_at` + `captured_by` (contrat), ou par `idempotence_key`.
- Upload:
  - si `event_id` duplicate → no-op (acked),
  - si `content_hash` déjà existant pour la mission et même type → **merge** (lier au même document_version) ou **reject** selon policy anti-fraude.

Exemple:
- Deux retries upload créent deux entrées `evidence_items` avec même `event_id`.
Résolution: **no-op** sur la seconde (DR).

### 3.4 `incident`

Conflits typiques:
- WW sur `status` (open/in_review/closed),
- criticité qui escalade governance.

Stratégie:
- `severity`:
  - si une mise à jour augmente la sévérité: **server-wins** si serveurs plus stricts, sinon **merge** vers la plus haute sévérité.
  - baisse de sévérité: **reject** si governance post-review en cours.
- `status`:
  - transitions doivent respecter le workflow; sinon **reject**.
- Ajout preuves: **merge** (append-only).

### 3.5 `measurement` (référence PHASE 4)

Conflits typiques:
- deux relevés pour même indicateur/période,
- preuves attachées multiples.

Stratégie (pré-contrat):
- si duplication: **merge** en conservant les deux mesures et marquer “needs_review” (audit),
- jamais écraser silencieusement une mesure: éviter `server-wins` destructif.

---

## 4) Exemples de conflits et résolutions (end-to-end)

### Exemple A — Mission team membership divergent
Situation:
- Client A assigne `userX` à la mission (offline).
- Client B remplace `userX` par `userY` (online) avant sync de A.

Résolution:
- `mission_team_members`: **server-wins** pour “active roster”.
- Conserver audit de la tentative A en `sync.conflict_rejected` + raison “mission reassigned”.

### Exemple B — Evidence upload après perte d’accès (RLS)
Situation:
- Le field officer capture une preuve (offline).
- Entre-temps la mission est réassignée; RLS refuse l’upload.

Résolution:
- classer `failed_permanent` (PD),
- conserver l’asset local chiffré,
- proposer “transférer au lead” (PHASE 6) ou “exporter preuve” selon policy.

### Exemple C — Activity major change en exécution
Situation:
- Un manager modifie `territory_id` d’une activité qui a des missions `in_progress`.

Résolution:
- **reject** (invariant),
- exiger création d’une **nouvelle activity** + plan de migration (PHASE 7).

---

## 5) Signaux événements “sync.*” (diagnostic)

Événements recommandés (payload minimal dans `EVENT-CATALOG-OPERATIONS.md`):
- `sync.conflict_detected`
- `sync.conflict_resolved`
- `sync.conflict_rejected`
- `sync.rls_denied`
- `sync.replay_duplicate_ignored`

Règle: ces événements ne doivent contenir aucun champ sensible; uniquement ids + codes + versions.

