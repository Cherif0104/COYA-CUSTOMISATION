# Evidence Collection — Contrat (preuves terrain)

Objectif: définir un standard de preuve (`evidence_items`) robuste pour:
- conformité/audit (horodatage, hash, non-répudiation),
- offline-first (upload différé + idempotence),
- chaînage aux missions/activités/incidents (PHASE 3),
- intégration documents/versioning (PHASE 1).

Tables d’alignement PHASE 1: `evidence_items`, `missions`, `incidents`, `documents`, `document_versions`, `entity_documents`, `outbox_events`.

---

## 1) Types de preuves (canoniques)

Types canoniques (extensibles):
- `photo`
- `document` (scan/PDF)
- `presence` (preuve de présence / attendance)
- `signature` (signature collecte / validation bénéficiaire/partenaire)
- `geo` (point géographique / check-in)
- `note` (texte + métadonnées)

Règle: un type détermine les champs minimaux et la stratégie d’intégrité.

---

## 2) Métadonnées minimales (obligatoires)

Pour tout `evidence_item`:
- **liaison**
  - `organization_id`
  - `mission_id` (**obligatoire**)
  - `activity_id` (optionnel)
  - `incident_id` (optionnel)
  - `measurement_id` (optionnel, PHASE 4)
- **provenance**
  - `captured_by` (user id)
  - `device_id` (identité device)
  - `captured_at` (timestamp device)
  - `capture_method` (camera|upload|signature_pad|gps|manual)
- **intégrité**
  - `event_id` (idempotence key)
  - `content_hash` (SHA-256) si binaire associé
  - `size_bytes` (si binaire)
- **contexte**
  - `territory_id` (hérité mission ou présent)
  - `geo_point` (si disponible) + `geo_accuracy_m` (si disponible)
- **statut**
  - `upload_status` (conceptuel): `local_pending|uploading|uploaded|failed_retryable|failed_permanent`
  - `received_at` (serveur, quand disponible)

Interdictions:
- ne pas stocker de données personnelles sensibles non nécessaires (principe minimisation).

---

## 3) Liens vers documents & versioning (PHASE 1)

Deux modes d’implémentation acceptés (PHASE 7):

### Mode A — Evidence = Document Version
- `evidence_items` référence une `document_version_id`.
- Le binaire est stocké en Storage (S3/MinIO/Supabase Storage).
- `document_versions` porte:
  - `content_hash`, `mime_type`, `storage_key`, `created_at`.

### Mode B — Evidence autonome + lien entity_documents
- `evidence_items` porte la référence storage directement,
- et un `entity_documents` lie la preuve à mission/incident en plus (si besoin).

Invariant:
- le hash d’intégrité doit être unique et vérifiable (audit).

---

## 4) Conformité: horodatage, hash, non-répudiation

### 4.1 Horodatage
Deux horodatages:
- `captured_at` (device) — utile offline, non fiable à 100%
- `received_at` (serveur) — source-of-truth temporelle

Contrat:
- le serveur conserve les deux,
- les événements outbox utilisent `received_at` comme référence.

### 4.2 Hash
Contrat:
- `content_hash = SHA-256(binary)`
- calcul côté client avant upload si possible; sinon côté serveur à réception, puis renvoi au client.

### 4.3 Signature / présence
Pour `signature`:
- stocker le binaire signature (vecteur/bitmap) + hash,
- stocker `signer_name` (optionnel) et `signer_role` (si nécessaire), sinon éviter PII.

Pour `presence`:
- stocker la méthode (QR, liste, NFC) et le résultat agrégé (comptage) plutôt que des listes nominatives, sauf exigence contractuelle.

---

## 5) Offline & uploads différés

### 5.1 Pipeline recommandé
1) `evidence.created` (metadata) — outbox locale, idempotent
2) upload binaire (queue, retry/backoff)
3) `evidence.upload_confirmed` — outbox locale, idempotent

### 5.2 Replays & idempotence
- `event_id` stable pour `evidence.created`.
- un second `event_id` peut exister pour `upload_confirmed` (mais corrélé via `correlation_id` + `evidence_id`).

### 5.3 Faible connectivité
- chunking, compression, “wifi-only”.
- UX: afficher “preuve en attente d’upload” + “preuve validée côté serveur” quand ack.

---

## 6) Lien preuves ↔ incidents ↔ missions

Règles:
- une preuve doit être rattachée à une mission (obligatoire).
- une preuve peut aussi être rattachée à un incident (si déclarée comme support).
- incidents critiques: exiger au moins une preuve (photo/doc/geo) OU une justification auditable.

---

## 7) Événements opérationnels associés

Référence: `EVENT-CATALOG-OPERATIONS.md`.

Événements minimaux:
- `evidence.created`
- `evidence.upload_started`
- `evidence.upload_confirmed`
- `evidence.upload_failed`

Chaque événement:
- doit inclure `event_id` (idempotence),
- doit être corrélé (`correlation_id`) à la mission/incident.

