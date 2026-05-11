# Workspace Compliance Audit — COYA

Référence : `docs/enterprise-canon/WORKSPACE-UX-CONTRACT.md` + patterns `ui-runtime/` (WorkspaceRouteShell, ObjectWorkspaceFloorplan, KPIStrip, PillTabs, inspector).

## 1. Méthode d’évaluation

Pour chaque zone : **Workspace Header** · **KPI Row** · **Pill Tabs** · **Focus Area** · **Inspector** (ou équivalent latéral).

Score indicatif : **2** conforme · **1** partiel · **0** absent / CRUD classique

## 2. Pages / zones alignées workspace (bonnes pratiques)

| Zone | Score | Notes |
|------|-------|------|
| **Workspace projet** (`ProjectDetailPage` / `ProjectObjectWorkspace`) | 2 | Hero, KPI, pills, floorplan, historique domain_events |
| **Workspace employé** (`EmployeeWorkspaceShell`, `/hr/employees/:profileId`) | 2 | Shell RH-4 : hero, KPI, pills, timeline, inspector |
| **RH — Workforce Live** | 1–2 | Floorplan analytique ; grille live cartes (pas tableau CRUD) |

## 3. Zones mixtes (workspace + legacy)

| Zone | Score | Notes |
|------|-------|------|
| **RH — Temps & Présence** | 1 | Analytique + historique ; bandeau renvoi vers Live |
| **Planning** | 1 | Riche mais densité UI à surveiller |
| **Finance** | 0–1 | Très volumineux ; patterns workspace partiels |

## 4. Zones plutôt « application page » / CRUD

| Zone | Score | Risque UX |
|------|-------|------------|
| **Liste modules simples** (paramètres, partie admin) | 0–1 | Acceptable si hors cœur métier |
| **Certains modules long tail** (messagerie, tickets…) | 0–1 | Cohérence Figma / workspace à planifier |

## 5. Navigation & surcharge

- **App.tsx** : nombreuses vues ; risque de **découverte** des workspaces (mitigation : sidebar + URLs projet / RH employé).
- **Pointage** : désormais **global** (header `lg+`, tablette, mobile) — bon alignement « transversal ».

## 6. Synthèse « Workspace Compliance »

- **Conformité élevée** : **projets**, **employé workspace**, **Workforce Live** (directionnellement).
- **Priorité correction** : **Finance**, **CRM** (alléger CRUD, introduire floorplans), **Drive** si cockpit prévu.

## 7. Liste de suivi (backlog UX)

1. Cartographier chaque `case` dans `App.tsx` → tag **Workspace / CRUD**.
2. Prioriser migration **Finance** vers floorplan + inspector.
3. Unifier **headers** (titre page vs workspace top bar) sur les modules cibles.
