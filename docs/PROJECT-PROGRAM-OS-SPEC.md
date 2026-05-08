# COYA — Project & Program OS — Canonical Specification
Version: 1.0  
Runtime: ONG / Institutions / Programmes / Territoires / Hubs / Écosystèmes  
Positionnement: **Operating System** (gouvernance + opérations + contrôle + intelligence)

---

## 1) Résumé (1 page)

Le module **Project & Program OS** est le **système nerveux opérationnel** de l’organisation.  
Il orchestre programmes → projets → composantes → activités → missions, avec :

- **Gouvernance**: responsabilités, validations, audit trail, décisions.
- **Opérations terrain**: planification, exécution, offline-first, synchronisation.
- **Impact & M&E**: indicateurs natifs, baseline/targets, preuves, dashboards.
- **Conformité bailleurs**: budgets, justificatifs, règles, exports, audits.
- **Intelligence**: reporting augmenté, détection anomalies, recommandations.

Le module doit **ressembler à un centre de commandement**, pas à un Kanban simpliste.

---

## 2) Architecture logique (engines)

```txt
Project & Program OS
 ├── Governance Engine        (rôles, validations, décisions, comités)
 ├── Workflow Engine          (états, transitions, règles, historisation)
 ├── Activity Engine          (activités, calendriers, affectations)
 ├── Mission Engine           (ordre de mission, exécution terrain, incidents)
 ├── Budget Engine            (budgets, lignes, dépenses, justificatifs)
 ├── M&E Engine               (indicateurs, cibles, cohortes, preuves)
 ├── Beneficiary Engine       (bénéficiaires, parcours, participation)
 ├── Territorial Engine       (pays→région→département→commune→village→hub)
 ├── Partner Engine           (bailleurs, partenaires, conventions, accès)
 ├── Incident Engine          (alertes, criticité, résolution, capitalisation)
 ├── Document Engine          (versioning, signature, archivage, traçabilité)
 ├── Reporting Engine         (rapports, exports, tableaux de bord)
 ├── Notification Engine      (email/SMS/WA/push, escalades)
 ├── Knowledge Engine         (leçons apprises, templates, playbooks)
 └── AI Engine                (rédaction, détection, recommandations, analytics)
```

---

## 3) Entités métier (canon)

### 3.1 Hiérarchie

```txt
Organisation
  └── Programme
        └── Projet
              └── Composante (optionnelle)
                    └── Activité
                          └── Mission
                                └── Exécution / Reporting / Évaluation / Archivage
```

### 3.2 Core entities (définition)

- **Program**: conteneur stratégique (financements, territoires, KPIs, gouvernance).
- **Project**: unité opérationnelle (activités, missions, ressources, reporting).
- **Device / Dispositif**: hub/centre/antenne/incubateur/pôle/comité.
- **Activity**: formation/atelier/coaching/sensibilisation/réunion/évaluation…
- **Mission**: unité terrain (équipe, déplacement, dépenses, incidents, rapports).
- **Beneficiary**: bénéficiaire (jeune, femme, entrepreneur, association, PME…).
- **Partner**: bailleur/ONG/ministère/agence/institution/collectivité.
- **Indicator**: indicateur M&E (baseline, target, preuves, calcul, fréquence).
- **Incident**: événement anormal (retard, dépassement budget, conflit, blocage…).
- **Document**: TDR, convention, PV, rapport, budget, justificatif, feuille présence…

---

## 4) Modèle de données (minimum viable, extensible)

> Objectif: un schéma relationnel solide (PostgreSQL), avec RLS multi-tenant, audit trail,
> et des extensions JSONB uniquement quand justifié (ex: pièces jointes, métadonnées).

### 4.1 Tables (proposées)

#### Organisations & accès
- `organizations` (déjà existante)
- `profiles` (déjà existante)
- `org_memberships` (si multi-org réel; sinon garder le modèle actuel “org unique”)

#### Programme / Projet / Structure
- `programs`
- `projects`
- `project_components` (optionnel)
- `devices` (dispositifs / hubs / centres)
- `territories` (arbre territorial)
- `program_territories` (m:n)
- `project_territories` (m:n)
- `program_partners` (m:n)
- `project_partners` (m:n)

#### Opérations terrain
- `activities`
- `missions`
- `mission_team_members`

#### Finance & conformité
- `budgets` (niveau programme/projet)
- `budget_lines`
- `expenses`
- `expense_approvals`

#### Documents & preuves
- `documents`
- `document_versions`
- `entity_documents` (liaison polymorphe: programme/projet/activité/mission/dépense)

#### M&E (natif)
- `indicators`
- `indicator_targets` (par période / par territoire / par cohorte)
- `indicator_measurements` (valeurs observées)
- `cohorts` (optionnel)
- `evidence_items` (preuves: doc, photo, présence, geo-tag…)

