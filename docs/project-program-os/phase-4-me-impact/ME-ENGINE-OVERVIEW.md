# PHASE 4 — M&E + Impact Engine (Overview)

## Objet

Cette phase définit la couche **M&E (Monitoring & Evaluation)** native du Project & Program OS COYA. Elle formalise :

- un **framework KPI** (définition, fréquence, désagrégation, méthode),
- un **moteur de formules** (contrat de calcul déclaratif),
- un **moteur d’agrégation / projections** (read-models pour tableaux de bord et reporting),
- des **packs bailleurs** (templates d’extraction + narration),
- des **règles qualité** et un **catalogue d’événements** cohérents avec l’outbox/offline-first.

## Principes (M&E natif)

- **Déclaratif d’abord** : un indicateur n’est pas un écran; c’est une **spécification** (définition + méthode + formule) exécutable et auditables.
- **Evidence-linked** : toute mesure significative doit pouvoir référencer une **preuve** (`evidence_items`) ou un chemin de preuve (document, registre, photo, procès-verbal).
- **Offline-first** : les mesures peuvent être saisies hors-ligne; la synchronisation doit être **idempotente** et traçable via outbox + événements.
- **Gouvernance explicite** : la production d’un rapport bailleur est un **artefact gouverné** (statuts, validations, gel des périodes, signatures).
- **Séparation write-side / read-side** : mesures (write) vs dashboards/rapports (read) via projections/agrégations.
- **Traçabilité** : toute agrégation est reproductible à partir des événements ou des mesures brutes; les transformations sont versionnées.

## Concepts — vocabulaire normalisé

### 1) Indicator / KPI

Un **indicateur** (`indicators`) est une définition de KPI (objectif de mesure) :

- **code** stable (ex. `TRN_COMPLETION_RATE`),
- définition, unité, périodicité, source,
- **désagrégations** attendues (genre, tranche d’âge, territoire, cohorte, etc.),
- **formule** (calcul) versionnée et exécutable (voir `INDICATOR-FORMULA-ENGINE.md`).

### 2) Baseline

La **baseline** est la valeur de référence initiale pour un indicateur, associée à un scope (programme/projet/territoire/cohorte) et une date.

- Elle n’est pas une “moyenne historique”, c’est un **point de départ** gouverné (méthode, source, preuve).
- Elle sert à calculer **progression** et **delta**.

### 3) Target

Un **target** (`indicator_targets`) est une cible assignée à un indicateur sur une période et un scope.

- Exemples : cible mensuelle, trimestrielle, annuelle; cumul à date; cible par territoire.
- Les cibles sont des objets gouvernés (auteur, date, hypothèses, validations).

### 4) Measurement

Une **measurement** (`indicator_measurements`) est une observation (valeur) d’indicateur à une date (ou fenêtre), pour un scope.

- Peut être **atomique** (collecte terrain) ou **agrégée** (calcul).
- Doit conserver : unité, méthode, source, précision, et **références de preuve**.

### 5) Cohort

Une **cohorte** est un ensemble cohérent d’unités d’analyse (bénéficiaires, organisations, sites) défini par un critère d’entrée (ex. “cohorte 2026-Q2 formation X”).

- Sert à analyser **progression**, rétention, insertion, impacts.
- Le contrat de formule doit permettre de filtrer par cohorte (voir moteur).

### 6) Evidence

Une **preuve** (`evidence_items`) est un artefact vérifiable : document, photo, liste signée, export SI, référence d’audit, etc.

- L’évidence se référence dans les mesures, et également dans les rapports.
- Les preuves doivent être classées et attachées à un scope (projet/programme/période).

### 7) Disaggregation (désagrégation)

La **désagrégation** est une dimension analytique obligatoire pour de nombreux bailleurs :

- sexe/genre, âge, handicap, statut socio-économique, territoire (région/département/commune), type de bénéficiaire, etc.
- Un indicateur doit déclarer ses désagrégations attendues et la règle de complétude.

