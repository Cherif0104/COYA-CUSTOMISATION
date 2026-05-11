# Figma Alignment Report — COYA vs `make figma/`

## Source de vérité visuelle

Le dossier **`make figma/`** est la référence visuelle (layout + UI kit + pages).

## Constats (haut niveau)

- **Layout (Sidebar/Header)** : alignement global bon, avec adaptations runtime (permissions, notifications, dock pointage).
- **Workspaces** : côté produit, certains workspaces (projet, employé) sont **plus avancés** que les pages figma initiales — écart “positif”.
- **Pages legacy volumineuses** : plusieurs modules restent éloignés des floorplans (Finance, CRM, etc.).

## Score indicatif

- Structure layout : **élevée**
- Projets (workspace) : **élevée**
- RH : **élevée directionnellement** (Workforce Live + workspace employé)
- Finance / CRM : **moyenne à faible**

## Pages à migrer en priorité (proposition)

1. Finance : introduire **WorklistFloorplan** + inspector + projections (sans réécrire tout).
2. CRM : cockpit + workspace opportunité/contact (si canon CRM le prévoit).
3. Analytics : standardiser floorplan analytique.

## Règle de gouvernance

Toute nouvelle page métier doit choisir explicitement :

- **Workspace** (Object / Analytics / Worklist floorplan)  
ou  
- **Page legacy** (avec dette déclarée + plan de migration).

