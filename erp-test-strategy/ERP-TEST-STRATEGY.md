# ERP Test Strategy — COYA

## 1. Philosophie

Ne pas se limiter au **test UI** : valider des **chaînes métier** (given / when / then), des **rôles**, des **workflows cross-modules**, et le **runtime** (événements, règles).

## 2. Pyramide recommandée

```txt
         /\
        /  \  E2E métier (peu, critiques)
       /____\
      /      \  Intégration (services, bus, API)
     /________\
    /          \  Unitaires (policies, pure functions)
   /______________\
```

## 3. Tests métier (exemples cibles)

| Chaîne | Assertion |
|--------|-------------|
| `Task.StatusChanged` → `dispatchProjectDomainEvents` | Événement persisté ou ignoré selon config test |
| `Project.HealthRecalculated` (read model) | KPI cockpit mis à jour |
| `LeaveRequest.Submitted` → planning | Créneaux / conflits (quand moteur prêt) |
| **Pointage** | `setStatus` → session Supabase ou fallback local |

## 4. Tests workflows (cross-modules)

- **RH ↔ Projets** : congé approuvé ↔ charge planning.
- **Finance ↔ Projets** : budget / dépense liée projet.
- **CRM ↔ Finance** : opportunité → devis / facture (selon périmètre).

## 5. Tests permissions

- Matrice **rôle × module** (`canAccessModule`) alignée sur `viewModuleMap`.
- **RLS** : tests Supabase (SQL ou pgTAP) — **hors front**, obligatoires en prod.

## 6. Tests runtime

- **Bus domaine** : ordre handlers, pas de boucle infinie.
- **Idempotence** écriture `domain_events`.

## 7. Tests UX / accessibilité

- **Workspaces** : navigation clavier basique sur PillTabs.
- **Responsive** : docks pointage (mobile / tablette / desktop).

## 8. Outils

- **E2E** : Cypress déjà présent (`test:e2e`) — scénarios **métier** à ajouter.
- **Unit** : Vitest (à brancher si absent) pour `hrAnalyticsService`, `projectPolicies`, etc.

## 9. Definition of Done (ERP)

Une feature « terminée » si :

- [ ] Canon `domains/` mis à jour si impact métier  
- [ ] Au moins un **test** (unit ou e2e) sur le chemin critique  
- [ ] Pas de régression **permissions** sur les rôles cibles  
