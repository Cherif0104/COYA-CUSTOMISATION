# KPI Framework — M&E + Impact Engine (PHASE 4)

## Objet

Ce document définit le **contrat KPI** (indicator) de COYA : structure minimale, attributs normatifs, règles de désagrégation et exemples concrets ONG/bailleurs. Le but est d’avoir des indicateurs **exécutables**, **auditables**, compatibles **offline-first** et **gouvernance** (validation finale des rapports).

## 1) Modèle conceptuel KPI (canon)

Un KPI est un triplet contractuel :

- **Définition** (ce que l’on mesure),
- **Méthode** (comment on mesure, sources, périmètre),
- **Calcul** (formule exécutable + règles d’agrégation).

Les tables PHASE 1 visées : `indicators`, `indicator_targets`, `indicator_measurements`, `evidence_items`.

## 2) Structure normative d’un KPI (`indicators`)

### Champs d’identification

- **`code`** (obligatoire, stable) : identifiant sémantique unique, versionné au besoin par `revision`.
  - Convention : `DOMAIN_SUBDOMAIN_METRIC[_QUALIFIER]` (ex. `TRN_COMPLETION_RATE`, `EMP_PLACEMENTS_3M`).
- **`name`** (obligatoire) : libellé court.
- **`definition`** (obligatoire) : définition précise (unité d’analyse, inclusions/exclusions).
- **`domain`** (recommandé) : `training | employment | coverage | outcome | impact | finance | ops`.

### Champs d’unité & fréquence

- **`unit`** (obligatoire) : ex. `people`, `sessions`, `%`, `ratio`, `hours`, `currency:XOF`.
- **`frequency`** (obligatoire) : `daily | weekly | monthly | quarterly | yearly | event_based`.
- **`time_window_default`** (recommandé) : fenêtre par défaut utilisée par le calcul (ex. `monthly`).

### Champs méthode / source / qualité

- **`source`** (obligatoire) : provenance de la mesure (ex. `field_form`, `sis_export`, `partner_report`, `system_event`, `survey`).
- **`method`** (obligatoire) : protocole de mesure (outil, calcul, population, période, seuils, biais connus).
- **`evidence_policy`** (recommandé) :
  - `required: boolean`
  - `types_allowed: string[]` (ex. `attendance_sheet`, `photo`, `signed_list`, `export_csv`, `invoice`)

### Champs scope & désagrégation

- **`scopes_allowed`** (obligatoire) : `program | project | territory | partner | cohort | org_unit`.
- **`disaggregation`** (obligatoire) : dimensions autorisées et attendues.
  - Exemple : `["gender", "age_group", "territory", "cohort"]`
- **`disaggregation_completeness`** (recommandé) :
  - `rule`: `none | required | required_for_reporting`
  - `min_coverage_ratio`: ex. `0.95` (95% des valeurs doivent être catégorisées)

### Champs calcul & versioning

- **`formula`** (recommandé si calculable) : contrat JSON du moteur de formules (voir `INDICATOR-FORMULA-ENGINE.md`).
- **`revision`** (obligatoire) : entier incrémental; changement de méthode/formule ⇒ nouvelle revision.
- **`effective_from` / `effective_to`** : bornes de validité (ex. changement bailleur).

## 3) Mesures (`indicator_measurements`) — contrat d’observation

Une mesure est une observation datée ou fenêtrée d’un KPI.

Champs contractuels (minimum) :

- **`indicator_id`** : référence.
- **`value`** : nombre; `null` interdit en “validated”.
- **`unit`** : doit matcher l’unité KPI.
- **`time`** : `as_of` OU `start_at/end_at` (fenêtre \([start, end)\)).
- **`scope`** : kind + ids (programme/projet/territoire/cohorte…).
- **`dimensions`** : dictionnaire de désagrégation (ex. `gender=F`, `age_group=15_24`).
- **`source`**, **`method_version`** : traçabilité.
- **`evidence_refs`** : références vers `evidence_items` (ou pointeurs).
- **`status`** : `draft | submitted | validated | rejected`.
- **`client_idempotency_key`** : clé stable pour offline + retries.

Notes :

- Une measurement “agrégée” doit porter `computed_by` (ex. `aggregation_engine`) et `run_id`.
- Une measurement terrain peut être corrigée via événements (voir `EVENT-CATALOG-ME.md`) sans écraser l’historique.

## 4) Cibles (`indicator_targets`) — contrat d’objectif

Une cible est un engagement de performance.

Champs contractuels (minimum) :

- **`indicator_id`**
- **`target_value`**
- **`unit`**
- **`period`** : `start_at/end_at`
- **`scope`**
- **`target_type`** : `absolute | rate | cumulative_to_date`
- **`assumptions`** : texte court (hypothèses) + evidence optionnelle
- **`status`** : `draft | approved | superseded`

