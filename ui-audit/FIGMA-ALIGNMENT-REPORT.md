# Figma Alignment Report — COYA

## 1. Source de vérité visuelle

Dossier de référence : **`make figma/`** (Vite + React, `Layout.tsx`, pages `Dashboard`, `Projets`, `RessourcesHumaines`, etc.).

Application produit : **racine COYA** (`components/`, `Header.tsx`, `Sidebar.tsx`, `ui-runtime/`).

## 2. Score de conformité (indicatif global)

| Critère | Poids | Estimation |
|---------|-------|------------|
| Structure Layout (header / sidebar) | 25 % | **Élevée** — Sidebar `#0d1b2a`, header 64px documenté |
| Pages cœur (Dashboard, Projets) | 25 % | **Moyenne–élevée** — divergences fonctionnelles (données réelles) |
| RH | 20 % | **En mouvement** — Figma `RessourcesHumaines.tsx` vs `RhModule` + Workforce Live (plus riche que maquette) |
| Composants shadcn-like | 15 % | **Partielle** — `ui-runtime` + Tailwind vs `make figma` UI kit |
| KPI / tabs / workspace | 15 % | **Élevée** sur **projet** et **RH workspace** ; **faible** sur autres modules |

**Score global indicatif** : **~65–75 %** « alignement directionnel », avec **écarts assumés** là où le métier a dépassé la maquette.

## 3. Écarts typiques observés

| Sujet | Figma (`make figma`) | Produit |
|-------|----------------------|---------|
| Données | Maquettes statiques | Supabase, permissions, états vides |
| RH | Page RH monolithique | **Workforce Live** + onglets + workspace employé |
| Navigation | Routes démo | `currentView` + URLs partielles (`/projects/:id`, `/hr/employees/:id`) |

## 4. Composants / patterns à migrer ou factoriser

| Action | Cible |
|--------|--------|
| **Factoriser** | Extraire sous-vues de `Finance.tsx`, `ProgrammeModule.tsx`, `ProjectDetailPage.tsx` |
| **Migrer** vers `ui-runtime` | Pages encore « carte + tableau » sans KPI strip |
| **Conserver** | `ui-runtime` comme **seul** lieu des floorplans workspace |
| **Supprimer** (sur branche dédiée) | Marquer `ActivityHistory` legacy si plus référencé |

## 5. CTA / onglets / headers

- **CTA pointage** : harmonisés **globalement** (dock) — mieux aligné ERP que Figma initial.
- **Onglets RH** : réorganisés (Workforce Live en premier) — **écart positif** vs maquette figée.

## 6. Recommandations

1. **Geler** une **checklist** par nouvelle page : KPI strip ? Pills ? Inspector ?
2. **Comparer** périodiquement `make figma/src/app/pages/*` avec les **mêmes titres** de vue côté COYA.
3. **Captures** : ajouter sous `ui-audit/screenshots/` (hors git ou CI) lors des revues release.

## 7. Conformité WORKSPACE-UX-CONTRACT

Voir [WORKSPACE-COMPLIANCE-AUDIT](./WORKSPACE-COMPLIANCE-AUDIT.md) pour le détail par zone.