#### Incidents & capitalisation
- `incidents`
- `incident_actions`
- `knowledge_items` (retours d’expérience, bonnes pratiques, playbooks)

#### Workflow, audit, notifications
- `workflows` (définition)
- `workflow_states`
- `workflow_transitions`
- `workflow_instances` (lié à une entité)
- `workflow_events` (journal d’exécution)
- `audit_logs` (journal transversal)
- `notifications`
- `outbox_events` (pattern outbox pour événements fiables)

### 4.2 Champs clés (conventions)

Chaque table “métier” doit inclure:
- `id` (uuid), `organization_id`
- `created_at`, `updated_at`
- `created_by`, `updated_by` (uuid profile/auth.user)
- `status` (enum ou texte contrôlé)
- `archived_at` (nullable) pour “soft archive”

### 4.3 Isolation & sécurité (RLS)

Règles minimales:
- **Isolation**: `organization_id` obligatoire et filtré par RLS.
- **Auditabilité**: toutes les actions importantes écrivent dans `audit_logs`.
- **Documents**: accès dérivé de l’entité liée + restrictions “bailleur/partenaire”.

---

## 5) RBAC + ABAC (contrat)

> Le système combine **RBAC** (rôle) + **ABAC** (attributs: territoire, programme, projet, équipe, partenaire).

### 5.1 Rôles (niveau OS)
- `super_admin`
- `program_director`
- `project_manager`
- `regional_coordinator`
- `field_officer`
- `me_officer`
- `finance_officer`
- `partner`
- `auditor`
- `beneficiary`

### 5.2 Attributs ABAC (exemples)
- `territory_scope`: liste de territoires autorisés (ou “all”)
- `program_scope`: programmes autorisés
- `project_scope`: projets autorisés
- `partner_scope`: partenaires autorisés (pour portail)
- `device_scope`: dispositifs autorisés
- `approval_limit`: seuil validation dépense

### 5.3 Matrice de permissions (exécutable)

Actions minimales (alignées à votre matrice):
- Programme: `create_program`, `update_program`, `validate_program`
- Projet: `create_project`, `close_project`
- Activité: `create_activity`, `validate_activity`
- Ressources: `assign_resource`
- Finance: `validate_expense`
- Reporting: `publish_report`
- Data: `view_analytics`, `export_data`
- Admin: `manage_users`
- Incidents: `manage_incidents`

Décision ABAC = f(role, action, entity.attributes, user.attributes).

---

## 6) Règles de gestion (hard rules)

- **Aucun projet sans**: programme parent, responsable, budget, workflow, KPIs.
- **Aucune activité sans**: responsable, territoire, calendrier, chaîne de validation.
- **Aucune dépense sans**: justificatif, approbation, ligne budgétaire.
- **Tout document**: versionné, horodaté, traçable, audit-loggable.
- **Tout workflow**: configurable, historisé, réversible, observable.

---

## 7) Workflows (référence)

### 7.1 Workflow standard (Programme/Projet)

```txt
Draft
 → Review
 → Validation
 → Funding
 → Planning
 → Deployment
 → Execution
 → Monitoring
 → Reporting
 → Evaluation
 → Closure
 → Archiving
```

### 7.2 Workflow Activité terrain

```txt
Création activité
 → affectation équipe
 → validation région
 → validation finance
 → génération ordre mission
 → déploiement
 → exécution
 → collecte données
 → upload justificatifs
 → rapport
 → validation finale
 → archivage
```

### 7.3 Workflow Incident

```txt
Incident détecté
 → catégorisation
 → niveau criticité
 → affectation
 → résolution
 → validation
 → capitalisation
```

---

## 8) UX / UI — “Program Detail” (centre de commandement)

> Objectif: dépasser la page “projet” ERP classique.

### 8.1 Header stratégique (obligatoire)
Affiche:
- nom, statut
- bailleurs & partenaires clés
- budget (engagé / consommé / restant)
- couverture territoriale
- KPIs (top 5)
- score santé + niveau risque
- timeline (start/end + jalons)

### 8.2 Vues / onglets (minimum)
- **Synthèse**: Budget, Progression, Activités, Impact, Risques, Régions, Partenaires, Bénéficiaires
- **Structure ONG**: coordination → régions → pôles → départements → dispositifs
- **Carte**: activités/missions/incidents/devices géolocalisés (mode offline-friendly)
- **Impact**: dashboards M&E (baseline/targets, cohortes, preuves)
- **Timeline**: événements (validations, missions, incidents, rapports)
- **Gouvernance**: validations, responsables, workflows, niveaux décisionnels
- **Documents**: conventions, PV, justificatifs, audits, exports
- **Incidents**: alertes, blocages, dépassements, retards, conflits

