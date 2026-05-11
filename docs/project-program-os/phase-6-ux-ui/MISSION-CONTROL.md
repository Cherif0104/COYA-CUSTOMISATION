# Mission Control

## But
Opérer une **mission** comme une “console” terrain: timeline, checklist, équipe, preuves, dépenses, incidents, sync.

## Sections
### 1) Header mission (gradient)
- titre + statut (draft/validated/deployed/in_progress/…)
- territoire + device
- badge sync (online/offline, last sync, outbox count)
- actions: “Ajouter preuve”, “Déclarer incident”, “Soumettre dépense”

### 2) Timeline opérationnelle
Chronologie des événements:
- validations (région/finance)
- départ/arrivée
- collecte preuves
- dépenses soumises/validées
- incidents ouverts/résolus

### 3) Checklist terrain
Checklist configurable par type de mission:
- présence/feuille
- photos
- signatures
- geo-check
- rapport final

### 4) Équipe
Liste `mission_team_members` + rôles (leader/member/me/finance).

### 5) Preuves (Evidence)
Liste evidence_items + statut upload (pending/uploaded/failed) + hash/horodatage.

### 6) Dépenses
Dépenses liées mission + état d’approbation (PHASE 2).

## Offline UX
- capture preuves offline (file + metadata)
- queue upload différé (retries/backoff)
- “conflict banner” si divergence serveur

## Acceptance Criteria
- **AC-MISS-01**: chaque action terrain produit un événement (timeline) + audit.
- **AC-MISS-02**: offline: preuves/dépenses/incidents créables, avec sync status explicite.
- **AC-MISS-03**: checklist configurable par mission_type, avec gates avant clôture.

