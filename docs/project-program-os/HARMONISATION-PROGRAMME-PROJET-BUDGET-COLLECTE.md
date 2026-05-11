# Harmonisation Programme / Projet / Budget / Collecte

Ce document aligne le **Project & Program OS** (PHASE 1–7) avec l’implémentation COYA existante (React + Supabase) pour la chaîne :

- Programme (1+ bailleurs) → Projets → Activités terrain → Tâches
- Budget cascade (programme → projet → activité → tâche)
- Collecte de données (programme / projet / formation) synchronisée au CRM

Il sert de référence unique pour la roadmap P0/P1/P2, les deltas de modèle de données, la navigation UX et la stratégie d’audit / événements.

---

## 1. Hiérarchie & méthodologie (Programme → Projet → Activité → Tâche)

### 1.1. Ce qui existe déjà

- **Programme**
  - Table métier : `public.programmes` (multi-org via `organization_id`, cf. autres migrations programmes).
  - Gouvernance & actions : `public.programme_actions`, `public.programme_action_assignees`  
    - Migrations : `20260408120000_programme_actions_assignees_proof.sql`
    - Champs clés : `status`, `period_start/period_end`, `completed_at`, `completed_by_profile_id`, `proof_*`.
  - Cockpit CQRS : `public.programme_cockpit_read_models`, `public.projection_checkpoints`  
    - Migrations : `20260508140000_programme_cockpit_read_model.sql`, `20260508143000_programme_cockpit_projection_run.sql`
    - Service UI : `services/programmeCockpitService.ts`
    - Projector : `supabase/functions/programme-cockpit-rebuild/index.ts`

- **Projet**
  - Table métier : `public.projects` (multi-org, RLS durci).
  - Tâches JSON intégrées + garde-fou gouvernance :  
    - Migration : `20260330132000_harden_projects_rls_task_governance.sql`
    - Fonction `public.enforce_project_task_update_guard()` + RLS par rôle (`is_project_management_role`).
  - Tâches relationnelles :
    - Table : `public.tasks` (créée par `20250220150000_phase2_projects_tasks_meetings.sql`)
    - Colonnes : `status`, `priority`, `due_date`, `start_date`, `objective_id`, `estimated_hours`, `logged_hours`, `created_by_id`, `activity_id`, `client_task_key`.
    - RLS : `tasks_select/insert/update/delete` basées sur `profiles.organization_id`.

- **Activité terrain**
  - Table : `public.project_activities`  
    - Migration : `20260403120000_programme_terrain_hierarchy_budget_crm.sql`
    - Clés : `programme_id`, `project_id`, `status`, `start_date`, `end_date`, `sequence`.
    - Enrichissement MEL : `20260403140000_budget_rollup_mel_tasks_crm_rights.sql` (`mel_target_*`, `mel_result_value`, `mel_unit`).

- **Budget cascade**
  - Table : `public.budget_cascade_lines` (cascade Programme → Projet → Activité → Tâche)
    - Migration : `20260403120000_programme_terrain_hierarchy_budget_crm.sql` (+ compléments `20260403140000_budget_rollup_mel_tasks_crm_rights.sql`)
    - Clés : `scope_level (programme|project|activity|task)`, `programme_id`, `project_id`, `activity_id`, `project_task_id` (legacy JSON), `task_id` (FK forte).
    - Vues agrégées :
      - `public.v_budget_cascade_rollup_by_post`
      - `public.v_budget_cascade_rollup_by_scope`
    - Garde-fous rôle & workflow : `budget_cascade_lines_update_guard()` (terrain vs finance).

