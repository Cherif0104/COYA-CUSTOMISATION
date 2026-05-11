# Mapping UI COYA Pro → MAKE FIGMA

**MAKE FIGMA est la source UI unique** (doctrine : [enterprise-canon/FIGMA-UI-SOURCE-OF-TRUTH.md](./enterprise-canon/FIGMA-UI-SOURCE-OF-TRUTH.md)). Ce document mappe chaque vue applicative vers la **page ou le pattern** à reproduire ou à migrer depuis `make figma/src/app/**`. Toute UI qui diverge est **legacy** jusqu’à alignement.

## Source de vérité visuelle

Racine : `make figma/src/app/**` (pages, layout, composants UI).

## Modules principaux

- `dashboard` -> `make figma/src/app/pages/Dashboard.tsx`
- `projects` / `programmes_projects` -> `make figma/src/app/pages/Projets.tsx` + `Programme.tsx`
- `planning` -> `make figma/src/app/pages/Planification.tsx`
- `rh` -> `make figma/src/app/pages/RessourcesHumaines.tsx`
- `comptabilite` / `finance` -> `make figma/src/app/pages/Comptabilite.tsx`
- `programme` -> `make figma/src/app/pages/Programme.tsx`
- `courses` -> `make figma/src/app/pages/Formations.tsx`
- `crm_sales` -> `make figma/src/app/pages/CRMVentes.tsx`
- `trinite` -> `make figma/src/app/pages/Trinite.tsx`
- `logistique` -> `make figma/src/app/pages/Logistique.tsx`
- `parc_auto` -> `make figma/src/app/pages/ParcAuto.tsx`
- `messagerie` -> `make figma/src/app/pages/Messagerie.tsx`
- `ticket_it` -> `make figma/src/app/pages/TicketIT.tsx`
- `knowledge_base` -> `make figma/src/app/pages/DocsSenegel.tsx`
- `daf_services` -> `make figma/src/app/pages/MoyensGeneraux.tsx`

## Vues transversales

- `settings` -> style global aligné sur shell Figma (pas de page dédiée Figma).
- `notifications_center` -> style global aligné sur shell Figma.
- `activity_logs` -> style global aligné sur shell Figma.
- `course_detail`, `course_management`, `job_management`, `leave_management*`, `organization_management`, `department_management`, `user_management` -> alignement via shell + tokens visuels partagés.

## Décision d’implémentation (mise à jour)

1. **Conformité MAKE FIGMA** pour toute nouvelle UI ou refonte majeure — voir [FIGMA-UI-SOURCE-OF-TRUTH.md](./enterprise-canon/FIGMA-UI-SOURCE-OF-TRUTH.md) et phases **UI-1 → UI-3**.
2. Coquille / tokens : `FigmaModuleShell` (ou équivalent), `src/design-tokens.css`, patterns issus de `make figma`.
3. Navigation shell (`Sidebar`, `Header`, `ProgrammesProjectsShell`) : alignement progressif sur le design language **MAKE FIGMA** (`make figma` layout).
