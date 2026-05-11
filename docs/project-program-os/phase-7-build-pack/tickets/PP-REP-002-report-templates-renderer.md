# PP-REP-002 — Renderer de templates de rapports (PDF/HTML)

- **Priorité**: P1
- **Dépendances**: PP-REP-001
- **Owner**: Backend/Reporting (placeholder)
- **Estimation**: M

## Objectif
Fournir un moteur de rendu de rapports (PHASE 5) basé sur des templates versionnés (HTML/PDF), alimenté par les datasets “freeze” d’un `run_id`, afin de produire des artefacts bailleurs consistants et auditables.

## Périmètre / non-objectif
- **Périmètre**:
  - Catalogue de templates (version, langue, type) et paramètres d’entrée validés.
  - Pipeline de rendu: dataset (freeze) → rendu HTML → export PDF (si requis) + stockage artefacts.
  - Manifest d’artefact: template_version, run_id, hash dataset, hash rendu.
  - Gestion erreurs: rendu échoué, retry idempotent, diagnostics.
- **Non-objectif**:
  - Éditeur WYSIWYG de templates.
  - Publication externe (portail) si non déjà cadrée.

## Acceptance criteria
- ✅ Un template versionné peut être rendu à partir d’un `run_id` (datasets freeze) sans accès direct aux tables sources.
- ✅ Le rendu est reproductible: même template_version + même run_id → même résultat (hash) hors champs explicitement non déterministes.
- ✅ Les artefacts sont isolés tenant, audités, et référencés par un identifiant stable.
- ✅ En cas de retry/replay, le rendu ne produit pas de doublons (idempotence).

## Stratégie de test
- **Unit**: validation schémas d’entrée, helpers de templating, gestion erreurs.
- **Integration**: run_id figé → rendu HTML/PDF → hash stable; retry → pas de doublon.
- **E2E**: génération pack → rendu → téléchargement/visualisation + vérif audit trail.
