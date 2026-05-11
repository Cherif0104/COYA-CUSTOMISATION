# Contrat UX — Workspace COYA (gel Phase 1)

**Statut : normatif.** Toute page métier doit respecter cette structure sauf dérogation enregistrée dans le canon du domaine concerné.

## Objectif

Éviter la dérive « admin panel / CRUD pages » au profit d’**espaces de travail orientés tâches** (logique proche des ERP workspace modernes : contextual workspace, progressive disclosure).

## Les 5 zones obligatoires

### 1. Workspace Header

- Titre de l’objet métier ou du contexte.
- Sous-titre ou fil d’Ariane métier (une ligne).
- **Un CTA principal** visible (actions secondaires regroupées ou menu « … »).

### 2. KPI Row

- **3 à 6 cartes maximum** par workspace.
- Chaque KPI doit référencer une définition dans `kpis.md` du domaine (ou domaine `analytics` si transverse).

### 3. Pill Tabs (navigation contextuelle)

- Onglets **dans le contexte** de l’agrégat ou du module (pas refaire la navigation app globale).
- Style aligné sur les tokens / maquette `make figma` (pills sur fond neutre).

### 4. Focus Area (zone de travail)

- **Une** zone principale : liste, kanban, timeline, tableau dense mais lisible, ou formulaire **court** et contextuel.
- Pas de formulaire long permanent : découper (inspecteur, étapes, modal ciblée).

### 5. Inspector Panel (optionnel mais recommandé)

- Détail, historique, pièces jointes, commentaires, métadonnées.
- Peut être repliable / slide-over sur petit écran.

## Interdictions (revue design + code)

- Gros formulaires permanents sur toute la largeur.
- Sidebar métier lourde **en plus** de la sidebar application (doublon navigation).
- Badges décoratifs sans sémantique métier.
- Tables sans hiérarchie visuelle (densité, colonnes prioritaires, états vides).
- Surcharge cognitive : plus d’une intention primaire par écran sans hiérarchie claire.
- Pages « liste + formulaire CRUD classique » sans intention workspace.

## Référence visuelle

- **MAKE FIGMA** est la **source UI unique** : implémentations de référence dans `make figma/src/app/pages/*.tsx` et composants associés (doctrine : [FIGMA-UI-SOURCE-OF-TRUTH.md](./FIGMA-UI-SOURCE-OF-TRUTH.md)).
- Tokens applicatifs alignés : `src/design-tokens.css`, `src/index.css`.

## Évolution

Toute modification de ce contrat : **incrément de version** en tête de ce fichier + mise à jour de `README.md` du canon.