## Scopes et liens avec programme / projet / territoire

L’invariant clé : **toute mesure/target/baseline a un scope explicite**.

- **Programme** : portefeuille thématique (ex. “Insertion jeunes”).
- **Projet** : unité d’exécution opérationnelle (activités, budget, livrables).
- **Territoire** : ancrage géographique (hiérarchie) utilisé pour filtrer, comparer et consolider.
- **Cohorte** : filtre transversal (indépendant du territoire) pouvant traverser plusieurs projets.

Recommandation de modélisation (contractuelle) :

- `scope.kind`: `program | project | territory | partner | cohort | org_unit`
- `scope.ids`: identifiants correspondants
- `scope.as_of`: date de référence pour la hiérarchie territoriale (si elle évolue)

## Invariants (contrats non négociables)

- **I1 — Unité cohérente** : une measurement doit déclarer une **unité** cohérente avec l’indicateur.
- **I2 — Fenêtre temporelle explicite** : `as_of` (date) ou `[start, end)` (période) doit être présent.
- **I3 — Traçabilité** : toute measurement doit posséder `source` et, si collectée, au moins un lien “évidence” ou une justification.
- **I4 — Désagrégation contrôlée** : une measurement ne peut pas inventer une dimension; elle doit respecter le set autorisé de l’indicateur.
- **I5 — Idempotence sync** : chaque mesure offline doit porter une clé idempotente stable (ex. `client_id + local_ulid`) et ne doit pas dupliquer lors des retries.
- **I6 — Auditabilité** : un rapport bailleur doit pointer vers une **version gelée** des chiffres (snapshot / run_id) + evidence.
- **I7 — Séparation des responsabilités** : write-side = saisie/validation; read-side = projection/agrégation; les dashboards ne recalculent pas “à la volée” sans run_id.

## Gouvernance (validation finale des rapports)

### Rôles (minimum)

- **Contributor terrain** : saisit/importe des mesures (offline possible).
- **M&E Officer** : contrôle qualité, corrige, consolide, propose cibles/baselines.
- **Programme Manager** : valide les chiffres et le narratif sur son scope.
- **Data Steward / Compliance** : valide la conformité (désagrégations, preuves, audit trail).
- **Approver final** : gèle et publie le pack bailleur.

### States recommandés (artefacts M&E)

- Measurement : `draft → submitted → validated → rejected`
- Report pack : `draft → in_review → approved → frozen → published`

Ces statuts doivent être matérialisés via événements (voir `EVENT-CATALOG-ME.md`) et intégrés à l’outbox.

## Offline-first & sync (résumé d’implémentation)

- Les clients créent des événements `measurement.created/updated/submitted` en local.
- À la sync, le backend applique des **upserts idempotents**, émet des événements “accepted/rejected”.
- Les corrections se font via nouveaux événements (pas de suppression silencieuse), afin de conserver l’audit trail.

## Deliverables de PHASE 4

- `KPI-FRAMEWORK.md`
- `INDICATOR-FORMULA-ENGINE.md`
- `AGGREGATION-ENGINE.md`
- `DONOR-REPORT-TEMPLATES.md`
- `DATA-QUALITY-RULES.md`
- `EVENT-CATALOG-ME.md`

## Acceptance Criteria (mini)

- **AC1** : Chaque concept (baseline/target/measurement/evidence/disaggregation/cohort) est défini avec invariants et implications offline-first.
- **AC2** : Les scopes programme/projet/territoire/cohorte sont explicités et utilisables dans les contrats de formule et d’agrégation.
- **AC3** : La gouvernance (rôles + statuts) couvre la **validation finale** des rapports et le gel des périodes (snapshot/run_id).
- **AC4** : Les invariants I1–I7 peuvent être traduits en règles de validation et en événements (cf. `DATA-QUALITY-RULES.md`, `EVENT-CATALOG-ME.md`).
