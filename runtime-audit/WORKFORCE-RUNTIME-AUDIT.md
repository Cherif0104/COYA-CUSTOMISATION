# Workforce Runtime Audit — COYA (RH / présence / paie)

## 1. Positionnement

Le module RH est en transition vers un **Workforce Operating System** :

- Canon : `domains/hr/*` (dont `attendance-runtime.md`, `workspace-contract.md`)
- UI : `RhModule.tsx`, `components/hr/EmployeeWorkspaceShell.tsx`, `components/hr/workforce-live/*`
- Données : `PresenceSession`, `PresenceStatusEvent`, `DataAdapter`, `hrAnalyticsService`

## 2. Présence & pointage

| Sujet | État | Risque |
|-------|------|--------|
| Statuts utilisateur | **Réel** via `PresenceContext` + API / fallback local | Cohérence segment vs session (voir canon RH-5) |
| Docks globaux | **Header (lg+), tablette, mobile** | Bonne visibilité ; à monitorer perfs (intervalles 1s chrono) |
| Calculs temps | `hrAnalyticsService` — **riche** mais **impératif** | Duplication de règles avec futures **policies** |
| Overtime | Distinction **détecté / validé / payé** — **canon** prêt, **code paie** partiel | Risque audit paie |

## 3. Planning & charge

- Intégration **Planning ↔ RH** (congés, équipes) : **avancée** ; à documenter dans un **workflow cross-module** unique.

## 4. Paie

| Sujet | État |
|-------|------|
| Pipeline « projection d’événements » | **Canon** décrit ; **implémentation** encore orientée écrans / exports |
| PDF / bulletins | **Existant** ; à rattacher au futur **PayrollProjection** |

## 5. Performance / objectifs / journal

- **Work journal** : composant dédié ; lien **preuves ↔ projets** à renforcer.
- **Scores** : KPI mock dans workspace employé — **read models** à brancher.

## 6. Workforce cockpit

- **Workforce Live** : premier **cockpit opérationnel** temps réel côté RH — **aligné** avec la vision ERP.

## 7. Synthèse & priorités

1. **Implémenter** le journal `PresenceEvent` append-only (RH-5.1) sans casser `PresenceStatusEvent` existant (**strangler**).
2. **Brancher** read models cockpit sur **données** (pas seulement mock).
3. **Paie** : éviter tout « calculateur monolithique » ; suivre `domains/hr/overview.md`.
