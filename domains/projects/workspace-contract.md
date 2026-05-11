# Contrat workspace — Programmes & Projets

Hérite du [contrat global](../../docs/enterprise-canon/WORKSPACE-UX-CONTRACT.md). Spécificités métier ci-dessous.

## Liste — Programmes & Projets

| Zone | Contenu |
|------|---------|
| Header | Titre module, contexte org, CTA « Nouveau programme » / « Nouveau projet » selon navigation |
| KPI Row | Projets actifs, en retard, budget engagé (agrégats), tâches critiques ouvertes |
| Pill Tabs | Vue liste / cartes / cartographie (si applicable) — **contexte liste** |
| Focus | Table ou cartes avec filtres (statut, programme, CP) |
| Inspector | Aperçu projet sélectionné + actions rapides sans quitter la liste |

## Workspace — Détail projet

| Zone | Contenu |
|------|---------|
| Header | Nom projet, statut, santé, échéance, progression %, budget synthèse, actions rapides (document, membre, tâche) |
| KPI Row | Santé, retard jalons, variance budget, tâches bloquées, charge équipe (read models) |
| Pill Tabs | Cockpit · Activités · Tâches · Planning · Équipe · Budget · Documents · Historique · Performance |
| Focus | Contenu de l’onglet actif (une intention dominante) |
| Inspector | Détail entité secondaire (ex. tâche, risque) sans saturer l’onglet |

## Page détail tâche

| Zone | Contenu |
|------|---------|
| Header | Titre, statut, priorité, assigné, échéance, CTA (valider / rouvrir / bloquer) |
| KPI Row | *(optionnel — 0–3 mini indicateurs : temps passé, sous-tâches restantes)* |
| Pill Tabs | Description · Sous-tâches · Dépendances · Temps · Documents · Commentaires · Historique |
| Focus | Zone principale de l’onglet |
| Inspector | Métadonnées, liens projet, participants |

## Inspectors transverses

- Historique = **timeline d’événements** (`events.md`) + entrées audit `core`.
