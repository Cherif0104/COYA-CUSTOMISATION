# MAKE FIGMA — source UI unique (doctrine COYA)

**Statut : normatif.** À partir de la **canonicalisation UI** (phase UI-1), tout écran métier doit **composer** les patterns du bundle **MAKE FIGMA** ; toute autre UI est **legacy** et doit être **migrée ou encapsulée** jusqu’à disparition.

## Déclaration

- **MAKE FIGMA** (`make figma/`) = **runtime UI officiel** du produit : layouts, composants shadcn du bundle, espacements, typographie, tables, onglets, cartes KPI, CTA, inspecteurs, timelines **telles que dans les pages de référence**.
- Ce n’est plus une « inspiration » parallèle : c’est le **design system exécutable** à respecter ou à **porter** dans l’app principale.

Référence d’implémentation : `make figma/src/app/pages/*.tsx`, `make figma/src/app/components/**`.

## Règle d’or

**No UI outside Make Figma patterns** — sauf dérogation **écrite** (date, motif, échéance de migration) dans ce fichier ou dans une issue référencée ici.

### Interdictions (nouveau code)

- Nouveau composant métier « one-off » (layout maison, table custom, modal pattern divergent) sans passer par l’équivalent MAKE FIGMA.
- Nouveaux « admin panel patterns » (formulaire plein écran permanent, sidebar métier lourde en doublon, badges décoratifs sans sémantique).

### Obligations

- Réutiliser les **floorplans** décrits ci-dessous et le [WORKSPACE-UX-CONTRACT.md](./WORKSPACE-UX-CONTRACT.md) (5 zones).
- S’appuyer sur les **tokens** déjà alignés (`src/design-tokens.css`, `src/index.css`) en cohérence avec MAKE FIGMA.

## Legacy

- Tout composant sous `components/` qui **ne** reproduit **pas** les patterns MAKE FIGMA pour une vue donnée est **legacy UI**.
- La dette UX se traite **module par module** ; la logique métier (`services/domain`, commandes, événements) **ne dépend pas** du legacy visuel.

## Floorplans cibles (SAP Fiori-like)

| Floorplan | Usage | Structure minimale |
|-----------|--------|---------------------|
| **List workspace** | Listes programmes, CRM, etc. | Header + filtres + KPI row + table + inspector |
| **Object workspace** | Détail projet, fiche contact, écriture | Header + KPI row + pill tabs + focus + inspector |
| **Analytics workspace** | Dashboards, cockpit | Filtres + KPI + graphiques + drill-down |
| **Timeline / historique** | Chaîne métier | Groupement corrélation, hiérarchie causalité — **composant type MAKE FIGMA** une fois extrait dans `ui-runtime` |

## Phases (roadmap)

### UI-1 — Canonicalisation (immédiat)

- Documenter et **communiquer** cette doctrine ; mettre à jour [FIGMA-UI-MAPPING.md](../FIGMA-UI-MAPPING.md).
- Toute **nouvelle** vue ou refonte : conformité stricte MAKE FIGMA + contrat workspace.

### UI-2 — Runtime UI (`ui-runtime/`) — **amorcé dans le code**

Primitives et floorplans disponibles via `ui-runtime/index.ts` (alignement classes MAKE FIGMA, **sans** dupliquer le bundle Vite `make figma/`) :

- **Workspace** : `WorkspaceShell`, `WorkspaceHeader`
- **KPI** : `KPIStrip` (max 5–6 cartes)
- **Tabs** : `PillTabs`
- **Inspector** : `InspectorPanel`
- **Timeline** : `TimelineView`, `TimelineViewItem`
- **Activity** : `ActivityFeed`
- **Table** : `WorkspaceTable`
- **Filtres** : `WorkspaceFilters`
- **Commandes** : `CommandBar`, `PrimaryWorkspaceButton`
- **Floorplans** : `ListWorkspaceFloorplan`, `ObjectWorkspaceFloorplan`, `AnalyticsWorkspaceFloorplan`, `WorklistFloorplan`

L’app COYA importe depuis `ui-runtime` (alias `@/ui-runtime/...` possible). Les pages MAKE FIGMA restent la **référence pixel/pattern** jusqu’à couverture complète.

### UI-3 — Migration prioritaire

- **`ProjectDetailPage`** → **Project workspace** (object floorplan) : onglets Cockpit / Tâches / Planning / Budget / Équipe / Historique selon canon `domains/projects/workspace-contract.md`.
- Supprimer progressivement layouts divergents (sidebars métier redondantes, tables denses sans hiérarchie).

## Liens

- Mapping module → page Figma : [FIGMA-UI-MAPPING.md](../FIGMA-UI-MAPPING.md)
- Contrat UX 5 zones : [WORKSPACE-UX-CONTRACT.md](./WORKSPACE-UX-CONTRACT.md)
- Feuille de route technique dossier : [ui-runtime/README.md](../../ui-runtime/README.md)

## Version doctrine

| Version | Date | Notes |
|---------|------|--------|
| 1.0.0 | 2026-05-06 | MAKE FIGMA déclarée source UI unique ; phases UI-1 à UI-3 |
