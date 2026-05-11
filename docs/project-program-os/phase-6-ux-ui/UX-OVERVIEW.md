# PHASE 6 — UX/UI System (Command Center) — Overview

## Objectif
Concevoir une UX **centre de commandement institutionnel** pour piloter:
- gouvernance (validations, délégation, quorum),
- opérations terrain (activités/missions, offline-first),
- conformité (documents, justificatifs, audit),
- impact (M&E natif, qualité données),
- intelligence (IA assistée, recommandations).

## Interdits (non-négociable)
- **Pas** de “todo list app” (Trello/Monday/Asana/ClickUp-like).
- **Pas** de structure plate (liste unique de tâches).
- **Pas** de reporting manuel hors système.

## Principes UX structurants
- **Hiérarchique**: Programme → Projet → Activité → Mission (drill-down explicite).
- **Territorial**: filtre et navigation d’abord par territoire (pays→région→département→…).
- **Analytique**: métriques “Power BI-like” en première classe (cartes, heatmaps, tendances).
- **Événementiel**: timeline + journal d’événements (workflow + audit).
- **Observabilité fonctionnelle**: l’état de validation/sync/risque est visible en permanence.

## Patterns UI (alignés `docs/GUIDE-STYLE-MODULES.md`)
- **Header gradient obligatoire** (from-emerald-600 to-blue-600) avec actions principales.
- **Cartes métriques** (4 minimum) : budget, progression, risques, impact / qualité.
- **Grilles** et **cartes** (rounded-xl, shadow-lg, hover:shadow-xl).
- **Empty states** obligatoires + CTA contextuel.
- **États loading/erreur** uniformes (spinner + banner).

## Navigation (OS)
- **Program First**: la navigation “commence” par le programme (pas par une tâche).
- **Contextual Navigation**: chaque page expose un “contexte” (programme/projet/territoire).
- **Operational Dashboard**: un cockpit (synthèse + alertes) au-dessus des listes.

## Contrat “Pages = projections”
- Une page React affiche une **projection** (read-model).
- Les règles métier critiques (validations, seuils, politiques) résident dans:
  - le Domain/Workflow layer (PHASE 2/3/4/5),
  - et sont **observables** via timeline/audit.

## Accessibilité & performance perçue
- Contraste AA, navigation clavier sur filtres/actions.
- Pagination + skeletons sur listes.
- Charts: éviter rendu “bloquant”, préférer progressive rendering.

## Acceptance Criteria (global)
- **AC-UX-01**: chaque écran majeur affiche contexte (programme/projet/territoire) + statut workflow.
- **AC-UX-02**: chaque action sensible (valider, override, publier) exige confirmation + trace audit.
- **AC-UX-03**: offline: état de sync (badge) + outbox visible + mode dégradé explicite.
- **AC-UX-04**: aucune vue “Kanban-only” sans cockpit analytique et timeline.

