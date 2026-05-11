# Platform modules & scoped modules — Core

## Objectif

Formaliser une règle simple et **non négociable** de la plateforme COYA :

- certains modules sont **plateforme** (toujours accessibles) ;
- d’autres sont **scopés** (soumis au périmètre d’un département / policy) ;
- certains éléments sont du **runtime global** (ex. présence) et doivent rester visibles partout.

Cette distinction évite un ERP qui peut « s’auto-couper » (navigation morte / écran blanc) quand le scope département est vide ou mal configuré.

## Définitions

### 1) Platform modules (globaux)

Modules qui restent accessibles même si le scope métier est vide.

Exemples :

- `dashboard`
- `settings`
- `notifications_center` *(vue interne — à traiter comme plateforme même si non mappée module)*
- `activity_logs` *(idem)*

**Règle** : la sécurité (RLS) continue de s’appliquer ; ici on parle du **shell / UX** et de la non-coupure.

### 2) Scoped modules (par département / policy)

Modules dont l’accès est limité par le périmètre organisationnel (départements, policies, rôles).

Exemples :

- `finance`, `comptabilite`
- `crm_sales`
- `rh`, `planning`
- `projects`
- `documents`
- `analytics`

### 3) Runtime global

Runtime transversal nécessaire à l’ERP, hors « module écran ».

Exemples :

- **Identity runtime** (auth, user, profile)
- **Navigation runtime** (sidebar/header + guard)
- **Presence runtime** (pointage global / session / statut)
- **Realtime runtime** (subscriptions)

### 4) Runtime scoped

Runtimes qui doivent respecter le scope (département/policy), car ils matérialisent une gouvernance métier.

Exemples :

- department policies (scope modules, approvals)
- payroll approvals par département
- analytics scope (lecture inter-départements)

## Identités : règle de séparation

- `user.id` (auth) = **identité sécurité** (permissions, `user_departments`, `user_module_permissions`)
- `profileId` (`profiles.id`) = **identité métier** (workspaces RH, projections, corrélations runtime)

Ne pas mélanger ces identités dans la couche sécurité.

## Contrat d’implémentation (code)

### Où vit la règle ?

- Scope département : `utils/departmentPermissionPolicy.ts`
  - `GLOBAL_UNSCOPED_MODULES` : liste canon côté code (platform modules)
- Chargement permissions : `hooks/useModulePermissions.ts`
  - doit requêter les tables de sécurité avec **`auth user id`** (`user.id`)

### Invariants (tests à écrire)

1. Un utilisateur actif peut toujours ouvrir `dashboard` et `settings` (si non explicitement refusé).
2. Les modules hors scope département sont refusés (`NO_ACCESS`) si un scope existe.
3. Un refus explicite (`can_read = false`) sur une ligne existante l’emporte, y compris sur un module global.

## Évolutions prévues

- Passer de “scope modules par département” à un **Policy-driven Department Scope** (min/max, cross-dept read, approvals).
- Ajouter un package `services/security/` pour centraliser :
  - `identityRuntime`
  - `departmentScopeRuntime`
  - `modulePermissionRuntime`
  - `accessPolicyEngine`