- **Traçabilité & audit**
  - Event store générique : `public.domain_events`  
    - Migration : `20260506140000_domain_events_event_store.sql`
    - Champs clés : `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `occurred_at`, `actor_id`, `correlation_id`.
  - Cockpit programme : `projection_checkpoints` + colonnes `projection_run_id`, `projection_status`, `projection_error` sur `programme_cockpit_read_models`.

### 1.2. Méthodologie cible (OS) sur cette hiérarchie

- **Hiérarchie fonctionnelle unique** :
  - Programme ←→ Bailleurs (1..N)
  - Programme → Projets (`projects.programme_id`)
  - Projet → Activités (`project_activities.project_id`)
  - Activité → Tâches (`tasks.activity_id` + `budget_cascade_lines.task_id`)
- **Objectifs & échéances** :
  - Programme : objectifs & actions (`programme_actions` avec `period_start/period_end`).
  - Projet : objectifs / livrables (cf. `ProjectDetailPage.tsx`, `ObjectivesBlock`, champs `dueDate` projet).
  - Activité : indicateurs MEL (`mel_target_*`, `mel_result_value`).
  - Tâche : `due_date`, période, gouvernance de statut (migrations `phase2_projects_tasks_meetings.sql` + services `applyTaskStatusChange`).
- **Cohérence temporelle (timeline)** :
  - Contraintes cohérentes (à implémenter côté service/domain) :
    - `project_activities.start_date >= programme.start_date`
    - `tasks.due_date` dans `[activity.start_date, activity.end_date]` si `activity_id` défini.
  - Tous les changements critiques (statut tâche, budget, action programme, collecte liée) produisent un **événement `domain_events`** avec :
    - `aggregate_type` = `programme`, `project`, `activity`, `task`, `budget_cascade_line`, `collecte_assignment`, …
    - `aggregate_id` = ID logique (UUID ou clé métier stable).
    - `actor_id` = profil / user à l’origine.
    - `occurred_at` = horodatage canonical pour timelines/programme cockpit.

---

## 2. Vues budget crescendo (micro tâche → macro programme)

### 2.1. Socle technique budget existant

- **Tables & vues**
  - `public.budget_cascade_lines` : lignes budgétaires chaînées avec `scope_level`.
  - `public.v_budget_cascade_rollup_by_post` : agrégation par `programme_id` + `expense_post_code` + `currency`.
  - `public.v_budget_cascade_rollup_by_scope` : agrégation par `programme_id` + `scope_level` + `currency`.
  - Gouvernance budgétaire : fonction `profile_budget_validator()` + trigger `budget_cascade_lines_role_guard`.

- **Surfaces UI**
  - **Programme** : `components/ProgrammeModule.tsx`
    - Onglets `ProgrammeDetailTab` : `'resume' | 'budget' | 'projets_terrain' | 'acteurs_collecte'`.
    - Intègre la cascade budget + `ProgrammeEnterpriseTable` / `EnterpriseFinanceKpiStrip`.
    - Onglet **Résumé** consomme `programme_cockpit_read_models` via `programmeCockpitService`.
  - **Projet** :
    - Liste : `components/Projects.tsx` (grille enterprise + budget prévisionnel projet).
    - Workspace : `components/ProjectDetailPage.tsx` / `ProjectObjectWorkspace` (cockpit projet, tâches, planning, documents, historique).
  - **Tâches & temps** :
    - Tâches projet : `TasksWorkspaceTab`, `applyProjectTasksAutoClose`, `syncProjectTasksToPlanningSlots`.
    - Temps passés : `TimeLog`, `LogTimeModal`, `workforce_activity_events` (migrations dédiées).

### 2.2. UX cible “micro → macro”

**Principe OS** : *les pages consomment des projections stables*, pas des requêtes ad hoc. Le budget doit être lisible :

- **Au niveau tâche**
  - Détail tâche dans `ProjectObjectWorkspace` :
    - Montant réel imputé via `budget_cascade_lines` (`scope_level='task'`, `task_id`).
    - Lien vers justificatifs / pièces (via module documents existant).
  - Événements :
    - `Task.StatusChanged`, `Task.BudgetActualUpdated` poussés dans `domain_events`.

- **Au niveau activité**
  - Vue activité (dans `ProgrammeModule` ou tab projet terrain) :
    - Progression MEL (`mel_target_*` vs `mel_result_value`).
    - Rollup budget par activité (somme des lignes `scope_level in ('activity','task')`).
  - Drill-down :
    - Depuis une carte activité → liste des tâches rattachées + justificatifs.

- **Au niveau projet**
  - Cockpit projet (`buildProjectCockpitReadModel`, `ProjectObjectWorkspaceHero`) :
    - KPIs : budget prévu vs réel, burn-rate, risques, délai, charge de travail (via `TimeLog`).
    - Sources : `v_budget_cascade_rollup_by_scope` filtrée `scope_level in ('project','activity','task')`.

- **Au niveau programme**
  - Cockpit programme (`programme_cockpit_read_models`, onglet Résumé) :
    - Vue **Budget** : exploitation directe de `v_budget_cascade_rollup_by_post` + `v_budget_cascade_rollup_by_scope`.
    - Cartes : budget total, variance, % engagé, % réalisé, répartition par postes.
    - Drill-down : clic sur un poste de dépense → liste projets/activités/tâches contributrices.

### 2.3. Règles UX clés (alignées PHASE 6)

- Chaque niveau dispose d’une **vue dédiée** :
  - **Programme** : cockpit + onglet Budget.
  - **Projet** : workspace tab Budget (cockpit) + détail tâches / risques.
  - **Activité** : vue terrain (MEL + budget + collecte).
  - **Tâche** : panneau détail incluant coût réel, heures, preuves.
- Navigation **micro → macro** :
  - Depuis une tâche, on remonte vers activité → projet → programme via breadcrumbs `WorkspaceBreadcrumbs`.
  - Depuis le cockpit programme, on descend vers projets/activités/tâches via liens contextuels (IDs dans le read-model).

---

## 3. Synergie avec les modules existants

### 3.1. ProgrammeModule

- Fichier : `components/ProgrammeModule.tsx`
- Rôle :
  - Shell **Programme & Bailleurs** (liste programmes, bailleurs, budget, bénéficiaires).
  - Détail programme avec 4 sous-onglets :
    - `resume` : cockpit programme (CQRS) + résumé budget/terrain/gouvernance.
    - `budget` : grille budget cascade & agrégations (doit consommer les vues `v_budget_cascade_*`).
    - `projets_terrain` : projets reliés, activités terrain, MEL.
    - `acteurs_collecte` : bénéficiaires, stakeholders, collecte programme.
- Intégration cockpit :
  - Utilise `programmeCockpitService.getProgrammeCockpitRow()` pour afficher `projection_status`, `projection_run_id`, `generated_at`, watermarks.
  - Bouton **Rebuild cockpit** appelle `programmeCockpitService.rebuildProgrammeCockpit()` → Edge Function.

### 3.2. Projects & ProjectObjectWorkspace

- Fichiers : `components/Projects.tsx`, `components/ProjectDetailPage.tsx`
- Rôle :
  - **Projects** :
    - Grille projets (status, dates, budget prévisionnel).
    - Formulaire projet (`ProjectFormModal`) permettant le rattachement à un `programmeId` + budget prévu.
  - **ProjectObjectWorkspace** :
    - Tabs : cockpit, tâches, équipe, documents, historique (`HistoryWorkspaceTab`), etc.
    - Gouvernance des tâches :
      - Permissions basées sur `RESOURCE_MANAGEMENT_ROLES` + RLS backend.
      - Commande `applyTaskStatusChange` + orchestration `dispatchProjectDomainEvents`.
    - Alignement hiérarchie :
      - `tasks.activity_id` + `project_activities` pour recoller tâches ←→ activités ←→ budget.

### 3.3. Programme cockpit service

- Fichier : `services/programmeCockpitService.ts`
- Pattern :
  - Lecture :
    - `getProgrammeCockpitReadModel(programmeId)` lit `programme_cockpit_read_models.model`.
    - `getProgrammeCockpitRow(programmeId)` lit métadonnées + modèle.
  - Rebuild :
    - `rebuildProgrammeCockpit(programmeId)` invoque `supabase.functions.invoke('programme-cockpit-rebuild')`.
  - Utilisé par `ProgrammeModule` (onglet Résumé) comme **référence P0** du pattern “Pages = projections”.

### 3.4. Collecte & CRM (état actuel)

- **CollecteModule**
  - Fichier : `components/CollecteModule.tsx`
  - Stockage local via `dataCollectionService` (off-line friendly) + assignation :
    - `categoryKey` ∈ {`programme`, `project`, `formation`, …}
    - Champs d’assignation : `programmeId`, `projectId`, `formationId`, `assignment.categoryKey`.
  - Navigation entrante :
    - Depuis **ProgrammeModule** :
      - `NAV_SESSION_COLLECTE_PRESET_PROGRAMME_ID` → preset `categoryKey='programme'`, `assignTargetId = programmeId`.
    - Depuis **CRM** :
      - `NAV_SESSION_COLLECTE_PRESET_COLLECTION_ID` → preset campagne dans l’onglet soumissions → CRM.
  - Extension projet déjà prévue :
    - Chargement `projects` + `programmeService.listProjectActivities()` pour alimenter les assignations projet / activité.

- **CRM**
  - Fichier : `components/CRM.tsx`
  - Intégration Collecte :
    - Tab Collecte : `CollecteModule embeddedInCrm`.
    - Liaison Collecte ↔ CRM via `supabase/functions/crm-webhook-dispatch/index.ts` + migration `20260422180000_contacts_collecte_source.sql` (`contacts.source_*`).
    - Modale d’enrichissement (`crm_collecte_enrich_modal_*`), boutons pour :
      - Importer les soumissions d’une campagne dans CRM.
      - Marquer des contacts placeholder issus de Collecte.

### 3.5. Synthèse gaps vs OS

- **Forces**
  - Hiérarchie programme → projet → tâches déjà en place (FK + RLS).
  - Budget cascade structuré et agrégé par programme/poste/niveau.
  - Cockpit programme CQRS opérationnel (read-model + Edge Function).
  - Collecte déjà multi-contexte (programme/projet/formation) et connectée au CRM.
- **Gaps principaux**
  - Raccord explicite **activité** dans tous les écrans (timeline & budget) encore partiel.
  - Peu de réutilisation explicite des vues `v_budget_cascade_*` côté UI (risque de recalculs ad hoc).
  - Pas de journalisation systématique dans `domain_events` pour :
    - modifications budget cascade,
    - actions programme,
    - liaisons Collecte ↔ programme/projet.

---

## 4. Extension Collecte & formations (sans casser les flux actuels)

### 4.1. Navigation & UX recommandées

- **Depuis un programme**
  - Déjà implémenté :
    - Onglet `acteurs_collecte` dans `ProgrammeModule` :
      - Grille participants (`ProgrammeCollecteBlock`) + raccourci “Ouvrir le module Collecte”.
      - Session : `NAV_SESSION_COLLECTE_PRESET_PROGRAMME_ID`.
  - P0 — Harmonisation :
    - S’assurer que tous les raccourcis Collecte depuis le cockpit programme utilisent **le même chemin** :
      - `ProgrammeCollecteBlock` → `CollecteModule` avec `categoryKey='programme'` + `assignTargetId = programmeId`.

- **Depuis un projet**
  - P0 — AJOUT (UI uniquement) :
    - Ajouter dans `ProjectObjectWorkspace` un bouton “Collecte terrain” (tab cockpit ou tâches) qui :
      - Enregistre dans `sessionStorage` une nouvelle clé `NAV_SESSION_COLLECTE_PRESET_PROJECT_ID`.
      - Bascule la vue globale sur `CollecteModule`.
    - Dans `CollecteModule`, ajouter un `useEffect` parallèle à celui du programme :
      - Si `NAV_SESSION_COLLECTE_PRESET_PROJECT_ID` présent :
        - supprimer la clé,
        - `setCategoryKey('project')`,
        - `setAssignTargetId(projectId)`,
        - initialiser `filterKind='project'`.

- **Depuis une formation**
  - P1 — AJOUT :
    - Reprendre le même pattern que ci-dessus :
      - clé de session `NAV_SESSION_COLLECTE_PRESET_FORMATION_ID`.
      - depuis l’écran formation (cours) → nav vers Collecte avec preset.
    - `CollecteModule` :
      - si la clé est présente, `setCategoryKey('formation')`, `assignTargetId = formationId`, `filterKind='formation'`.

- **Depuis le CRM**
  - Conserver l’existant :
    - `CRMContactDetailPage` → callback `onGoToCollecteCampaign(collectionId)` passe par :
      - `NAV_SESSION_COLLECTE_PRESET_COLLECTION_ID` + `openCollecteWorkspaceInCrm()`.
    - `CollecteModule` reste la source de vérité pour la configuration des campagnes.

### 4.2. Modèle de données Collecte (delta recommandé)

Aujourd’hui, la plupart des métadonnées Collecte sont **locales** (service JS) avec un pont vers le CRM (table `contacts`). Pour harmoniser avec l’OS sans casser l’existant :

- **P0 — Stabiliser les assignations côté client (inchangé)**
  - Continuer à utiliser `dataCollectionService` comme seul writer pour :
    - `programmeId`, `projectId`, `formationId` dans les collections locales.
  - Garantir des clés stables (`client_task_key`, `collectionId`) pour les synchronisations ultérieures.

- **P1 — Introduire un pont Supabase optionnel (add-only)**
  - Nouvelle table (SQL en brouillon, voir section 7) :
    - `public.collecte_assignments` :
      - `organization_id`, `collection_id` (clé Collecte locale), `category_key` (`programme|project|formation`), `programme_id`, `project_id`, `activity_id`, `formation_id`.
    - RLS alignée sur `budget_cascade_lines` / `project_activities` :
      - `organization_id` dérivé du programme/projet cible.
  - Utilisation :
    - Edge functions ou batch jobs pour *répliquer* les assignations client → table DB (optionnel, non bloquant).
    - Lecture par l’OS (M&E, reporting, IA) sans toucher aux flux Collecte existants.

### 4.3. Considérations RLS

- Toutes les nouvelles tables/ponts Collecte devront :
  - Référencer un `programme_id` / `project_id` / `formation_id` **porteur d’`organization_id`**.
  - Appliquer des policies `SELECT/INSERT/UPDATE/DELETE` basées uniquement sur :
    - `profiles.organization_id = programmes.organization_id` ou `projects.organization_id`.
  - Ne jamais exposer de données cross-tenant (cf. patterns `project_activities_*`, `budget_cascade_lines_*`).

---

## 5. Stratégie audit & journal d’événements

### 5.1. Event store central

- Table : `public.domain_events` (append-only, par organisation).
- Usage recommandé pour la chaîne Programme/Projet/Budget/Collecte :
  - `Programme.Created`, `Programme.Updated`, `ProgrammeAction.Completed`, `ProgrammeAction.NotRealized`.
  - `Project.Created`, `Project.Updated`, `Project.TaskStatusChanged`, `Project.TaskReassigned`.
  - `BudgetCascadeLine.Created/Updated`, `BudgetCascadeLine.WorkflowChanged`.
  - `Collecte.AssignmentLinked`, `Collecte.SubmissionSyncedToCrm`.
- Règles :
  - Chaque mutation critique dans les services (ou triggers) doit écrire **exactement un événement idempotent** :
    - `client_event_id` stable (UUID côté client ou hash du payload).
    - `correlation_id` pour regrouper les changements issus d’une même action utilisateur.

### 5.2. Projection & read-models

- **Programme**
  - `programme_cockpit_read_models` + `projection_checkpoints` :
    - agrègent budget (`v_budget_cascade_*`), actions programme, activités terrain, Collecte et CRM.
  - `programmeCockpitService` reste l’API de référence pour la UI (`ProgrammeModule`).

- **Projet**
  - `buildProjectCockpitReadModel` (service TS) produit un **read-model projet** aligné avec les événements :
    - tâches (statuts, scores, charges),
    - risques,
    - budget (via `budget_cascade_lines` + vues),
    - temps passés.

- **Collecte**
  - Les événements Collecte (synchro CRM, assignations, preuves) sont remontés dans :
    - `domain_events` (normalisation),
    - projections M&E (PHASE 4) lorsque pertinentes (e.g. taux de réponse, couverture bénéficiaires).

### 5.3. Lien avec la stratégie d’entreprise

- L’OS impose une **traçabilité native** :
  - Chaque budget, tâche, activité ou collecte liée à un objectif programmatique peut être relié :
    - à un `Programme` (axe stratégique / bailleur),
    - à des KPI M&E (`phase-4-me-impact/*`),
    - à des décisions gouvernance (`phase-2-governance/*`).
  - Les journaux `domain_events` et les read-models (cockpits) sont la base des revues de performance et de conformité (internes & bailleurs).

---

## 6. Roadmap P0 / P1 / P2 (ciblée Programme / Projet / Budget / Collecte)

### 6.1. P0 — Stabilisation & alignement minimum

- **P0.1 — Hiérarchie & RLS**
  - Vérifier cohérence des FK : `projects.programme_id`, `project_activities.project_id`, `tasks.activity_id`, `budget_cascade_lines.*`.
  - S’assurer que les policies RLS sont bien appliquées sur toutes les nouvelles tables (fait pour `project_activities`, `budget_cascade_lines`, `tasks`).

- **P0.2 — Programme cockpit comme référence**
  - Confirmer que l’onglet Résumé de `ProgrammeModule` ne recalcule **rien** en local, mais consomme uniquement `programme_cockpit_read_models`.
  - Encapsuler tout calcul résiduel dans des services dédiés (en vue d’une projection DB future).

- **P0.3 — Collecte & navigation**
  - Généraliser le pattern de nav Collecte :
    - Programme → `NAV_SESSION_COLLECTE_PRESET_PROGRAMME_ID`.
    - Projet → nouvelle clé `NAV_SESSION_COLLECTE_PRESET_PROJECT_ID`.
  - Ne **rien changer** aux flux de synchro CRM existants (webhook, `contacts.source_*`).

- **P0.4 — Événements critiques**
  - Standardiser l’écriture dans `domain_events` pour :
    - changement de statut de tâche projet (déjà amorcé via `applyTaskStatusChange`),
    - changement majeur sur une ligne budget cascade,
    - clôture / non-réalisation d’une action programme.

### 6.2. P1 — Consolidation produit & M&E

- **P1.1 — Budget crescendo full-stack**
  - Exposer dans les cockpits :
    - au niveau programme : agrégats `v_budget_cascade_rollup_by_post` et `v_budget_cascade_rollup_by_scope`.
    - au niveau projet : rollup par projet/activité/tâche + lien vers justificatifs.
  - Ajouter un drill-down standard “Budget → Projets → Activités → Tâches”.

- **P1.2 — Collecte & formations**
  - Étendre la nav Collecte depuis les écrans formations.
  - Introduire la table `collecte_assignments` (ou équivalent) pour donner de la visibilité OS (M&E, analytics) sans changer les UX Collecte/CRM.

- **P1.3 — Timeline & audit**
  - Construire des timelines consolidées :
    - par projet : mix `domain_events`, `tasks`, `project_activities`, Collecte liée.
    - par programme : agrégation des timelines projet.

### 6.3. P2 — Gouvernance avancée & reporting bailleurs

- **P2.1 — Gouvernance budgétaire avancée**
  - Étendre les gardes-fous budget (workflows multi-étapes, échantillonnage, audit immuable).
  - Connecter les décisions gouvernance (DSL, approbations) au journal `domain_events`.

- **P2.2 — Reporting bailleur & IA**
  - Construire les exports auditables (freeze+hash) basés sur :
    - cockpits programme/projet,
    - budget cascade,
    - Collecte & CRM (bénéficiaires, campagnes).
  - Activer des assistants IA **read-only**, alimentés par les read-models (programme/projet/budget/collecte) et citant toujours leurs sources.

---

## 7. Sujets de migrations Supabase (proposés)

> **Important** : ces migrations sont proposées comme **brouillons**. Ne pas exécuter sur un projet distant sans validation ni revue de sécurité.  
> Les noms suivent la convention `YYYYMMDDHHMMSS_description.sql`.

- **[P0] Renforcement timeline & liens activité/tâche**
  - `20260515120000_project_activity_task_constraints.sql`
  - Objet :
    - ajouter des contraintes souples (CHECK ou triggers) pour garantir que `tasks.due_date` reste dans la fenêtre de l’activité quand `activity_id` est défini ;
    - index supplémentaires sur `project_activities(start_date, end_date)`, `tasks(activity_id, due_date)` pour les timelines.

- **[P1] Pont Collecte ↔ Programme/Projet/Formation**
  - `20260515121000_collecte_assignments_bridge.sql`
  - Objet :
    - création de la table `public.collecte_assignments` (`organization_id`, `collection_id`, `category_key`, `programme_id`, `project_id`, `activity_id`, `formation_id`);
    - RLS inspirée de `budget_cascade_lines_all` (jointure sur `programmes` / `projects` pour filtrer par `profiles.organization_id`).

- **[P1] Événements budgétaires normalisés**
  - `20260515122000_budget_cascade_domain_events_triggers.sql`
  - Objet :
    - triggers `AFTER INSERT/UPDATE` sur `budget_cascade_lines` qui écrivent dans `public.domain_events` :
      - `BudgetCascadeLine.Created` / `BudgetCascadeLine.Updated`,
      - `aggregate_type='budget_cascade_line'`, `aggregate_id=id::text`.

- **[P1] Événements Collecte**
  - `20260515123000_collecte_domain_events_bridge.sql`
  - Objet :
    - fonctions / triggers côté webhook `crm-webhook-dispatch` pour écrire :
      - `Collecte.SubmissionSyncedToCrm`,
      - `Collecte.ContactCreatedFromSubmission`.

- **[P2] Projections spécialisées budget & M&E**
  - `20260515124000_programme_me_budget_read_models.sql`
  - Objet :
    - nouvelles tables read-models pour :
      - agrégats budget + MEL par programme/projet/activité (M&E Engine, PHASE 4),
      - snapshot reproductible pour reporting bailleurs (`run_id`, `hash`).

Ces sujets viennent compléter les migrations déjà en place, en s’appuyant sur les patterns existants (`programme_cockpit_read_models`, `domain_events`, `budget_cascade_lines`, `project_activities`) sans casser les flux actuels (Collecte, CRM, cockpit programme/projet).

 # COYA — Harmonisation Programme / Projet / Budget / Collecte

Ce document aligne le **Project & Program OS** canonique avec l’implémentation réelle COYA (React + Supabase) sur quatre axes :

- **Hiérarchie opérationnelle** : Programme (1+ bailleurs) → Projets → Activités terrain → Tâches.
- **Budget en cascade** : des lignes budgétaires macro aux montants micro par activité/tâche.
- **Collecte & CRM** : campagnes de collecte rattachées aux programmes/projets/formations avec synchronisation CRM.
- **Traçabilité & audit** : événements domaine, cockpits CQRS, RLS multi‑tenant.

Les références principales sont :

- Canonique : `docs/PROJECT-PROGRAM-OS-SPEC.md`, `docs/project-program-os/EXEC-SUMMARY.md`.
- Audit d’alignement : `docs/project-program-os/ALIGNMENT-AUDIT-COYA-VS-OS.md`.
- Architecture runtime : `system-audit/ARCHITECTURE-MAP.md`, `domains/shared/event-policies-registry.md`.
- Migrations clés :
  - `20260331121000_hotfix_projects_programme_settings_planning.sql`
  - `20260403120000_programme_terrain_hierarchy_budget_crm.sql`
  - `20260403140000_budget_rollup_mel_tasks_crm_rights.sql`
  - `20260506140000_domain_events_event_store.sql`
  - `20260508140000_programme_cockpit_read_model.sql`
  - `20260508143000_programme_cockpit_projection_run.sql`

---

## 1. Cartographie rapide de l’existant (code ↔ OS)

### 1.1 Hiérarchie Programme → Projet → Activité → Tâche

**Ce qui existe déjà**

- **Programme & bailleurs**
  - Tables : `public.programmes`, `public.bailleurs`, `public.programme_stakeholders`, `public.programme_bailleurs`.
  - Service : `services/programmeService.ts` (`Programme`, `ProgrammeStakeholder`, `ProgrammeAction`, `Beneficiaire`, etc.).
  - UI : `components/ProgrammeModule.tsx` (onglets `resume`, `budget`, `projets_terrain`, `acteurs_collecte`).
- **Lien Programme → Projet**
  - Migration : `20260331121000_hotfix_projects_programme_settings_planning.sql` ajoute `projects.programme_id` + index & RLS.
  - UI : navigation Programme ⇄ Projets via `ProgrammeModule` et `ProjectDetailPage` / `ProjectObjectWorkspace`.
- **Activités terrain**
  - Migration : `20260403120000_programme_terrain_hierarchy_budget_crm.sql` crée `public.project_activities` + RLS (filtre `organization_id`).
  - Service : fonctions `listProjectActivities/createProjectActivity/updateProjectActivity` dans `programmeService.ts`.
  - UI : section « projets_terrain » dans `ProgrammeModule` + usage côté `CollecteModule` pour rattacher une campagne à une activité.
- **Tâches projet**
  - Modèle : `public.tasks` (JSON historique des tâches projet) + migration `20260403140000_budget_rollup_mel_tasks_crm_rights.sql` (colonnes `activity_id`, `client_task_key`).
  - Runtime domaine : bus & policies projet dans `services/domain/*`, cockpit projet dans `services/projectCockpitReadModel.ts` et `components/ProjectDetailPage.tsx` / `components/project/workspace/ProjectObjectWorkspace.tsx`.

**Gaps principaux**

- Le workflow canonique « Programme → Projet → Activité → Tâche » est **présent dans les données** mais **pas encore exposé comme fil conducteur unique** dans l’UI (navigation parfois projet‑centrée, parfois programme‑centrée).
- La colonne `tasks.activity_id` est disponible, mais le **rattachement systématique des tâches à une activité** n’est pas encore garanti par le runtime (ni visible dans l’UI projet).
- Les **missions** au sens strict de la Canonical Spec (ordre de mission, exécution, incidents) ne sont pas encore matérialisées comme entité dédiée (couvertes partiellement par `project_activities` + tâches).

---

### 1.2 Budget en cascade (Programme → Projet → Activité → Tâche)

**Ce qui existe déjà**

- **Lignes budgétaires par programme**
  - Table : `public.programme_budget_lines`.
  - Service : `listProgrammeBudgetLines/createProgrammeBudgetLine/...` dans `programmeService.ts`.
  - UI : onglet `budget` de `ProgrammeModule` (KPI portefeuille via `ProgrammesEnterpriseTable`, `EnterpriseFinanceKpiStrip`, `EnterpriseDonutRing`).
- **Budget cascade multi‑niveau**
  - Migration : `20260403120000_programme_terrain_hierarchy_budget_crm.sql` crée `public.budget_cascade_lines` avec `scope_level` (`programme` | `project` | `activity` | `task`) + FKs `programme_id`, `project_id`, `activity_id`, `project_task_id`.
  - Migration : `20260403140000_budget_rollup_mel_tasks_crm_rights.sql` ajoute `task_id` + vues `v_budget_cascade_rollup_by_post` et `v_budget_cascade_rollup_by_scope` + garde‑fous `budget_cascade_lines_update_guard()` (terrain vs finance) + fonction `profile_budget_validator()`.
  - Service : `listBudgetCascadeLines`, `createBudgetCascadeLine`, `updateBudgetCascadeLine`, `listBudgetRollupByPost`, `listBudgetRollupByScope` dans `programmeService.ts`.
  - UI : `ProgrammeModule` (onglet `budget`, utilisation des vues rollup) avec logique `BudgetCascadeLine` / `BudgetRollupByPostRow` / `BudgetRollupByScopeRow`.

**Gaps principaux**

- La **vue micro (par tâche/activité)** n’est pas encore exposée de façon systématique depuis le **workspace projet** (`ProjectObjectWorkspace`) : le budget cascade reste plutôt consommé au niveau programme.
- Les **justificatifs** et documents financiers (dépenses, pièces jointes) sont traités par d’autres modules (DAF/Drive) et ne sont pas encore reliés de façon évidente à chaque ligne de budget cascade (lien via `task_id`/`activity_id` à industrialiser).

---

### 1.3 Collecte, CRM & formations

**Ce qui existe déjà**

- **Collecte locale + rattachements**
  - Service : `services/dataCollectionService.ts` (stockage local `DataCollection` + `DataCollectionSubmission` dans `localStorage`).
  - Module de rattachement : `modules/collecte-rattachement/storage.ts` (catégories personnalisées, entités métier).
  - UI collecte : `components/CollecteModule.tsx`.
  - Rattachements possibles :
    - par **programme** (`programmeId`) ;
    - par **projet** (`projectId`) ;
    - par **formation** (`formationId`) ;
    - catégories configurables (ex. `emission`).
  - Backfill : `backfillProgrammeIdsFromProjects` garantit la cohérence `project.programmeId → collection.programmeId`.
- **Navigation entre modules**
  - Contexte navigation : `contexts/AppNavigationContext.tsx` expose des clés de session :
    - `NAV_SESSION_COLLECTE_PRESET_PROGRAMME_ID` (préremplir une campagne programme).
    - `NAV_SESSION_COLLECTE_PRESET_COLLECTION_ID` (préremplir la campagne côté CRM).
    - `NAV_SESSION_CRM_FILTER_SOURCE_COLLECTION_ID` (filtrer CRM par collection origine).
    - `NAV_SESSION_COURSES_PROGRAMME_ID` (filtrer formations par programme).
  - `ProgrammeModule` positionne `NAV_SESSION_COLLECTE_PRESET_PROGRAMME_ID` avant de naviguer vers `CollecteModule`.
  - `CollecteModule` lit ces clés pour :
    - présélectionner la catégorie `programme` et l’id de rattachement ;
    - filtrer les campagnes visibles par type (programme/projet/formation).
- **Synchronisation CRM**
  - Migration : `20260422180000_contacts_collecte_source.sql` ajoute des colonnes d’origine sur `public.contacts` (`source`, `source_collection_id`, `source_submission_id`, etc.).
  - Service : `programmeService.upsertParticipantPayloadToCrm` + `DataService.createContact` + évènements `crmIntegrationHub.dispatchCrmOutboundEvent`.
  - UI : affichage des statistiques de synchronisation dans `CollecteModule` (compteurs `total` / `synced`).

**Gaps principaux**

- Le **workspace projet** n’expose pas encore un **panneau Collecte/Participants** symétrique à l’onglet `acteurs_collecte` du module Programme (point d’entrée projet manquant).
- Pas encore de **modèle serveur** (tables Supabase) pour pérenniser les définitions de campagnes et soumissions (toute la collecte vit côté client + CRM).

---

### 1.4 Read‑models, cockpits & audit

**Ce qui existe déjà**

- **Event store domaine**
  - Migration : `20260506140000_domain_events_event_store.sql` crée `public.domain_events` (append‑only, RLS par `organization_id`).
  - Registre de policies : `domains/shared/event-policies-registry.md` (policies projet existantes, slots réservés pour la finance).
- **Programme Cockpit**
  - Migrations :
    - `20260508140000_programme_cockpit_read_model.sql` : `programme_cockpit_read_models` + `projection_checkpoints` + RLS lecture.
    - `20260508143000_programme_cockpit_projection_run.sql` : colonnes `projection_run_id`, `projection_status`, `projection_error`.
  - Services : `services/programmeCockpitService.ts`, `services/programmeCockpitContract.ts`.
  - UI : `ProgrammeModule` consomme déjà ce cockpit pour la vue d’ensemble.
- **Projet Cockpit**
  - Runtime domaine : bus, commandes, événements et policies dans `services/domain/*`.
  - Read‑model : `buildProjectCockpitReadModel` (cockpit projet) utilisé dans `ProjectDetailPage.tsx` et `ProjectObjectWorkspace.tsx`.

**Gaps principaux**

- Le **journal des événements** (`domain_events`) ne couvre pas encore de manière systématique :
  - les opérations de budget cascade (`BudgetCascadeLine.Created/Updated/...`) ;
  - les opérations de collecte (`CollecteCampaign.Created`, `CollecteSubmission.SyncedToCrm`, …).
- La **timeline fonctionnelle** canonique (OS) n’est pas encore complètement exposée dans l’UI Programme/Projet (historiques partiels).

---

## 2. Roadmap d’harmonisation (P0 / P1 / P2)

### 2.1 P0 — Socle données, RLS et traçabilité minimale

- **Hiérarchie & FKs**
  - S’assurer que tout **projet créé depuis un programme** renseigne systématiquement `projects.programme_id` (contrôles côté `ProjectCreatePage`).
  - Renforcer l’usage de `project_activities` comme **pivot terrain** :
    - désactiver progressivement les usages « activité » implicites dans les tâches projet (libellés libres).
  - Stabiliser l’usage de `tasks.activity_id` + `budget_cascade_lines.activity_id/task_id` dans le runtime.
- **RLS & multi‑tenant**
  - Vérifier que tous les écrans programme/projet/collecte utilisent les colonnes `organization_id` + RLS existantes (`project_activities`, `budget_cascade_lines`, `programme_cockpit_read_models`, `projection_checkpoints`).
- **Journal d’événements**
  - Étendre le bus domaine (`services/domain/*`) pour **émettre** dans `domain_events` au minimum :
    - `Program.Created/Updated`,
    - `Project.Created/Closed`,
    - `ProjectActivity.Created/Updated`,
    - `BudgetCascadeLine.Created/Updated`,
    - `CollecteSubmission.SyncedToCrm`.
  - Relier ces événements à des `policy_id` réservés dans `domains/shared/event-policies-registry.md` (finance, collecte).

### 2.2 P1 — UX micro→macro & cockpit unifiés

- **ProgrammeDetail (ProgrammeModule)**
  - **Onglet `resume`** : lire systématiquement depuis `programme_cockpit_read_models` (model JSON) pour garantir que la vue est un **read‑model CQRS**, pas une agrégation ad‑hoc.
  - **Onglet `budget`** : utiliser les vues `v_budget_cascade_rollup_by_post` et `v_budget_cascade_rollup_by_scope` pour afficher :
    - macros par **poste de dépense** ;
    - macros par **niveau** (programme / projet / activité / tâche) avec liens vers les vues projet/activité/tâche.
  - **Onglet `projets_terrain`** :
    - lister projets + activités issues de `project_activities` avec liens directs vers `ProjectObjectWorkspace` (onglet cockpit par défaut).
  - **Onglet `acteurs_collecte`** :
    - regrouper bénéficiaires (`beneficiaires`), `programme_stakeholders`, campagnes de collecte et formations filtrées par programme.
- **ProjectObjectWorkspace**
  - Ajouter un **bloc Budget** (micro) alimenté par `budget_cascade_lines` filtré sur `project_id` et (`activity_id`/`task_id` le cas échéant).
  - Ajouter un **bloc Collecte / Participants** qui :
    - affiche les campagnes `DataCollection` rattachées au projet (`projectId`) et éventuellement à une activité donnée ;
    - propose un CTA « Ouvrir dans Collecte » qui positionne une clé de session (voir § 3.3).
  - Sur l’inspecteur de tâche, afficher les **lignes de budget cascade** liées (via `budget_cascade_lines.task_id`) + statut M&E associé (`mel_*` sur `project_activities`).

### 2.3 P2 — M&E, reporting bailleurs & IA

- Étendre les read‑models (programme & projet) pour intégrer :
  - métriques M&E (cibles/résultats agrégés depuis `project_activities.mel_*` et travaux futurs autour d’`indicator_*`) ;
  - agrégations de collecte (nombre de participants, statut de synchronisation CRM).
- Préparer les **packs bailleurs** en s’appuyant sur :
  - les cockpits (programme/projet) comme **snapshots figés** (`model`, `projection_run_id`) ;
  - le journal des événements (`domain_events`) comme preuve d’historique.
- Brancher ultérieurement l’**AI Ops Layer** sur ces read‑models (et pas sur les tables brutes) conformément à `phase-5-ai-ops/*`.

---

## 3. Modèle de données cible (deltas vs existant)

### 3.1 Hiérarchie & entités centrales

La Canonical Spec propose le graphe :

> Organisation → Programme → Projet → Composante → Activité → Mission → Exécution/Reporting/Archivage  

Dans COYA, on s’aligne pragmatiquement comme suit :

- **Programme** : `public.programmes` (déjà en place, avec `organization_id`, `bailleur_id`, `start_date`, `end_date`, etc.).
- **Projet** : `public.projects` avec `programme_id` (migration `20260331121000_*`).
- **Activité terrain** : `public.project_activities` (migration `20260403120000_*`).
- **Tâche** : `public.tasks` enrichi par `activity_id`, `client_task_key` (migration `20260403140000_*`).
- **Mission** (canonique) : à modéliser en P2 comme **spécialisation d’activité** ou nouvelle table `missions`, mais **hors périmètre** de ce plan P0/P1.

**Deltas proposés (sans migration immédiate)** :

- Documenter dans les specs internes que :
  - toute tâche projet **doit** être rattachée à une activité (`tasks.activity_id`) dès qu’une activité terrain existe ;
  - les UI de création de tâches dans `ProjectObjectWorkspace` proposent systématiquement un champ « Activité associée ».

### 3.2 Budget cascade & justification

Base existante :

- `public.programme_budget_lines` (niveau programme).
- `public.budget_cascade_lines` + vues rollup + gardes terrain/finance.
- `public.tasks.task_id` (FK) pour relier budget cascade aux tâches.

**Deltas fonctionnels (sans changement de schéma immédiat)** :

- Conventionner l’usage des colonnes :
  - `scope_level='programme'` : budget macro du programme (aligné bailleurs).
  - `scope_level='project'` : enveloppe par projet.
  - `scope_level='activity'` : enveloppe par activité terrain.
  - `scope_level='task'` : micro‑montant par tâche, lié à `task_id`.
- Lier les justificatifs via les modules DAF/Drive existants (migrations `drive_items_*`, `daf_*`) en ajoutant, côté application et domaine, des conventions d’**étiquetage** (ex. `budget_cascade_line_id` dans les métadonnées de document ou via une table de liaison dédiée en P2).

### 3.3 Collecte & CRM

**Modèle actuel (client + CRM)** :

- `DataCollection` et `DataCollectionSubmission` vivent dans `localStorage` (via `dataCollectionService.ts`).
- Chaque soumission peut créer ou enrichir un contact CRM :
  - `programmeService.upsertParticipantPayloadToCrm` dédoublonne par email/téléphone puis appelle `DataService.createContact`.
  - Migration `20260422180000_contacts_collecte_source.sql` trace l’origine : `source = 'collecte_submission'`, `source_collection_id`, `source_submission_id`, `organization_id`.
- Les **rattachements métier** sont directement sur le modèle `DataCollection` (client) :
  - `programmeId`, `projectId`, `formationId` (utilisés dans `CollecteModule` pour filtrer).

**Évolution cible (P1/P2, migrations à venir)**

- Introduire un schéma serveur minimal pour **péréniser** les campagnes :

  ```sql
  -- Exemple à documenter, pas à appliquer directement
  create table public.collecte_campaigns (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    programme_id uuid references public.programmes(id) on delete set null,
    project_id uuid references public.projects(id) on delete set null,
    formation_id uuid references public.courses(id) on delete set null,
    title text not null,
    definition jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  ```

- Les soumissions resteraient synchronisées via CRM (pour éviter la duplication de stockage), mais les **métadonnées de campagne** (niveau, définition, rattachements) seraient alignées avec `programmes/projects/courses`.

---

## 4. UX & navigation micro→macro

### 4.1 ProgrammeModule (centre de gravité « Programme & Projets »)

**Onglet `resume`**

- Source : `programme_cockpit_read_models` via `programmeCockpitService`.
- Contenu attendu :
  - bailleurs (principal + additionnels via `ProgrammeBailleurLink`) ;
  - budget macro (total prévu/consommé, variance) ;
  - KPIs M&E clés (issus des activités + futures tables `indicator_*`) ;
  - risques & statut santé (via read‑model projet).

**Onglet `budget`**

- Source :
  - `programme_budget_lines` (liste simple) ;
  - `v_budget_cascade_rollup_by_post` (macro par poste) ;
  - `v_budget_cascade_rollup_by_scope` (macro par niveau).
- UX :
  - tableau par poste de dépense, avec liens vers détail projet/activité/tâche ;
  - heatmap par niveau (programme/projet/activité/tâche) avec drill‑down.

**Onglet `projets_terrain`**

- Source :
  - `projects` filtrés par `programme_id` ;
  - `project_activities` pour la hiérarchie terrain.
- UX :
  - vue hiérarchique Programme → Projet → Activités → Tâches (résumé) ;
  - clic sur un projet ouvre `ProjectObjectWorkspace` (onglet cockpit).

**Onglet `acteurs_collecte`**

- Source :
  - `beneficiaires` (participants terrain) ;
  - `programme_stakeholders` (facilitateurs, partenaires, staff interne, etc.) ;
  - `DataCollection` filtré par `programmeId` ;
  - formations (`courses`) filtrées par `NAV_SESSION_COURSES_PROGRAMME_ID`.
- UX :
  - liste des campagnes de collecte associées au programme, avec compteurs de soumissions et statut CRM ;
  - CTA « Ouvrir Collecte » qui :
    - positionne `NAV_SESSION_COLLECTE_PRESET_PROGRAMME_ID` ;
    - switch la vue globale vers `CollecteModule`.

### 4.2 ProjectObjectWorkspace (micro pilotage projet)

**Cockpit projet**

- Affichage des **KPIs projet** (tâches, risques, temps logué, budget consommé) via `buildProjectCockpitReadModel`.
- Intégration d’un **bloc Budget projet** basé sur :
  - `budget_cascade_lines` filtré par `project_id` (et agrégations locales si la vue n’est pas disponible) ;
  - mise en avant de la variance budgétaire (prévu vs réel).

**Tâches & activités**

- Formulaire de création de tâche enrichi pour **choisir une activité terrain** (liste `project_activities`).
- Inspecteur de tâche :
  - affiche l’activité associée ;
  - liste les lignes `budget_cascade_lines` liées (`task_id` ou couple `(project_id, client_task_key)` en fallback).

**Collecte & participants**

- Bloc « Collecte / Participants » :
  - affiche les campagnes `DataCollection` rattachées à `projectId` (et à l’activité sélectionnée si applicable) ;
  - présente les statistiques de soumission et synchronisation CRM (via `dataCollectionService` + `crmIntegrationHub`).
  - CTA « Configurer / voir la collecte projet » qui :
    - positionne une clé session type `NAV_SESSION_COLLECTE_PRESET_PROJECT_ID` (à ajouter) ;
    - oriente vers `CollecteModule` filtré sur `project`.

---

## 5. Stratégie audit & event trail

### 5.1 Principes

- **Event‑sourcing léger** : pas de ré‑écriture rétroactive, mais un **journal append‑only** (`domain_events`) pour les événements clés.
- **CQRS pragmatique** :
  - write‑side : tables normalisées (`programmes`, `projects`, `project_activities`, `tasks`, `budget_cascade_lines`, `beneficiaires`, etc.) ;
  - read‑side : projections ciblées (`programme_cockpit_read_models`, cockpits projet, futures vues M&E).
- **Traçabilité bout‑en‑bout** :
  - chaque décision importante (validation budget, création d’activité, synchronisation collecte↔CRM) laisse une trace dans `domain_events` et/ou dans `audit_logs` (cf. Canonical Spec).

### 5.2 Événements recommandés (non exhaustif)

- **Programme**
  - `Program.Created`, `Program.Updated`, `Program.Closed`.
  - `Program.BudgetLine.Created/Updated`.
  - `Program.Cockpit.ProjectionBuilt` (lié à `programme_cockpit_read_models.projection_run_id`).
- **Projet & terrain**
  - `Project.Created`, `Project.Closed`.
  - `ProjectActivity.Created/Updated`.
  - `Task.Created/Updated/StatusChanged` (déjà partiellement couvert par les events projet existants).
- **Budget**
  - `BudgetCascadeLine.Created/Updated/Locked` avec détail `(scope_level, expense_post_code, amounts)`.
- **Collecte & CRM**
  - `CollecteCampaign.Created/Updated` (même si la définition reste client‑side initialement).
  - `CollecteSubmission.SyncedToCrm` (emit via `crmIntegrationHub`, corrélé à `contacts.source_*`).

Ces événements suivent la structure de `public.domain_events` : `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `occurred_at`, `organization_id`, `client_event_id`, etc.

---

## 6. Sujets de migrations Supabase (proposés, non appliquées)

> **Important** : les fichiers ci‑dessous sont des **propositions**. Ils ne doivent pas être appliqués sur un projet distant sans revue manuelle ni sans passer par le pipeline de migrations déjà en place.

- **P0 — Traçabilité & cockpits**
  - **`20260515160000_programme_cockpit_budget_me_enrichment.sql`**
    - Enrichir `programme_cockpit_read_models.model` (champ JSON) avec des colonnes calculées côté projection : agrégats budget (issues de `v_budget_cascade_rollup_by_*`) et premiers KPIs M&E (à partir de `project_activities.mel_*`).
    - Pas de nouveau schéma physique : travail dans les fonctions/projections backend (Edge/cron).
- **P1 — Collecte campagne (schéma serveur minimal)**
  - **`20260515161000_collecte_campaigns_programme_project_fk.sql`**
    - Créer `public.collecte_campaigns` (voir exemple § 3.3) avec RLS calqué sur `programmes` (`profiles.organization_id`).
    - Optionnellement, introduire une table `collecte_campaign_snapshots` si on veut historiser les définitions de formulaire.
- **P1 — Lien formations ↔ programmes**
  - **`20260515162000_courses_programme_fk.sql`**
    - Ajouter `programme_id uuid references public.programmes(id) on delete set null` sur la table `public.courses` (si non existant).
    - Index `idx_courses_programme` et policies RLS alignées sur `projects`/`programmes`.
- **P2 — Evidence & reporting bailleurs**
  - **`20260515163000_budget_evidence_link.sql`**
    - Créer une table de liaison `budget_line_evidence` (`budget_cascade_line_id`, `document_id`, `evidence_type`, métadonnées) pour relier budget et pièces justificatives dans un schéma standardisé.

---

## 7. Résumé exécutif

- **Aujourd’hui**, COYA dispose déjà :
  - d’une hiérarchie **Programme → Projet → Activité → Tâche** en base (avec liens à la collecte & au CRM) ;
  - d’un **budget cascade** multi‑niveau avec RLS et garde‑fous terrain/finance ;
  - de read‑models `programme_cockpit_read_models` et d’un runtime domaine projet (`domain_events`).
- **L’harmonisation proposée** consiste à :
  - rendre cette structure **cohérente et visible dans l’UI** (ProgrammeModule + ProjectObjectWorkspace) ;
  - centraliser les **vues budget / M&E / collecte** sur les cockpits (Programme & Projet) ;
  - systématiser la **traçabilité via domain_events** et préparer des migrations ciblées pour la collecte serveur et les liens budget‑évidence.

# Harmonisation Programme / Projet / Budget / Collecte

## 1. Contexte et objectifs

Ce document aligne le **module Programme & Projets** existant (React + Supabase) avec la **Canonical Spec Project & Program OS** pour le périmètre suivant :

- **Hiérarchie fonctionnelle** : Programme (1+ bailleurs) → Projets → Activités de terrain → Tâches.
- **Crescendo budgétaire** : lignes budgétaires par niveau (programme / projet / activité / tâche) avec vues micro → macro.
- **Synergie collecte / CRM / formations** : collecte terrain et participations rattachées aux programmes/projets, synchronisées vers le CRM.
- **Traçabilité & audit** : tout changement important est traçable (qui, quoi, quand, sur quel périmètre) et exploitable par les cockpits (Programme, Projet).

Le plan s’appuie sur :

- L’implémentation actuelle (`components/ProgrammeModule.tsx`, `components/ProjectDetailPage.tsx`, `components/project/workspace/ProjectObjectWorkspace.tsx`, `services/programmeCockpitService.ts`, `buildProjectCockpitReadModel`, etc.).
- Les migrations Supabase existantes :
  - Hiérarchie et budget cascade : `20260403120000_programme_terrain_hierarchy_budget_crm.sql`
  - Actions programme : `20260408120000_programme_actions_assignees_proof.sql`
  - Cockpit programme (CQRS) : `20260508140000_programme_cockpit_read_model.sql`, `20260508143000_programme_cockpit_projection_run.sql`
  - Projets / tâches / meetings : `20250220150000_phase2_projects_tasks_meetings.sql`, `20260331121000_hotfix_projects_programme_settings_planning.sql`
  - Attachments / settings projets : `20250220160000_phase2_project_attachments_and_settings.sql`
  - Collecte ↔ CRM : `20260422180000_contacts_collecte_source.sql`, `20260423140000_contact_dossier_items.sql`
  - Event store & journal de travail : `20260506140000_domain_events_event_store.sql`, `20260509120000_workforce_activity_events.sql`, `20260510120000_coya_work_journal_summaries_proofs.sql`

---

## 2. Hiérarchie fonctionnelle cible

### 2.1 Niveaux métier

- **Programme**
  - Regroupe 1+ bailleurs, un budget global, des objectifs stratégiques, une période de référence.
  - Supporté par `public.programmes` + `programme_stakeholders`, `programme_actions`, `programme_budget_lines` (voir migrations existantes).
  - Cockpit exécutif : `programme_cockpit_read_models` (snapshot) + `projection_checkpoints`.

- **Projet**
  - Porte une partie du programme, avec équipe opérationnelle, objectifs, risques, tâches.
  - Supporté par `public.projects` avec `programme_id` (`20250220150000_phase2_projects_tasks_meetings.sql` + `20260331121000_hotfix_projects_programme_settings_planning.sql`).
  - Workspace opérationnel : `ProjectDetailPage` / `ProjectObjectWorkspace`.

- **Activité de terrain**
  - Granularité opérationnelle sous un projet (mission, atelier, tournée terrain, campagne locale…).
  - Supportée par `public.project_activities` (`20260403120000_programme_terrain_hierarchy_budget_crm.sql`) avec `programme_id`, `project_id`, `status`, `start_date` / `end_date`.
  - Vue au niveau Programme : onglet `projets_terrain` de `ProgrammeModule`.

- **Tâche**
  - Unité de travail assignable (SMART, due date, responsable), parfois directement budgétée.
  - Supportée par :
    - Table structurée `public.tasks` (RLS + indices) pour le suivi gouverné.
    - Colonne JSON `projects.tasks` (héritage) utilisée par l’UI et par `budget_cascade_lines.project_task_id` (clé texte) pour certains cas.
  - Vue au niveau Projet : onglet `tasks` du workspace (`TasksWorkspaceTab` dans `ProjectObjectWorkspace`).

### 2.2 Principes méthodologiques

- **Chaîne continue Programme → Projet → Activité → Tâche**
  - Chaque niveau a un identifiant stable, une période (début/fin), un statut, des liens hiérarchiques explicites.
  - Les événements métier majeurs (création, affectation, validation, clôture, changement de budget) génèrent des **domain events** traçables.

- **Coexistence JSON / tables structurées (transition douce)**
  - À court terme, on **réutilise** `projects.tasks` JSON pour compatibilité UI et pour la cascade budgétaire (`project_task_id`).
  - À moyen terme (P1/P2), on converge vers des tâches **structurées** (`public.tasks`) en conservant des clés de correspondance stables.

- **Micro → Macro**
  - Micro (tâche / activité) : consignes, responsabilité, budget rattaché, preuves, collecte, time tracking.
  - Méso (projet) : cockpit projet, risques, avancement, burn-down tâches, pièces jointes.
  - Macro (programme) : cockpit programme (budget global, MEL, gouvernance), rollups budgétaires et preuves consolidées.

---

## 3. Roadmap P0 / P1 / P2 (vertical Programme–Projet–Budget–Collecte)

### 3.1 P0 — Socle fonctionnel et alignement rapide (sans refonte lourde)

**Objectifs P0**

- Stabiliser la hiérarchie **Programme → Projet → Activité → Tâche** côté UI et DB (sans casser l’existant).
- Exploiter le **budget cascade** et le **Programme Cockpit** comme vérité unique pour les vues macros.
- Introduire des **points d’entrée collecte / formations** depuis les contextes Programme et Projet.
- Renforcer un **minimum de traçabilité** via les events existants.

**Actions clés P0**

- **Hiérarchie & types**
  - Vérifier / compléter les types TS (`Programme`, `Project`, `ProjectActivity`, `Task`) pour exposer clairement :
    - les identifiants hiérarchiques (`programmeId`, `projectId`, `activityId`, `projectTaskId`),
    - les périodes (`start_date`, `end_date`, `due_date`),
    - les statuts normalisés (`status` côté activité/tâche).
  - S’assurer que `ProgrammeModule` et `ProjectObjectWorkspace` consomment les mêmes types (via `../types`).

- **Vue Programme — onglet “Projets & terrain”**
  - Exploiter les données déjà chargées (`ProjectActivity[]`, `BudgetCascadeLine[]`, `BudgetRollupByScopeRow[]`) pour afficher :
    - un **tableau hiérarchique** ou une grille groupée par Projet → Activités, avec indicateurs de tâches (compteurs) issus de `project.tasks`.
    - des badges de budget (planned/actual) par activité, basés sur `budgetRollupByScope`.

- **Vue Projet — workspace**
  - Continuer à utiliser `ProjectObjectWorkspace` comme **workspace unifié** (cockpit, tâches, documents, historique).
  - S’assurer que les liens vers le programme parent (`programme_id`) sont affichés (breadcrumb et navigation retour).

- **Entrées Collecte / Formations**
  - Depuis `ProgrammeModule` (onglet `acteurs_collecte`) :
    - exposer des boutons “**Ouvrir collecte participants**” et “**Voir les formations liées**”.
    - utiliser le `AppNavigationContext` existant (`NAV_SESSION_COLLECTE_PRESET_PROGRAMME_ID`, `NAV_SESSION_COURSES_PROGRAMME_ID`) pour pré-sélectionner le programme et, plus tard, le projet.
  - Depuis `ProjectObjectWorkspace` :
    - bouton “Collecte liée au projet” qui pousse `programme_id` + `project_id` dans la navigation.

- **Traçabilité minimale**
  - S’assurer que les actions critiques (création / clôture d’une activité, modifications de budget cascade, clôture d’une tâche) appellent les services qui publient dans `domain_events` et/ou `coya_work_journal_summaries_proofs` (via `dispatchProjectDomainEvents`, patterns existants dans les services).

### 3.2 P1 — Gouvernance budgétaire détaillée et collecte structurée

**Objectifs P1**

- Renforcer l’alignement **budget cascade ↔ hiérarchie** jusqu’au niveau tâche.
- Structurer les **assignations collecte / formations** comme premières classes en base.
- Rendre les cockpits Programme / Projet plus explicites sur la chaîne **micro → macro**.

**Actions clés P1**

- **Lien tâches ↔ activités (sans casser l’existant)**
  - Introduire une colonne optionnelle `activity_id` dans `public.tasks` (voir section 4) pour lier explicitement une tâche à une `project_activities.id` lorsque pertinent.
  - Conserver l’usage de `project_task_id` (clé texte) dans `budget_cascade_lines` pour compatibilité avec les tâches JSON, en ajoutant seulement des **index** et des conventions de clé.

- **Budget cascade enrichi**
  - Compléter les usages de `budget_cascade_lines` pour permettre :
    - des vues d’agrégation **par scope_level** (programme / project / activity / task),
    - des filtres par **poste de dépense** (`expense_post_code`),
    - des indicateurs de workflow budgétaire (`workflow_status`).
  - Alimenter davantage `programme_cockpit_read_models.model` avec :
    - les agrégats multi-niveaux,
    - la liste des postes critiques (variance, surconsommation, lignes `locked`).

- **Collecte / CRM structurés**
  - Définir un **module d’assignation collecte** (voir 4.3) qui décrit, pour un programme/projet/activité/tâche :
    - quel **preset collecte** utiliser (formulaire, modèle de campagne),
    - quel **périmètre cible** (participants internes, ménages, bénéficiaires spécifiques),
    - comment remonter les données dans le CRM (contacts + `contact_dossier_items`).
  - S’appuyer sur les champs standardisés définis dans `utils/collecteParticipantFields.ts` pour garantir l’alignement des clés JSON, du CRM et de la grille programme.

- **Formations**
  - Reprendre le même pattern que pour la collecte :
    - attributs `programme_id` / `project_id` sur les entités de formation existantes (courses / sessions),
    - assignations gouvernées (qui doit participer, sur quelle activité / tâche),
    - journaux d’événements liés dans `domain_events` et `contact_dossier_items`.

### 3.3 P2 — M&E, reporting bailleurs et vue stratégique

**Objectifs P2**

- Faire converger la hiérarchie opérationnelle avec le moteur M&E (indicateurs, formules, agrégations) et les exports **auditables**.

**Actions clés P2**

- Construire des **projections dédiées** (PP-BE-004) pour :
  - les tableaux de bord M&E par programme/projet,
  - les exports bailleurs reproductibles (freeze + hash, `run_id`).
- Lier les **indicateurs** à des preuves concrètes :
  - participation à des activités / formations,
  - pièces jointes (budget, justificatifs, rapports, photos),
  - entrées `contact_dossier_items` ciblées.
- Connecter cette chaîne à la **stratégie entreprise** (objectifs globaux, axes stratégiques) via des tables existantes d’objectifs / analytics (ex. `Objectives`, `GoalsAnalytics` côté UI).

---

## 4. Modèle de données — existant vs deltas proposés

### 4.1 Tables existantes réutilisées

- **`public.programmes`**
  - Source principale des programmes, bailleurs, métadonnées.
  - Reliée à `programme_stakeholders`, `programme_actions`, `programme_budget_lines`, etc.

- **`public.projects`**
  - Colonne `programme_id` existante (`20250220150000_phase2_projects_tasks_meetings.sql` + `20260331121000_hotfix_projects_programme_settings_planning.sql`).
  - Sert de pivot pour le workspace projet et pour le lien budget cascade / cockpit programme.

- **`public.project_activities`** (`20260403120000_programme_terrain_hierarchy_budget_crm.sql`)
  - Colonnes clés : `organization_id`, `programme_id`, `project_id`, `title`, `start_date`, `end_date`, `status`, `sequence`, `created_at`, `updated_at`.
  - RLS : basée sur `organization_id` (via `profiles.organization_id`).

- **`public.tasks`** (`20250220150000_phase2_projects_tasks_meetings.sql`)
  - Colonnes clés : `organization_id`, `project_id`, `assignee_id`, `status`, `priority`, `due_date`, `start_date`, `estimated_hours`, `logged_hours`, `sequence`, `created_at`, `updated_at`.
  - RLS : contrôlée par `organization_id` lié à `profiles`.

- **`public.budget_cascade_lines`** (`20260403120000_programme_terrain_hierarchy_budget_crm.sql`)
  - Colonnes clés :
    - `scope_level` ∈ {`programme`, `project`, `activity`, `task`},
    - FKs : `programme_id`, `project_id`, `activity_id`,
    - `project_task_id` (texte, clé vers `projects.tasks` JSON),
    - données budgétaires (`expense_post_code`, `planned_amount`, `actual_amount`, `currency`),
    - `workflow_status` (`draft`, `submitted`, `validated`, `locked`).
  - Contrôle de cohérence `budget_cascade_scope_consistency` garantissant que les FKs sont cohérents avec le `scope_level`.

- **`public.programme_cockpit_read_models` + `public.projection_checkpoints`** (`20260508140000_programme_cockpit_read_model.sql`, `20260508143000_programme_cockpit_projection_run.sql`)
  - Snapshot de cockpit par `programme_id` :
    - `model` (JSON `ProgrammeCockpitReadModel`),
    - `generated_at`, `projection_run_id`, `projection_status`, `projection_error`,
    - watermarks `watermark_event_occurred_at`, `watermark_source_updated_at`.
  - Checkpoints de projection (`projection_name`, `organization_id`, `programme_id`, `last_built_at`, `last_event_occurred_at`, `watermark_position`).

- **`public.programme_actions` + `public.programme_action_assignees` + bucket `programme-action-proofs`** (`20260408120000_programme_actions_assignees_proof.sql`)
  - Actions reliées à un programme, avec période (`period_start`/`period_end`), preuves (`proof_url` / `proof_storage_path`), statut détaillé (dont `not_realized`).
  - Assignation multi-profils via `programme_action_assignees` (RLS par organisation).
  - Stockage des preuves dans un bucket dédié avec policies RLS basées sur `organization_id`.

- **CRM & Collecte**
  - `public.contacts` enrichi d’un contexte collecte (`source`, `source_collection_id`, `source_submission_id`, `organization_id`, `tags`, etc.) (`20260422180000_contacts_collecte_source.sql`).
  - `public.contact_dossier_items` (timeline CRM par contact) avec RLS par organisation (`20260423140000_contact_dossier_items.sql`).
  - Côté front : `utils/collecteParticipantFields.ts` définit les clés canoniques de payload collecte utilisées pour :
    - la grille participants,
    - l’upsert dans le CRM,
    - l’affichage dans l’onglet `acteurs_collecte` du `ProgrammeModule`.

- **Event store et journal opérationnel**
  - `public.domain_events` et dérivés (`20260506140000_domain_events_event_store.sql`).
  - `public.workforce_activity_events`, `public.coya_work_journal_summaries_proofs` pour tracer les activités de travail terrain (`20260509120000_workforce_activity_events.sql`, `20260510120000_coya_work_journal_summaries_proofs.sql`).

### 4.2 Deltas proposés (sans migration immédiate)

Ces deltas sont proposés conceptuellement pour P1/P2. Ils doivent être validés et spécifiés avant d’être implémentés en migrations.

- **Lien structuré tâche ↔ activité**
  - Ajouter une colonne optionnelle sur `public.tasks` :
    - `activity_id uuid references public.project_activities(id) on delete set null`
  - Usage :
    - Permettre de lier une tâche à une activité de terrain précise.
    - Faciliter les agrégations M&E et la cascade budgétaire au niveau tâche.
  - RLS : aucun changement nécessaire si `organization_id` est cohérent entre `tasks` et `project_activities`.

- **Métadonnées M&E sur `budget_cascade_lines` (P1/P2)**
  - Colonnes candidates (toutes nullables au départ) :
    - `me_indicator_code text null` — identifiant d’indicateur M&E lié à cette ligne.
    - `evidence_required boolean not null default false` — indique si une preuve est obligatoire.
    - `evidence_contact_id uuid references public.contacts(id) on delete set null` — contact principal rattaché (bénéficiaire / ménage).
  - Ces champs permettent de relier directement les agrégats budgétaires à des preuves et des bénéficiaires dans le CRM.

### 4.3 Nouveau module d’assignation Collecte / Formations (concept)

Pour éviter de surcharger les tables existantes, on introduit une table pivot conceptuelle :

- **Table candidate** : `public.programme_activity_assignments`
  - Colonnes principales :
    - `id uuid primary key default gen_random_uuid()`
    - `organization_id uuid not null references public.organizations(id) on delete cascade`
    - `programme_id uuid references public.programmes(id) on delete cascade`
    - `project_id uuid references public.projects(id) on delete cascade`
    - `activity_id uuid references public.project_activities(id) on delete cascade`
    - `project_task_id text` (clé texte vers la tâche relevant de l’assignation, si pertinente)
    - `kind text not null check (kind in ('collecte', 'formation'))`
    - `preset_key text not null` (clé déterminant la configuration collecte ou formation côté front)
    - `status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled'))`
    - `metadata jsonb not null default '{}'::jsonb` (paramètres additionnels, p.ex. filtre géographique, typologie de bénéficiaires)
    - `created_at timestamptz not null default now()`
    - `created_by uuid references auth.users(id) on delete set null`
  - RLS proposé :
    - Lecture et écriture autorisées aux utilisateurs de l’organisation (pattern similaire à `project_activities` / `budget_cascade_lines`).

Cette table ne stocke **pas** les données de collecte ou de formation elles‑mêmes ; elle décrit **qui doit faire quoi, où, quand, avec quel preset**, et sert d’ancrage pour :

- les événements d’assignation,
- les campagnes collecte et sessions de formation,
- les rapports et preuves rattachés dans les cockpits.

---

## 5. Vues budgétaires micro → macro

### 5.1 Principe général

- **Micro (tâche / activité)** :
  - Budget opérationnel au plus fin (`scope_level = 'activity'` ou `'task'`).
  - Lien facultatif vers une tâche structurée (`tasks.id`) ou JSON (`project_task_id`).
  - Preuves associées (documents, photos, rapports, notes) via :
    - `project_attachments`,
    - journaux d’activité (`coya_work_journal_summaries_proofs`),
    - `programme_actions` / `programme_action_assignees` (actions correctives / terrain).

- **Méso (projet)** :
  - Agrégats par projet à partir de `budget_cascade_lines` :
    - `sum(planned_amount)` et `sum(actual_amount)` où `project_id = ...`.
    - Ventilation par `expense_post_code` (poste de dépense).
  - UI : `ProjectObjectWorkspace` expose :
    - des KPIs budgétaires,
    - des vues par tâches / activités,
    - des liens vers documents justificatifs.

- **Macro (programme)** :
  - Agrégats consolidés dans `programme_cockpit_read_models.model` (via le projector `programme-cockpit-rebuild`) à partir de :
    - `programme_budget_lines` (budget high‑level),
    - `budget_cascade_lines` (cascade complète),
    - `expense_requests`, `programme_actions`, `project_activities`, etc.
  - UI : `ProgrammeModule` onglet `resume` consomme `ProgrammeCockpitReadModel` via `programmeCockpitService`.

### 5.2 UX cible par niveau

- **ProgrammeModule**
  - **Onglet `budget`** :
    - tableau des lignes budgétaires programme (`programme_budget_lines`),
    - résumé par poste de dépense (rollup par `expense_post_code`),
    - liens cliquables ouvrant les projets / activités les plus contributives.
  - **Onglet `projets_terrain`** :
    - hiérarchie Programme → Projets → Activités,
    - badges budgétaires (planned / actual / variance) par projet/activité, issus de `budgetRollupByScope`.

- **ProjectObjectWorkspace**
  - Bandeau cockpit :
    - budget projet (planned / actual / variance) via un read‑model projet (`buildProjectCockpitReadModel`),
    - statut d’alignement avec le programme (ex. % budget consommé vs programme).
  - Onglet `tasks` :
    - pour chaque tâche, surfaced budget (si `scope_level = 'task'` existe) et liens vers les preuves (pièces jointes, journal).

---

## 6. Extension Collecte et Formations

### 6.1 Pattern de navigation

- **Depuis un Programme**
  - Dans `ProgrammeModule` onglet `acteurs_collecte` :
    - boutons “**Lancer une collecte participants**” et “**Planifier une formation**”.
    - ces actions posent, dans `AppNavigationContext` :
      - `NAV_SESSION_COLLECTE_PRESET_PROGRAMME_ID = programme.id`,
      - `NAV_SESSION_COURSES_PROGRAMME_ID = programme.id`.
    - le module Collecte / Formations consomme ces valeurs pour filtrer les campagnes / sessions et préremplir les formulaires.

- **Depuis un Projet**
  - Dans `ProjectObjectWorkspace` (cockpit ou onglet `tasks`) :
    - action “**Collecte pour ce projet**” qui pousse `programme_id` + `project_id` + éventuellement `activity_id` dans une structure de navigation ou dans `metadata` de la future table `programme_activity_assignments`.
    - action “**Formation pour ce projet**” avec la même approche.

### 6.2 Pattern données & CRM

- **Collecte → CRM (existant)**
  - Les réponses collecte sont déjà normalisées via `utils/collecteParticipantFields.ts` (clés canoniques `last_name`, `first_name`, `gender`, etc.).
  - Les participants sont upsertés dans `public.contacts` avec :
    - `source = 'collecte'`,
    - `source_collection_id`, `source_submission_id`,
    - `organization_id`, `tags`, `notes`.
  - Les interactions ultérieures sont historisées dans `public.contact_dossier_items` (kinds `timeline`, `note`, `link`, `file`).

- **Extension proposée**
  - Ajouter, dans les payloads collecte, des champs **non persistés** côté front mais propagés dans `metadata` de `contact_dossier_items` :
    - `programme_id`,
    - `project_id`,
    - `activity_id`,
    - `project_task_id`,
    - `assignment_id` (`programme_activity_assignments.id`).
  - Avantage :
    - On évite d’étendre immédiatement `public.contacts`,
    - On garde la traçabilité fine programme/projet/activité/tâche au niveau du dossier CRM.

- **Formations**
  - Identique au pattern collecte :
    - les présences / inscriptions sont reliées à des `contacts`,
    - les événements “a participé à telle session liée à telle activité/tâche” sont stockés dans `contact_dossier_items` (kind `timeline`, `metadata` structuré).

### 6.3 Considérations RLS

- **Organisation** :
  - Toutes les nouvelles entités doivent porter `organization_id` et appliquer le pattern RLS standard :
    - vérification de `profiles.organization_id = organization_id` ou correspondance via `programme_id`/`project_id`.

- **Lien Collecte / CRM** :
  - Les policies existantes sur `contacts` et `contact_dossier_items` garantissent déjà l’isolation par organisation.
  - Toute nouvelle table (`programme_activity_assignments`) reprend cette logique :
    - aucune fuite cross‑tenant possible, même si des IDs de programmes/projets sont devinés.

---

## 7. Stratégie d’audit et event trail

### 7.1 Patrons existants à généraliser

- **Event store** (`domain_events` + tables associées) :
  - déjà utilisé pour le Programme Cockpit (`programme_cockpit_read_models.watermark_event_occurred_at`).
  - encode `aggregate_type`, `aggregate_id`, `occurred_at`, `payload`, `actor`.

- **Journal de travail & preuves**
  - `workforce_activity_events` et `coya_work_journal_summaries_proofs` tracent des événements terrain (RH / présence) et leurs preuves.

### 7.2 Chaîne d’audit cible Programme–Projet–Terrain–Collecte

Pour chaque niveau de la hiérarchie, les événements suivants doivent être systématiquement envoyés dans `domain_events` (ou un event store unifié) :

- **Programme**
  - `programme.created`, `programme.updated`, `programme.archived`.
  - `programme_budget_line.created/updated`, `programme_action.assigned/completed/not_realized`.

- **Projet**
  - `project.created`, `project.updated`, `project.status_changed`, `project.closed`.
  - `project_budget_line.updated` (via cascade ou lignes spécifiques).

- **Activité de terrain**
  - `project_activity.created/updated/status_changed`.
  - `project_activity.collecte_assigned`, `project_activity.training_assigned`.

- **Tâche**
  - `task.created`, `task.assigned`, `task.completed`, `task.auto_frozen` (aligné avec `applyProjectTasksAutoClose` et `projectTaskLifecycle`).

- **Collecte / Formations**
  - `collecte.assignment_created/completed`,
  - `formation.session_planned/completed`.

Chaque événement doit inclure :

- `organization_id`, `programme_id`, `project_id`, `activity_id`, `project_task_id`, `assignment_id` **si disponibles**.
- des métadonnées `evidence_refs` (IDs de `project_attachments`, `contact_dossier_items`, `storage.objects`) pour relier rapidement aux preuves.

Ces événements alimentent :

- le **Programme Cockpit** (via `programme-cockpit-rebuild`),
- un futur **Project Cockpit** (read‑model dédié),
- les écrans de type **Mission Control / Incident Center / M&E**.

---

## 8. Thèmes de migrations Supabase (proposées, non exécutées)

Les migrations suivantes sont proposées comme **canevas** à discuter / affiner avant implémentation. Les timestamps sont indicatifs.

### 8.1 Deltas hiérarchie & tâches

- `20260515120000_tasks_link_activity_fk.sql`
  - Ajout de `activity_id uuid references public.project_activities(id) on delete set null` sur `public.tasks`.
  - Indices sur `(organization_id, activity_id)` pour les requêtes d’agrégation terrain.
  - Mise à jour des policies RLS uniquement si nécessaire (alignement sur `organization_id`).

### 8.2 Enrichissement M&E sur la cascade budgétaire

- `20260515121000_budget_cascade_lines_me_extensions.sql`
  - Ajout des colonnes nullables `me_indicator_code`, `evidence_required`, `evidence_contact_id`.
  - Index sur `(programme_id, me_indicator_code)` pour les vues M&E programme.
  - Pas de modification RLS (la table est déjà gouvernée via l’organisation et `programmes`).

### 8.3 Assignations Collecte / Formations

- `20260515122000_programme_activity_assignments.sql`
  - Création de la table `public.programme_activity_assignments` (voir section 4.3) avec RLS basée sur `organization_id`.
  - Index :
    - `(organization_id, programme_id)`,
    - `(organization_id, project_id)`,
    - `(organization_id, activity_id)`,
    - `(organization_id, kind, status)`.

### 8.4 Alignement event trail

- `20260515123000_programme_project_events_alignment.sql`
  - Standardisation des valeurs `aggregate_type` dans `domain_events` pour qu’elles couvrent systématiquement :
    - `programme`, `project`, `project_activity`, `project_task`, `collecte_assignment`, `training_session`.
  - Ajout d’index par `aggregate_type` / `aggregate_id` si nécessaires pour les projections.

### 8.5 Extensions CRM / Collecte (optionnelles)

- `20260515124000_contact_dossier_metadata_alignment.sql`
  - Ajout de conventions de structure dans `contact_dossier_items.metadata` (contrats documentés, pas forcément enforced par SQL) :
    - clés réservées `programme_id`, `project_id`, `activity_id`, `project_task_id`, `assignment_id`.
  - Documentation du mapping dans les services backend et le code front (sérialisation/désérialisation).

---

## 9. Résumé exécutable (P0 / P1 / P2)

- **P0 (immédiat)**
  - Confirmer et exploiter la hiérarchie existante Programme → Projet → Activité → Tâche dans l’UI.
  - S’appuyer sur `budget_cascade_lines` + `programme_cockpit_read_models` pour les vues budget macro.
  - Ajouter des entrées de navigation Collecte / Formations depuis les contextes Programme et Projet.
  - Étendre doucement la publication d’événements vers `domain_events` / `coya_work_journal_summaries_proofs` pour les actions critiques.

- **P1 (6–12 semaines)**
  - Introduire le lien structuré `tasks.activity_id`.
  - Mettre en place `programme_activity_assignments` pour les assignations Collecte / Formations.
  - Enrichir la cascade budgétaire avec des métadonnées M&E.
  - Renforcer les cockpits Programme / Projet avec des agrégats multi‑niveaux et des alertes configurables.

- **P2 (12+ semaines)**
  - Brancher cette hiérarchie sur le moteur M&E et les exports bailleurs auditables (freeze + hash, run_id).
  - Industrialiser le reporting programme / projet (dashboards M&E, KPIs, vues comparatives).
  - Préparer l’intégration avec les modules stratégiques entreprise (objectifs, planification stratégique, monitoring d’impact global).

