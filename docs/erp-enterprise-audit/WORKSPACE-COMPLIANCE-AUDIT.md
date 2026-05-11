# Workspace Compliance Audit — COYA (WORKSPACE-UX-CONTRACT)

Référence : `docs/enterprise-canon/WORKSPACE-UX-CONTRACT.md` + primitives `ui-runtime/*`.

## Checklist canon (5 zones)

- **Header / Hero**
- **KPI strip**
- **Pill tabs**
- **Focus area**
- **Inspector** (ou équivalent)

## Évaluation (indicative)

Score : **2** conforme · **1** partiel · **0** absent (page CRUD / formulaire)

| Zone | Score | Observations |
|------|-------|--------------|
| Workspace projet (`/projects/:id`) | 2 | Hero + KPI + pills + timeline `domain_events` |
| Workspace employé (`/hr/employees/:profileId`) | 2 | Shell RH-4 complet (hero/KPI/pills/inspector/timeline) |
| RH — Workforce Live | 1–2 | Floorplan analytique, grille live cartes, timeline live |
| RH — Temps & Présence | 1 | analytics + historique ; renvoi vers Live |
| Finance | 0–1 | volumineux, patterns workspace incomplets |
| CRM | 0–1 | workspace incomplet (à migrer) |

## Frictions UX identifiées

- Coexistence “pages legacy” vs “workspaces” : nécessite une doctrine par module (strangler).
- Mega-composants rendent la cohérence UI difficile à maintenir.

## Recommandations prioritaires

1. Prioriser migration **Finance** vers floorplan + inspector (au moins sur 1 sous-parcours).
2. Standardiser les “top bars” (workspace vs page header) sur modules P1.
3. Maintenir le **pointage global** comme runtime transversal (déjà en place).

