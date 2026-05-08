# Offline Sync Model — Contrat (offline-first)

Objectif: définir un modèle offline-first cohérent avec:
- PHASE 1: outbox/events (`outbox_events`), idempotence, audit, versioning,
- PHASE 2: governance via workflows + events idempotents (`event_id`),
- PHASE 3: opérations terrain (missions/activities/evidence/incidents).

Ce document ne modifie aucune DB distante; il fixe les **invariants** nécessaires à l’implémentation (PHASE 7).

---

## 1) Architecture offline (vue d’ensemble)

### 1.1 Composants côté client (mobile / web offline)

- **Encrypted Local Cache (ELC)**:
  - cache des entités: `activities`, `missions`, `mission_team_members`, `evidence_items`, `incidents`,
  - index local minimal (par `updated_at`, `territory_id`, assignation).
- **Local Outbox (LO)**:
  - file d’attente de commandes/événements à synchroniser (`outbox_events` local, distinct du serveur),
  - ré-essais, backoff, marquage permanent failure.
- **Upload Queue (UQ)**:
  - file d’uploads médias (photos/docs) avec états: `pending|uploading|uploaded|failed_retryable|failed_permanent`.
- **Sync Cursor Store (SCS)**:
  - stockage des curseurs `sync_cursor` par “flux” (missions/activities/evidence/incidents).

### 1.2 Côté serveur (contractuel)

- **Transactional DB**: tables source-of-truth (PHASE 1).
- **Outbox Server (`outbox_events`)**:
  - écrit dans la même transaction que la mutation,
  - publié vers bus/notifications par worker.
- **Workflow/Governance**:
  - consommation de commandes idempotentes,
  - émission d’événements gouvernance corrélés.

---

## 2) Cache chiffré (ELC)

### 2.1 Exigences minimales
- Chiffrement “at rest” avec clé dérivée d’un secret utilisateur/device.
- Séparation multi-org: un cache par `organization_id`.
- Effacement sécurisé à logout / rotation token.

### 2.2 Stratégie de cache (lecture)

- Le client télécharge un **jeu minimal**:
  - missions assignées (et leur activity parent),
  - preuves/incidents liés à ces missions,
  - activités “dans scope” si rôle (ex: `regional_coordinator`, `project_manager`).
- Le cache est **stale-tolerant**:
  - il peut afficher un état “à confirmer” quand la sync est en retard,
  - il ne doit pas inventer des droits; si un objet devient interdit (RLS), il doit être masqué/lock.

---

## 3) Outbox locale (LO)

### 3.1 Schéma conceptuel (local)

Chaque entrée outbox locale contient au minimum:
- `local_event_id` (UUID)
- `event_id` (UUID) — **idempotence key stable** (voir 4)
- `correlation_id` (UUID) — groupe de flux (ex: “mission-flow”)
- `aggregate_type` (`mission|activity|evidence|incident|sync`)
- `aggregate_id`
- `event_type` (voir `EVENT-CATALOG-OPERATIONS.md`)
- `payload_min` (payload minimal contractuel)
- `created_at_client` (horloge device)
- `attempt_count`, `next_attempt_at`, `status`:
  - `pending|sending|acked|failed_retryable|failed_permanent`
- `last_error_code` (ex: `NETWORK`, `RLS_DENIED`, `CONFLICT`, `VALIDATION`)
- `last_error_message` (sanitisé)

### 3.2 Invariants outbox
- Une entrée `acked` ne doit jamais repasser `pending`.
- Un `event_id` ne doit pas produire deux effets côté serveur.
- Si le serveur répond “duplicate event_id”, le client doit traiter comme `acked` (no-op).

---

## 4) Idempotence keys & replay

### 4.1 Règle générale
Toute commande offline doit être **rejouable** sans double effet.

Clé: `event_id` (UUID) unique par action.

### 4.2 Construction de `event_id`
Contrat PHASE 7:
- `event_id` est généré client (offline) ou serveur (online), mais doit être stable en replay.
- Pour uploads médias en chunks/retry: utiliser un `content_id` stable + `event_id` stable.

### 4.3 Replay (client → serveur)
Le client rejoue `Local Outbox` dans l’ordre FIFO **par agrégat** (au minimum):
- pour `mission`: ordre check-in/out, completion, report,
- pour `evidence`: create metadata, upload content, attach,
- pour `incident`: declare, update status, attach evidence.

Contrat:
- les replays doivent être **idempotents** (serveur renvoie success/no-op).
- le serveur doit renvoyer une **ack** contenant:
  - `event_id`, `server_time`, `server_seq` (optionnel), `sync_cursor` mis à jour.

---

## 5) Sync cursors (SCS)

### 5.1 Modèle
Chaque flux sync est paginé/streamé par un curseur monotone:
- `activities_cursor`
- `missions_cursor`
- `evidence_cursor`
- `incidents_cursor`
- `governance_cursor` (événements d’approvals liés aux objets terrain)

Le curseur peut être:
- un `updated_at` + tie-breaker `id`,
- ou un `server_seq` (préférable), ou un `outbox_events.id`.

### 5.2 Règles
- Le client ne “rewind” jamais un curseur sauf re-synchronisation complète.
- Un curseur ne garantit pas l’absence de conflits; il garantit juste la continuité des pulls.

---

## 6) Conflits (concurrency) — modèle & règles

Référence détaillée: `CONFLICT-RESOLUTION.md`.

### 6.1 Types de conflits
- **Write-write**: deux clients modifient le même champ (ex: mission window).
- **Write-read (RLS)**: un client détient un objet en cache mais perd le droit (scope).
- **Causal ordering**: upload preuve arrive après mission archivée.

### 6.2 Stratégies supportées (contractuelles)

Par défaut:
- **server-wins** sur champs non critiques de planification (ex: titre, description).
- **merge** sur collections append-only (preuves, incidents, notes).
- **reject** si le conflit viole un invariant (ex: mission archivée modifiée).

Le runtime PHASE 7 doit exposer un champ de contrôle (conceptuel):
- `row_version` / `updated_at` / `etag` pour détecter conflits.

---

## 7) Règles de compatibilité (faible connectivité)

### 7.1 Uploads différés (pièces / preuves)

Contrat:
- `evidence_items` est créé d’abord avec `status=local_pending_upload` (conceptuel),
- upload du binaire ensuite (Storage),
- puis “attach/confirm” serveur (event `evidence.upload_confirmed`).

En faible connectivité:
- chunking recommandé,
- retry/backoff avec jitter,
- possibilité “wifi-only uploads”.

### 7.2 Limites & dégradations
- réduire la fréquence de pull (cursors) et privilégier “delta” par mission assignée.
- désactiver les médias lourds en prévisualisation.
- compresser images/vidéos (policy PHASE 7).

---

## 8) Gestion d’erreurs (UX + sécurité)

### 8.1 Erreurs réseau
- classer `retryable`,
- backoff exponentiel borné,
- bouton “réessayer maintenant”.

### 8.2 Erreurs RLS / 403
- classer `failed_permanent` par défaut (sauf re-auth),
- produire un événement `sync.rls_denied` (payload minimal, sans fuite),
- marquer l’objet en cache “locked” et empêcher writes.

### 8.3 Erreurs de validation (400)
- classer `failed_permanent`,
- afficher le champ en erreur,
- proposer “éditer et renvoyer” (nouvel `event_id`).

### 8.4 Erreurs de conflit (409)
- classer `failed_retryable` ou `requires_user_resolution` selon stratégie entité,
- proposer un écran “résolution conflit” (PHASE 6),
- loguer `sync.conflict_detected` avec références (ids, versions), sans données sensibles.

