# Programme & Projets — Refonte UX (projection-first)

## Objectif
Basculer le module **Programme & Projets** vers une UX **cockpit-first**.

- **Pages = consumers de projections runtime** (read models)  
- **Aucune logique métier / KPI dans la UI** (au-delà d’un affichage/formatting)  
- **Quick actions** uniquement (ex: rebuild projection), jamais de recalculs en composant

## Nouvelle structure UX (cible)

### Programme — Executive Programme Cockpit
Une page “executive cockpit” pour un programme sélectionné.

- **Header sticky “runtime health”**
  - `projection_status`, `projection_run_id`
  - watermarks (`watermark_event_occurred_at`, `watermark_source_updated_at`)
  - actions rapides: **Rebuild cockpit**, navigation vers projets
- **Sections** (toutes alimentées par la projection):
  - **Budget**: planned/actual/variance/burn-rate + alert level
  - **Terrain / MEL**: couverture MEL, anomalies, progression activités
  - **Gouvernance**: validations en attente, échantillons
  - **Timeline**: période, % écoulé, repères
  - **Runtime**: santé sync (lag, lastProjectedAt, lastProcessedEventOccurredAt)

### Projets — Operational Project Grid
Une grille “opérations” orientée exécution.

- cartes cockpit par projet (health/progress/alerts)
- indicateurs de **sync** quand une projection cockpit projet existe (à venir)
- fallback minimal **sans KPI calculés dans le composant** si cockpit indisponible

### Détail projet — Workspace layout
Un workspace structuré:

- sidebar “health + sync + alerts”
- vues: cockpit / opérations / gouvernance / runtime / historique

## Wizards multi-étapes (création / édition)
Objectif: réduire les formulaires “one shot”, améliorer la qualité des données et éviter les abandons.

- **Projet**: 4 étapes (Informations → Planification → Équipe → Résumé)
  - validations progressives
  - draft auto-save (localStorage) pour les créations
- **Programme**: 5 étapes (Nom/code → Bailleur → Dates → Options → Résumé)
- **Bailleur**: 4 étapes (Identité → Contact → Notes → Résumé)

## Conventions d’implémentation

### Projection-first
- privilégier `services/programmeCockpitService.ts` (`getProgrammeCockpitRow`) pour récupérer:
  - `model` (read model)
  - métadonnées runtime (status/runId/watermarks)

### “Pas de KPI dans UI”
- si un calcul est encore nécessaire temporairement:
  - le sortir dans un **service** (ex: `services/projectCockpitService.ts`)
  - planifier la migration vers une projection DB dédiée (ex: `project_cockpit_read_models`)

### Nettoyage & legacy
- supprimer/masquer les anciens widgets décoratifs ou tableaux CRUD “infini” lorsque remplacés par cockpit
- éviter la duplication d’états (une seule source: projection read model + état de navigation)

## Fichiers clés (implémentation initiale)
- `components/ProgrammeModule.tsx`: cockpit programme + runtime header + wizards programme/bailleur
- `components/Projects.tsx`: grid projets orientée cockpit (progress/health via service)
- `components/ProjectDetailPage.tsx`: suppression de KPI redondants au profit du cockpit read model
- `components/ProjectCreatePage.tsx`: wizard multi-étapes + draft auto-save
- `services/programmeCockpitService.ts`: expose `ProgrammeCockpitRow`
- `services/projectCockpitService.ts`: encapsule la construction cockpit (transitoire)

