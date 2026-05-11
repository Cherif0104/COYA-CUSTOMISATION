# PP-REP-001 — Donor pack: freeze + hash (reproductible)

- **Priorité**: P1
- **Dépendances**: PP-DB-004, PP-DB-005, PP-SEC-002, PP-BE-004
- **Owner**: Backend/Reporting (placeholder)
- **Estimation**: L

## Objectif
Implémenter le mécanisme de “freeze” d’un pack bailleur (PHASE 5): génération reproductible d’un export à partir de read-models, accompagné d’un hash et d’un audit trail garantissant l’intégrité et la traçabilité.

## Périmètre / non-objectif
- **Périmètre**:
  - Concept `report_run`/`pack_run`: `run_id`, paramètres (période, filtres), version formules, timestamps.
  - “Freeze”: snapshot logique des datasets utilisés (références, watermarks, ou tables figées selon design).
  - Hash: calcul d’un digest sur contenus/manifest (format canonique) et stockage.
  - Audit: qui a déclenché, quand, et avec quels paramètres; lien aux artefacts générés.
- **Non-objectif**:
  - Moteur de rendu templates (voir PP-REP-002).
  - Signature cryptographique PKI complète (hash suffit v1; signature peut venir ensuite).

## Acceptance criteria
- ✅ Un run de pack génère un `run_id` et un manifest contenant paramètres + sources + watermarks.
- ✅ Rejouer la génération avec le même `run_id` (ou mêmes sources figées) produit le même hash.
- ✅ Le hash est calculé sur une représentation canonique (ordre stable, encodage stable) et stocké.
- ✅ L’accès aux runs/artefacts est isolé tenant et audité.

## Stratégie de test
- **Integration**: lancer 2 runs identiques sur dataset figé → hashes identiques; dataset modifié → hash différent.
- **Replay**: rejouer un run (mêmes watermarks) → résultats déterministes.
- **Security**: matrice tenant A/B sur accès aux runs + artefacts.
