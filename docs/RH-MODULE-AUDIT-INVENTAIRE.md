# Audit & inventaire — module Ressources humaines (COYA)

**Périmètre :** onglets et sous-vues du module RH dans l’app Vite/React, coquille workspace salarié, services associés, permissions, tables Supabase référencées.  
**Sources code principales :** `components/RhModule.tsx`, `components/hr/*`, `App.tsx`, `hooks/useModulePermissions.ts`, `services/dataAdapter.ts`, `services/dataService.ts`, `services/hrAnalyticsService.ts`, `services/departmentService.ts`, `services/payrollService.ts`, `services/workJournalService.ts`, `utils/viewModuleMap.ts`.

---

## Table des matières

1. [Vue d’ensemble navigation & routes](#1-vue-densemble-navigation--routes)
2. [Matrice synthétique (statut)](#2-matrice-synthétique-statut)
3. [Onglets RhModule (détail)](#3-onglets-rhmodule-détail)
4. [Workspace salarié `/hr/employees/:id`](#4-workspace-salarié-hremployeesid)
5. [Intégration Planning](#5-intégration-planning)
6. [Permissions modules](#6-permissions-modules)
7. [Tables & APIs Supabase (inventaire)](#7-tables--apis-supabase-inventaire)
8. [Lacunes & prochaines étapes](#8-lacunes--prochaines-étapes)
9. [Historique des correctifs liés à cet audit](#9-historique-des-correctifs-liés-à-cet-audit)

---

## 1. Vue d’ensemble navigation & routes

| Entrée UI | Mécanisme | Garde permission |
|-----------|-----------|------------------|
| Sidebar « Ressources humaines » | `view: 'rh'` | `viewModuleMap` → module `rh` (`canAccessModule('rh')`) |
| Vue `employee_workspace` | URL `/hr/employees/:profileId` (`utils/hrEmployeeWorkspaceUrl.ts`) | Même module que `rh` (`employee_workspace` → `rh` dans `viewModuleMap`) |
| Vues isolées congés | `leave_management`, `leave_management_admin` | Modules distincts |
| Offres emploi (liste globale) | `jobs` + onglet dans RH | `canAccessModule('jobs')` pour l’onglet RH ; navigation `App` case `jobs` |

**Fichiers clés**

- Routage par état : `App.tsx` (`currentView`), pas de React Router ; synchronisation URL manuelle pour projet et RH salarié.
- `case 'rh'` : rend `RhModule` avec état global `leaveRequests`, `users`, `jobs`, handlers congés, `onOpenEmployeeWorkspace` → `navigateToEmployeeWorkspace` / `handleOpenEmployeeWorkspace`.
- `case 'employee_workspace'` : `EmployeeWorkspaceShell` si `canAccessModule('rh')` et `selectedEmployeeWorkspaceProfileId` défini.

---

## 2. Matrice synthétique (statut)

Légende : **Actif** = données réelles branchées sur Supabase pour le flux principal ; **Partiel** = mix UI réelle / données partielles ou second fetch ; **Inactif** = coquille, mock ou non branché.

| Bloc | Statut | Dépendances majeures |
|------|--------|----------------------|
| Workforce Live | Actif | `employees`, `presence_sessions`, `presence_status_events`, `profiles` (mapping user_id), `hr_attendance_policies`, `departments`, `user_departments`, `leave_requests` (KPI pending) |
| Employés + fiche | Actif | `employees`, `profiles`, Storage RH (upload) |
| Temps & Présence | Actif | Idem présence + `hr_absence_events`, politique RH |
| Journal du jour | Partiel | `coya_work_day_summaries`, `coya_work_proofs` (migration ajoutée dans ce dépôt si absente en remote) |
| Congés (onglet RH) | Actif | `leave_requests` via props `App` / `DataAdapter` |
| Fiche poste (lecture) | Actif | `postes` + catalogue constant `constants/hrPosteCatalog` |
| Organigramme | Partiel | `employees` + `profiles` (noms), logique hiérarchique côté UI |
| Paie (onglet) | Partiel | `pay_slips` / `pay_slip_lines` (souvent via scripts SQL hors dossier `migrations` — vérifier env Supabase) |
| Offres d’emploi (RH) | Actif | Même flux que module `jobs` (état `jobs` dans `App`) |
| Employee workspace shell | Partiel | Navigation + onglets UX ; KPI / timeline mock ; journal désormais branché sur `WorkJournalTab` (voir correctifs) |

---

## 3. Onglets RhModule (détail)

### 3.1 `workforce_live`

| Aspect | Détail |
|--------|--------|
| **Description** | Cockpit temps réel : compteurs statut, alertes, heatmap par département, grille salariés, timeline des derniers événements. |
| **Entrée UI** | Premier onglet du `RhModule` (si permission `rh`). |
| **Backend** | `DataAdapter.getPresenceSessions`, `listPresenceStatusEvents`, `DataService.getProfiles`, `DepartmentService.getDepartmentsByOrganizationId`, `listUserDepartmentLinksForOrganization`, `hrAnalyticsService.listHrAbsenceEvents`, `DataAdapter.getHrAttendancePolicy`, `DataAdapter.listEmployees`. |
| **Permissions** | `canAccessModule('rh')`. |
| **Connexions** | **Départements** (cartes équipe), **Auth/Profils** (`user_id` ↔ `profile_id`), **Congés** (alertes pending), **Politique présence** (cibles, période paie). |
| **Écarts** | Sans affectations `user_departments`, fallback libellé « Organisation ». |
| **Étape suivante** | Alimenter affectations départementales depuis Administration. |

### 3.2 `employees`

| Aspect | Détail |
|--------|--------|
| **Description** | Liste salariés (`SalariésList`) + panneau `EmployeeProfile`. |
| **Entrée UI** | Onglet « Employés » ; action « workspace » → `/hr/employees/:profileId`. |
| **Backend** | `DataAdapter.listEmployees`, upsert via `DataAdapter.upsertEmployee` / `DataService`. |
| **Permissions** | `rh`. |
| **Connexions** | **User management** (utilisateurs à associer), **Profils**. |
| **Écarts** | — |
| **Étape suivante** | Renforcer RLS côté `employees` (déjà évolué dans migrations dédiées). |

### 3.3 `time_attendance`

| Aspect | Détail |
|--------|--------|
| **Description** | Politique présence, historique statuts, exports CSV, assiduité, contrôle paie analytique, saisie absences codifiées, panneau détail `PresenceEmployeeDetailPanel`. |
| **Entrée UI** | Onglet dédié ; lien depuis Workforce Live. |
| **Backend** | Même pile présence + `hr_absence_events` (`hrAnalyticsService`), `hr_attendance_policies`. |
| **Permissions** | `rh`. |
| **Connexions** | **Paie** (période comptable alignée politique), **Time tracking** (sessions), **Projets** (indirect via temps projet dans journal). |
| **Écarts** | Fenêtre « historique chargé » dépend du chargement serveur des `presence_status_events`. |
| **Étape suivante** | Pagination / plage explicite pour très gros historiques. |

### 3.4 `journal`

| Aspect | Détail |
|--------|--------|
| **Description** | `WorkJournalTab` : synthèses jour + preuves URL. |
| **Entrée UI** | Onglet « Journal du jour » ; filtre salarié = sélection onglet Employés **ou** filtre utilisateur onglet Temps & Présence (`historyUserProfileId`). |
| **Backend** | `coya_work_day_summaries`, `coya_work_proofs` via `workJournalService.ts`. |
| **Permissions** | `rh`. |
| **Connexions** | **Projets / Planning** (minutes agrégées si alimentées par pipeline métier — sinon 0). |
| **Écarts** | Avant migration `20260510120000_*`, tables pouvaient être absentes → erreur à l’exécution. Remplissage des summaries : politique RLS réservée aux rôles de gestion → prévoir job/service_role ou assouplir les politiques si besoin métier. |
| **Étape suivante** | Edge Function / cron de calcul des lignes `coya_work_day_summaries`. |

### 3.5 `leave`

| Aspect | Détail |
|--------|--------|
| **Description** | KPI + `LeaveManagement` / `LeaveManagementAdmin` selon droits. |
| **Entrée UI** | Onglet Congés. |
| **Backend** | `leave_requests` (chargement global dans `App` / `DataAdapter`). |
| **Permissions** | `leave_management` et/ou `leave_management_admin`. |
| **Connexions** | **Planning** (pilotage KPI congés pending — désormais synchronisé avec l’état `App` si `rh` passé, voir §5). |
| **Écarts** | SLA UI (2 j) sans persistance. |
| **Étape suivante** | Option : persistance SLA par org. |

### 3.6 `postes`

| Aspect | Détail |
|--------|--------|
| **Description** | Référentiel lecture seule + catalogue textuel. |
| **Entrée UI** | Onglet Fiche poste. |
| **Backend** | `postesService.listAllPostes` → table `postes`. |
| **Permissions** | `postes_management`. |
| **Connexions** | **Paramètres** (création postes). |
| **Écarts** | Pas d’édition inline dans RH. |
| **Étape suivante** | Lien direct vers vue paramètres postes. |

### 3.7 `organigramme`

| Aspect | Détail |
|--------|--------|
| **Description** | `OrganigrammeView` : arbre à partir des employés + enrichissement noms `profiles`. |
| **Entrée UI** | Onglet Organigramme. |
| **Backend** | `employees`, `profiles`. |
| **Permissions** | `organization_management`. |
| **Connexions** | **Organisation**, **Employés**. |
| **Écarts** | Hiérarchie réelle dépend des champs métier disponibles sur `employees` / relations manager. |
| **Étape suivante** | Modèle de lien manager explicite si absent. |

### 3.8 `payroll`

| Aspect | Détail |
|--------|--------|
| **Description** | `PayrollTab` : bulletins, matrice période, simulation `payrollService` + moteur `payrollEngine`. |
| **Entrée UI** | Onglet Paie ; nécessite `rh` **et** `hasPermission('rh','read')`. |
| **Backend** | `pay_slips`, `pay_slip_lines` (et calculs depuis présence via services). |
| **Permissions** | `rh` read ; write pour actions sensibles (`canWriteRh`). |
| **Connexions** | **Comptabilité** (suggestions OHADA sur lignes), **Temps & présence** (base analytique dans RH). |
| **Écarts** | Schéma bulletins peut être présent seulement via `scripts/create-pay-slips-table.sql` — aligner `supabase/migrations` sur l’environnement cible. |
| **Étape suivante** | Migration canonique `pay_slips` dans `supabase/migrations`. |

### 3.9 `jobs`

| Aspect | Détail |
|--------|--------|
| **Description** | Composant `Jobs` (offres). |
| **Entrée UI** | Onglet « Offres d’emploi ». |
| **Backend** | Flux jobs global (`App` state, Supabase selon `Jobs` / `DataAdapter`). |
| **Permissions** | `canAccessModule('jobs')`. |
| **Connexions** | **Talent**, **CRM** (selon parcours). |
| **Écarts** | — |
| **Étape suivante** | — |

---

## 4. Workspace salarié `/hr/employees/:id`

| Aspect | Détail |
|--------|--------|
| **Composant** | `components/hr/EmployeeWorkspaceShell.tsx` |
| **Tabs** | `overview`, `attendance`, `work_journal`, `payroll` (pipeline), `performance`, `leave`, `documents`, `career`, `training`, `access`, `timeline` |
| **Statut** | **Partiel** : la majorité des onglets sont des placeholders « RH-4 shell » ; KPI et timeline mock. |
| **Journal** | **Actif** (post-correctif) : onglet `work_journal` rend `WorkJournalTab` avec `profileId` route. |
| **Permissions** | Héritent de `rh` (garde dans `App`). |
| **Prérequis** | `VITE_*` / session Supabase comme reste de l’app ; tables journal si usage onglet. |

---

## 5. Intégration Planning

| Aspect | Détail |
|--------|--------|
| **Pont `rh` dans `App`** | `Planning` reçoit `rh={{ leaveRequests, users, jobs, … }}`. |
| **Comportement** | Le pilotage (`navTab === 'hub'`) charge les KPI dont **congés pending**. Désormais, si `rh.leaveRequests` est fourni, cette liste **remplace** un second appel `DataAdapter.getLeaveRequests()` — alignement avec l’état global `App` (moins de décal après validation ailleurs). |
| **Fichier** | `components/Planning.tsx` |

**Note :** `RhModule` n’est pas embarqué dans `Planning` ; l’intégration documentée au départ (`planningEmbedTab`, `embedded`) est prévue dans `RhModule` pour une réutilisation future depuis un parent qui passerait ces props (non utilisé dans `Planning.tsx` actuel).

---

## 6. Permissions modules

Définies dans `utils/modulePermissionDefaults.ts`, surcharge `user_module_permissions` (table via `DataService.getUserModulePermissions`), puis filtrage **périmètre département** (`DepartmentService.getAllowedModuleSlugsForUser` + `applyDepartmentScopeToPermissions`).

| Clé module | Usage RH |
|-------------|----------|
| `rh` | Module principal, workspace salarié, onglets workforce / employés / temps / journal / paie (lecture). |
| `leave_management` | Bloc « Mes demandes » dans onglet congés RH + vue dédiée `leave_management`. |
| `leave_management_admin` | Bloc validation dans RH + vue `leave_management_admin`. |
| `postes_management` | Onglet fiches poste. |
| `organization_management` | Onglet organigramme. |
| `jobs` | Onglet offres dans RH + navigation jobs globale. |

**Important :** `user_module_permissions.user_id` et `user_departments.user_id` référencent l’**auth user id** ; les écrans RH affichent souvent `profileId` (`profiles.id`) — le code de présence construit `userIdByProfile` via `DataService.getProfiles()`.

---

## 7. Tables & APIs Supabase (inventaire)

| Table / concept | Service / zone |
|-----------------|----------------|
| `employees` | `DataService.listEmployees`, fiche, organigramme |
| `profiles` | Lien user ↔ profil, noms, org |
| `presence_sessions`, `presence_status_events` | `DataService` / `DataAdapter`, analytics |
| `hr_attendance_policies` | Politique par org |
| `hr_absence_events` | `hrAnalyticsService` |
| `leave_requests` | `DataAdapter`, props Planning/RH |
| `departments`, `user_departments` | `DepartmentService` |
| `postes` | `postesService` |
| `pay_slips`, `pay_slip_lines` | `payrollService` |
| `coya_work_day_summaries`, `coya_work_proofs` | `workJournalService` |
| `planning_slots`, swaps, open shifts | Planning (hors onglets RH mais lié pilotage) |

**Variables d’environnement** : identiques au client Supabase global (`services/supabaseService.ts` — typiquement `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## 8. Lacunes & prochaines étapes

1. **Employee workspace** : brancher présence réelle, congés, paie pipeline sur mêmes services que `RhModule` / `PayrollTab` par étapes.
2. **Journal** : pipeline de calcul des `coya_work_day_summaries` (aujourd’hui insertion réservée managers en RLS — prévoir service_role ou politique dédiée pour job ETL).
3. **Paie** : migration Supabase canonique pour `pay_slips` si encore appliquée manuellement via `scripts/`.
4. **`planningEmbedTab` / `embedded` sur `RhModule`** : documenter ou brancher si produit veut RH inline dans Planning.
5. **Évaluation RH** : composant `HrEvaluation.tsx` (`moduleKey="rh_evaluation"`) hors `RhModule` — traiter dans extension périmètre « talent / perf ».

---

## 9. Historique des correctifs liés à cet audit

| Élément | Modification |
|---------|--------------|
| Planning × état congés `App` | `Planning` destructurise `rh` et utilise `rh.leaveRequests` pour le KPI hub quand disponible ; effet dépend de `rh?.leaveRequests`. |
| Workspace salarié — journal | Onglet `work_journal` affiche `WorkJournalTab` branché sur le `profileId` de la route. |
| Tables journal manquantes | Migration `supabase/migrations/20260510120000_coya_work_journal_summaries_proofs.sql` créant `coya_work_day_summaries` et `coya_work_proofs` + RLS. |

---

*Document généré dans le cadre de l’audit périmètre RH — à maintenir lors des évolutions de `RhModule` et des services associés.*
