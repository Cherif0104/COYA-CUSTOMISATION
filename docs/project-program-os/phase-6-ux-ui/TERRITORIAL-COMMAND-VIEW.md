# Territorial Command View

## But
Piloter l’exécution et les risques **par territoire** (carte + couches), avec drill-down hiérarchique.

## Layout
- **Header**: territoire courant (niveau + breadcrumbs), période, état offline/sync
- **Map panel** (gauche): carte + couches
- **Control panel** (droite): filtres + KPIs + liste événements + actions

## Couches (layers)
- **Activities** (points / clusters)
- **Missions** (statuts + trajets si dispo)
- **Incidents** (sévérité)
- **Devices** (hubs/centres)
- **DQ flags** (zones “données manquantes”)

## Filtres (obligatoires)
- période
- programme/projet
- statut workflow (activité/mission)
- criticité incidents
- type activité / dispositif

## Offline-first
- carte en **mode dégradé**: tiles cache + “last known”
- interactions autorisées offline:
  - création incident
  - collecte preuve (photo/geo)
  - mise à jour mission (checklist)
- sync: banner “X actions en attente” (outbox)

## Read-model attendu
Projection `territorial_command_read_model`:
- `territory`: id, level, name, parent_chain
- `layers`: activities[], missions[], incidents[], devices[]
- `kpis`: activity_count, mission_completion_rate, incident_critical_open, dq_score

## Acceptance Criteria
- **AC-TERR-01**: drill-down territoire (country→region→department...) en 2 clics max.
- **AC-TERR-02**: couches togglables + légende claire + clustering performant.
- **AC-TERR-03**: offline: carte lisible + actions terrain possibles + outbox visible.

