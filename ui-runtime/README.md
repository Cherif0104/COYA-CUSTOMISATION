# COYA `ui-runtime` — runtime UI (cible)

**Objectif** : un point d’entrée **stable** pour l’UI COYA, **aligné sur MAKE FIGMA**, afin que l’application principale **compose** des floorplans au lieu d’inventer des layouts ad hoc.

## Relation avec `make figma/`

- **Aujourd’hui** : la vérité visuelle et structurelle vit dans `make figma/` (bundle Vite + pages de référence).
- **Demain** : les primitives réutilisables y sont **identifiées**, puis **copiées ou factorisées** ici (`ui-runtime/`) pour être consommées par `components/` sans dupliquer la logique métier.

Aucune obligation de dupliquer tout le bundle immédiatement : la migration est **incrémentale** (voir [FIGMA-UI-SOURCE-OF-TRUTH.md](../docs/enterprise-canon/FIGMA-UI-SOURCE-OF-TRUTH.md)).

## Arborescence (implémentée — UI-2 amorcée)

```txt
ui-runtime/
  README.md
  index.ts                 # barrel public
  workspace/WorkspaceShell.tsx
  workspace/WorkspaceHeader.tsx
  kpi/KPIStrip.tsx
  tabs/PillTabs.tsx
  inspector/InspectorPanel.tsx
  timeline/TimelineView.tsx
  activity/ActivityFeed.tsx
  tables/WorkspaceTable.tsx
  filters/WorkspaceFilters.tsx
  command/CommandBar.tsx   # + PrimaryWorkspaceButton
  layouts/
    ListWorkspaceFloorplan.tsx
    ObjectWorkspaceFloorplan.tsx
    AnalyticsWorkspaceFloorplan.tsx
    WorklistFloorplan.tsx
```

À venir : `forms/` (champs courts), variants drawer / responsive inspector, storybook ou doc visuelle.

## Règles d’import

- Les modules métier importent depuis `ui-runtime/...` dès qu’un composant existe ici.
- Tant qu’un composant n’existe pas encore ici : **copier le pattern** depuis la page MAKE FIGMA équivalente (voir [FIGMA-UI-MAPPING.md](../docs/FIGMA-UI-MAPPING.md)), puis extraire.

## Priorité produit (canon)

1. **Project workspace** (ex-`ProjectDetailPage`) — plus gros levier UX / dette.
2. Shell global (sidebar / header) déjà partiellement aligné — finaliser selon `make figma/src/app/components/Layout.tsx` (ou équivalent).