## 5) Exemples KPI (ONG / bailleur) — concrets et exécutables

Les exemples ci-dessous sont formulés pour être implémentables avec :

- mesures terrain offline (ex. listes de présence),
- import SI (ex. placements),
- calculs dérivés via moteur de formules,
- désagrégations standard bailleurs.

### Exemple A — Formation : taux d’achèvement

- **Code** : `TRN_COMPLETION_RATE`
- **Définition** : proportion de participants inscrits ayant terminé la formation (critère de complétion défini dans la méthode) sur la période.
- **Unité** : `%`
- **Fréquence** : `monthly`
- **Source** : `field_form` + registre
- **Méthode** :
  - Numérateur = # participants “completed” (présence + évaluations minimales) sur la période.
  - Dénominateur = # participants “enrolled” sur la période.
  - Exclusion : abandons administratifs hors période.
- **Désagrégations** : `gender`, `age_group`, `territory`, `cohort`
- **Evidence** : `attendance_sheet` requis; `photo` optionnel
- **Cible (ex.)** : ≥ 85% mensuel par centre (territory) et cohorte.

### Exemple B — Insertion : placements à 3 mois

- **Code** : `EMP_PLACEMENTS_3M`
- **Définition** : nombre de bénéficiaires en emploi (formel ou informel selon méthode) 3 mois après fin de formation/cohorte.
- **Unité** : `people`
- **Fréquence** : `monthly`
- **Source** : `survey` + `partner_report`
- **Méthode** :
  - Fenêtre : cohorte dont `end_date` = mois M-3; observation à M.
  - Justification (evidence) : contrat, attestation employeur, auto-déclaration + vérification échantillon.
- **Désagrégations** : `gender`, `age_group`, `territory`, `disability_status`
- **Notes** : KPI souvent bailleur “haute criticité” ⇒ règles DQ renforcées (outliers, preuves).

### Exemple C — Couverture : bénéficiaires servis (reach)

- **Code** : `SRV_UNIQUE_BENEFICIARIES`
- **Définition** : nombre de bénéficiaires uniques servis sur la période (déduplication selon identifiant bénéficiaire).
- **Unité** : `people`
- **Fréquence** : `monthly`
- **Source** : `system_event` (enregistrement service) + import
- **Méthode** :
  - Compter les `beneficiary_id` distincts avec au moins un service délivré dans la fenêtre.
  - Déduplication cross-projets si `scope.kind=program`.
- **Désagrégations** : `gender`, `age_group`, `territory`

### Exemple D — Progression : gain de score (pré/post)

- **Code** : `TRN_SCORE_DELTA_AVG`
- **Définition** : moyenne du gain de score entre pré-test et post-test pour une cohorte.
- **Unité** : `points` (ou `ratio` si normalisé)
- **Fréquence** : `quarterly`
- **Source** : `field_form` / tests
- **Méthode** :
  - \( \Delta = score\_post - score\_pre \)
  - Agrégation : moyenne par cohorte puis consolidation programme.
  - Gestion des valeurs manquantes : voir règles DQ.
- **Désagrégations** : `gender`, `territory`, `cohort`
- **Evidence** : feuilles de tests / exports.

## 6) Désagrégation — recommandations bailleurs

Dimensions fréquentes :

- **Genre** : `F | M | X | unknown` (et règle de couverture).
- **Âge** : groupes configurables (ex. `15_24`, `25_35`, `36_plus`).
- **Territoire** : hiérarchie (région → département → commune → site).
- **Vulnérabilité** : handicap, déplacé, etc. (selon bailleur).

Règle : si un KPI déclare une désagrégation “required_for_reporting”, un pack bailleur ne peut pas être “approved” si la couverture est < `min_coverage_ratio`.

## 7) Mapping KPI → tables PHASE 1 (rappel)

- `indicators` : définition KPI + `formula`.
- `indicator_targets` : cibles, hypothèses, validations.
- `indicator_measurements` : observations terrain ou calculées.
- `evidence_items` : preuves, classées et référencées.

## Acceptance Criteria (mini)

- **AC1** : Le contrat KPI spécifie au minimum `code`, `definition`, `unit`, `frequency`, `source`, `method`, `disaggregation`, `scopes_allowed`, `revision`.
- **AC2** : Les exemples fournis (formation, insertion, couverture, progression) sont exprimés avec unité, fréquence, méthode, evidence, désagrégation.
- **AC3** : Les champs nécessaires à l’offline-first sont explicités (clé idempotente, statuts, evidence refs).
- **AC4** : La notion de versioning (`revision`, `effective_from/to`) est définie pour auditabilité bailleur.
