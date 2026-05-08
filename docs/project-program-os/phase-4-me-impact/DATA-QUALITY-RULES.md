# Data Quality Rules — M&E (PHASE 4)

## Objet

Ce document définit les **règles de qualité** appliquées aux mesures M&E (`indicator_measurements`) et aux packs bailleurs, ainsi que les workflows de correction et la gestion d’incidents qualité.

Contraintes couvertes :

- **offline-first** (saisie hors-ligne + sync + retries),
- **audit** (preuves, traçabilité des corrections),
- **gouvernance** (gates avant approbation/gel des rapports).

## 1) Terminologie

- **Validation** : contrôles automatiques et/ou humains pour passer une mesure en `validated`.
- **Correction** : modification justifiée d’une mesure (nouvel événement + trail).
- **Incident qualité** : problème impactant la fiabilité (outliers, incohérences, manques massifs) avec suivi et résolution.
- **Gate** : règle bloquante pour `approved/frozen` sur un pack.

## 2) Règles DQ — catégories

### DQ-A — Validité de schéma (hard)

S’applique à toute measurement `draft/submitted/validated`.

- **A1 (required fields)** : `indicator_id`, `value`, `unit`, `time`, `scope`, `source`, `status`.
- **A2 (unit match)** : `measurement.unit` doit correspondre à `indicator.unit`.
- **A3 (time semantics)** : `as_of` XOR (`start_at` + `end_at`), et `start_at < end_at`.
- **A4 (scope allowed)** : `scope.kind` doit être dans `indicators.scopes_allowed`.
- **A5 (dimension allowed)** : seules dimensions déclarées dans `indicator.disaggregation` autorisées.
- **A6 (idempotency key)** : `client_idempotency_key` obligatoire dès `submitted` (offline-safe).

Action :

- A* violée ⇒ `measurement.rejected` (avec raisons), aucune projection “reporting”.

### DQ-B — Plages & valeurs aberrantes (soft/hard selon KPI)

- **B1 (non-negative)** : certains KPIs ne peuvent pas être négatifs (people, sessions).
- **B2 (rate range)** : KPI unit `%` ou `ratio` doit être dans \([0, 1]\) ou \([0, 100]\) selon convention.
- **B3 (outlier detection)** :
  - règle simple : \(value > mean + k \cdot std\) (k configurable) par scope/période,
  - ou règle domain : `max_expected_per_day` etc.

Action :

- B1/B2 violée ⇒ rejet (hard).
- B3 détectée ⇒ `dq.flagged_outlier` (incident) + blocage pack si KPI critique.

### DQ-C — Complétude (coverage) (gate pour reporting)

Dimensions (désagrégation) :

- **C1** : couverture ≥ `indicator.disaggregation_completeness.min_coverage_ratio` si `required_for_reporting`.
- **C2** : “unknown” limité (ex. max 5%) si bailleur l’exige.

Mesures :

- **C3** : présence d’au moins une mesure validée par KPI/period/scope pour les KPIs obligatoires du pack.

Action :

- si `required_for_reporting` non satisfaite ⇒ pack ne peut pas passer `approved`.

### DQ-D — Cohérence interne (cross-checks)

Exemples :

- **D1 (numerator <= denominator)** : pour un KPI `rate`.
- **D2 (monotonic cumulative)** : cumul à date ne diminue pas sans correction justifiée.
- **D3 (subtotals <= total)** : somme des sous-groupes ne dépasse pas le total (tolérance).
- **D4 (targets sanity)** : target plausible vs baseline/historique (alerte).

Action :

- violation ⇒ incident `dq.inconsistency_detected` + demande de correction / override signé.

### DQ-E — Evidence & auditability (gate)

Pour KPIs “haute criticité” (placements, dépenses, listes signées…) :

- **E1** : evidence requise (`indicator.evidence_policy.required=true`).
- **E2** : type evidence autorisé (liste blanche).
- **E3** : evidence horodatée et liée au scope/période.

Action :

- E* manquante ⇒ blocage pack “approved/frozen” ou dérogation signée (“waiver”) enregistrée.

## 3) Workflow de correction

### 3.1 États measurement

- `draft` : saisie locale; validations minimales.
- `submitted` : prêt pour revue; idempotency key exigée.
- `validated` : passe les contrôles + approbation M&E si requis.
- `rejected` : invalidée; nécessite correction ou justification.

### 3.2 Patterns de correction (audit-friendly)

Règles :

- pas de “delete silencieux” en production; corrections traçées,
- une correction crée un nouvel événement (et potentiellement une nouvelle version de mesure).

Patterns :

- **Correct value** : `measurement.corrected` avec `previous_measurement_id`, `reason_code`, `evidence_ref`.
- **Correct dimensions** : correction de désagrégation (genre/âge/territoire) via événement.
- **Override** : autoriser une valeur hors plage avec justification + signature (rare).

## 4) Incidents qualité (DQ incidents)

### 4.1 Modèle minimal d’incident

Un incident qualité doit référencer :

- `incident_id` (ULID)
- `severity`: `low | medium | high | critical`
- `category`: `outlier | missingness | inconsistency | evidence_gap | sync_conflict`
- `scope` + `window`
- `indicator_code` (optionnel) + liste de measurements impactées
- `status`: `open | mitigated | resolved | waived`
- `owner` (Data Steward / M&E Officer)
- `created_at`, `resolved_at`
- `actions_taken[]` (liens vers corrections, waivers, reruns)

### 4.2 Impact sur reporting (gates)

Règles contractuelles :

- `critical` ouvert ⇒ aucun pack gelé (`frozen`) sur le scope/période.
- `high` ouvert ⇒ gel possible uniquement avec waiver compliance + evidence.
- `medium/low` ⇒ gel possible mais warning dans annexes.

## 5) Sync offline-first : conflits & qualité

Cas typiques :

- doublons (retries) ⇒ résolus par `client_idempotency_key` (dedupe).
- modifications concurrentes ⇒ créer incident `dq.sync_conflict` + résolution manuelle.

Le système doit produire des événements :

- `dq.duplicate_detected`, `dq.sync_conflict`, `dq.validation_failed`.

## 6) Exemples de règles concrètes (ONG/bailleur)

- **Formation** : complétion > inscrits ⇒ incohérence (D1/D3).
- **Insertion** : placements mensuels > reach mensuel ⇒ incohérence (D4).
- **Couverture** : `unknown gender` > 10% ⇒ blocage pack si bailleur impose 95% coverage (C1/C2).

## Acceptance Criteria (mini)

- **AC1** : Les règles DQ sont structurées par catégories (schéma, outliers, complétude, cohérence, evidence) avec actions (reject/flag/gate).
- **AC2** : Le workflow de correction préserve l’audit trail (événements de correction, pas de suppression silencieuse).
- **AC3** : Un modèle d’incident qualité minimal est défini + impact clair sur approbation/gel des packs.
- **AC4** : Les cas offline-first (doublons, conflits) sont couverts par règles et événements DQ.