### 8.3 Principes d’interface (contrat)
- **Hiérarchique**: l’utilisateur navigue Programme → Projet → Activité → Mission
- **Territoriale**: les vues et filtres partent du territoire
- **Analytique**: métriques/heatmaps/tendances en première classe
- **Événementielle**: timeline + journal des événements (observabilité fonctionnelle)

---

## 9) Offline-first (terrain) — exigences

### 9.1 Capacités
- Consultation des programmes/projets/activités assignés **offline**
- Création d’activité / mission / collecte mesures / incident **offline**
- Upload différé des pièces (photos, signatures, feuilles présence)
- **Synchronisation différée** + résolution de conflits (server-wins configurable)
- Mode dégradé (lecture seule si intégrité non garantie)

### 9.2 Stratégie (principes)
- Stockage local chiffré (cache + queue d’actions)
- “Outbox” locale (actions à rejouer) + idempotence côté serveur
- Horodatage + versioning des entités synchronisées

---

## 10) IA — “AI Assisted Operations” (contrat)

### 10.1 Génération
- rapports, TDR, comptes rendus, synthèses (avec citations des données internes)

### 10.2 Détection
- anomalies (données M&E incohérentes), retards, dépassements, risques

### 10.3 Recommandation
- réaffectations ressources, optimisations planning, arbitrages budgétaires

### 10.4 Analyse
- performance, impact, risques financiers, qualité données

> Règle: aucune action automatisée irréversible sans validation humaine (workflow).

---

## 11) Reporting & conformité bailleurs

### 11.1 Exports
- Exports structurés (CSV/XLSX/JSON) par programme/projet/territoire/période
- Exports “bailleur pack” (documents + indicateurs + audit trail + budget)

### 11.2 Auditabilité
- Signature/validation des rapports
- Archivage immuable (WORM recommandé) pour versions finales

---

## 12) Performance & scalabilité (cibles)

- activités massives, milliers de bénéficiaires, multi-régions
- temps réel (notifications & incidents critiques)
- faible connectivité (offline-first + sync progressive)

Guidelines:
- indexation par `organization_id`, `program_id`, `project_id`, `territory_id`, `status`, `created_at`
- requêtes paginées, agrégations pré-calculées si nécessaire (materialized views / jobs)

---

## 13) Contrat API (backend) — ressources & événements

### 13.1 Ressources REST/GraphQL (conceptuel)
- `/programs`, `/projects`, `/activities`, `/missions`
- `/budgets`, `/expenses`
- `/indicators`, `/measurements`
- `/incidents`
- `/documents`
- `/workflows` (definitions + instances)

### 13.2 Événements (pub/sub)
Événements clés (outbox → bus):
- `program.created`, `program.validated`
- `project.created`, `project.closed`
- `activity.validated`
- `mission.deployed`, `mission.completed`
- `expense.submitted`, `expense.approved`
- `indicator.measurement.created`
- `incident.raised`, `incident.resolved`
- `document.version.created`

---

## 14) Roadmap (MVP → V1)

### MVP (pilot terrain)
- Program/Project/Activity/Mission (CRUD + workflows simples)
- Budget + dépenses + justificatifs + validations
- M&E minimal: indicateurs + mesures + dashboard synthèse
- Program Detail (Synthèse + Timeline + Documents + Incidents)
- Notifications critiques (email + in-app)
- Offline-first: lecture + collecte + sync différée (scope réduit)

### V1 (Operating System complet)
- ABAC complet (territoire/programme/projet) + portail partenaire
- Carte + heatmaps + analytics avancés
- Knowledge Engine + templates + capitalisation incidents
- IA: génération rapports + détection risques + recommandations
- Pack conformité bailleurs (exports + archivage + signatures)

---

## 15) “Prompt Master” (pour agent IA de build)

Copier/coller ce bloc pour un agent d’implémentation:

```txt
Objectif: Implémenter le module COYA “Project & Program OS” comme Operating System (gouvernance + opérations + M&E + conformité).

Contraintes:
- UI = centre de commandement, hiérarchique/territorial/analytique/événementiel (pas Trello).
- RLS multi-tenant par organization_id, audit trail systématique.
- RBAC + ABAC (territoire/programme/projet/partenaire), validations workflow.
- Offline-first terrain: outbox, sync différée, idempotence.

Livrables:
- Modèle de données (Postgres) + policies RLS.
- API resources + événements outbox.
- Pages: Program Detail (tabs: Synthèse, Carte, Impact, Timeline, Gouvernance, Documents, Incidents).
- M&E natif (indicateurs, targets, mesures, preuves).
- Budget/dépenses/justificatifs + validations.
```

