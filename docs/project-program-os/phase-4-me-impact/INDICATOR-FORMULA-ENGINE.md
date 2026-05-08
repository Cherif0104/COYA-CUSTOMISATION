# Indicator Formula Engine — contrat (PHASE 4)

## Objet

Ce document définit le **contrat du moteur de formules** pour calculer des indicateurs à partir de sources (mesures brutes, événements, tables métier) en restant :

- **déclaratif** (spécification stockée dans `indicators.formula`),
- **auditables** (versioning, run_id, reproductibilité),
- **offline-first compatible** (fenêtres temporelles explicites + idempotence),
- **cohérent gouvernance** (gel/snapshot pour reporting).

La formule doit être portable entre :

- **calcul batch** (extractions périodiques, backfills),
- **calcul streaming** (projections incrémentales à partir d’événements),
sans changer sa sémantique.

## 1) Règles contractuelles

- **R1 — Pure function** : une formule doit être **déterministe** pour un input (période, scope, filtres) donné. Pas d’accès “implicite” à l’horloge.
- **R2 — Fenêtre obligatoire** : toute exécution de formule fournit une fenêtre `window` (as_of ou interval).
- **R3 — Scope explicite** : toute exécution fournit un `scope` (program/project/territory/cohort…).
- **R4 — Désagrégation contrôlée** : la formule peut produire des séries par dimensions autorisées uniquement.
- **R5 — Idempotence** : un calcul doit être identifiable par `run_id` et `input_hash` (ou équivalent) pour éviter doublons.
- **R6 — Audit** : la formule doit déclarer ses **dépendances** (sources, champs) pour traçabilité.

## 2) Contrat `indicators.formula` — JSON (canon)

La propriété `indicators.formula` est un objet JSON conforme au schéma ci-dessous (contractuel). Il n’impose pas l’implémentation, seulement les invariants et la surface.

### 2.1 JSON Schema (draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "coya://schemas/me/indicator-formula.schema.json",
  "title": "COYA Indicator Formula",
  "type": "object",
  "required": ["version", "type", "output"],
  "additionalProperties": false,
  "properties": {
    "version": { "type": "string", "pattern": "^1\\.[0-9]+$" },
    "type": {
      "type": "string",
      "enum": ["sum", "count", "rate", "weighted", "derived"]
    },
    "description": { "type": "string" },
    "output": {
      "type": "object",
      "required": ["unit"],
      "additionalProperties": false,
      "properties": {
        "unit": { "type": "string" },
        "value_type": { "type": "string", "enum": ["number"] },
        "precision": { "type": "integer", "minimum": 0, "maximum": 8 }
      }
    },
    "windowing": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "mode": { "type": "string", "enum": ["as_of", "interval"] },
        "timezone": { "type": "string" },
        "default_granularity": {
          "type": "string",
          "enum": ["daily", "weekly", "monthly", "quarterly", "yearly"]
        }
      }
    },
    "group_by": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Dimensions de désagrégation (ex. gender, age_group, territory, cohort)"
    },
    "filters": {
      "type": "array",
      "items": { "$ref": "#/$defs/filter" }
    },
    "source": { "$ref": "#/$defs/source" },
    "numerator": { "$ref": "#/$defs/expr" },
    "denominator": { "$ref": "#/$defs/expr" },
    "expr": { "$ref": "#/$defs/expr" },
    "weights": { "$ref": "#/$defs/expr" },
    "null_handling": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["error", "zero", "skip", "propagate"]
        }
      }
    },
    "rounding": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "mode": { "type": "string", "enum": ["none", "half_up"] },
        "decimals": { "type": "integer", "minimum": 0, "maximum": 8 }
      }
    }
  },
  "$defs": {
    "source": {
      "type": "object",
      "required": ["kind"],
      "additionalProperties": false,
      "properties": {
        "kind": { "type": "string", "enum": ["measurements", "events", "table"] },
        "ref": {
          "type": "string",
          "description": "Nom logique de la source: table/stream"
        },
        "timestamp_field": { "type": "string" },
        "entity_id_field": { "type": "string" },
        "value_field": { "type": "string" },
        "dimensions_map": {
          "type": "object",
          "additionalProperties": { "type": "string" },
          "description": "Mapping dimension -> champ (ex. gender -> person_gender)"
        }
      }
    },
    "filter": {
      "type": "object",
      "required": ["field", "op"],
      "additionalProperties": false,
      "properties": {
        "field": { "type": "string" },
        "op": {
          "type": "string",
          "enum": ["eq", "neq", "in", "not_in", "gt", "gte", "lt", "lte", "exists"]
        },
        "value": {}
      }
    },
    "expr": {
      "type": "object",
      "required": ["op"],
      "additionalProperties": false,
      "properties": {
        "op": {
          "type": "string",
          "enum": [
            "field",
            "literal",
            "sum",
            "count",
            "count_distinct",
            "avg",
            "min",
            "max",
            "add",
            "sub",
            "mul",
            "div",
            "coalesce"
          ]
        },
        "field": { "type": "string" },
        "value": {},
        "args": {
          "type": "array",
          "items": { "$ref": "#/$defs/expr" }
        }
      }
    }
  },
  "allOf": [
    {
      "if": { "properties": { "type": { "const": "sum" } } },
      "then": { "required": ["source", "expr"] }
    },
    {
      "if": { "properties": { "type": { "const": "count" } } },
      "then": { "required": ["source", "expr"] }
    },
    {
      "if": { "properties": { "type": { "const": "rate" } } },
      "then": { "required": ["source", "numerator", "denominator"] }
    },
    {
      "if": { "properties": { "type": { "const": "weighted" } } },
      "then": { "required": ["source", "expr", "weights"] }
    },
    {
      "if": { "properties": { "type": { "const": "derived" } } },
      "then": { "required": ["expr"] }
    }
  ]
}
```

### 2.2 Sémantique (résumé)

- **`type=sum`** : agrège une expression numérique (souvent `field(value)`).
- **`type=count`** : compte des lignes / entités (souvent `count_distinct`).
- **`type=rate`** : ratio `numerator / denominator` avec gestion \(0\) et nulls.
- **`type=weighted`** : moyenne/score pondéré (ex. poids = importance, exposition).
- **`type=derived`** : indicateur dérivé de constantes + opérateurs (ou d’autres valeurs déjà projetées).

La formule ne porte pas les paramètres runtime (scope effectif, window effectif) : ceux-ci sont fournis à l’exécution.

## 3) Contrat d’exécution (API interne)

Le moteur de formules doit exposer (au minimum) une interface interne (pseudo-contrat) :

- **Entrée** :
  - `indicator_code` + `revision`
  - `scope` (kind + ids)
  - `window` (`as_of` OU `[start, end)`)
  - `group_by` effectif (sous-ensemble autorisé)
  - `filters` additionnels (territoire/cohorte/genre…)
  - `run_id` (ULID) + `trigger` (`batch|stream|manual`)
- **Sortie** :
  - `values[]` : liste de tuples \((dimensions, value)\)
  - `unit`, `precision`
  - `input_fingerprint` (hash stable)
  - `dependencies` (sources + champs)
  - `warnings[]` (ex. couverture désagrégation insuffisante)

Le moteur ne “publie” pas directement : il retourne des résultats à enregistrer sous forme de `indicator_measurements` calculées (avec `computed_by`, `run_id`) et/ou événements `indicator.computed`.

## 4) Fenêtrage temporel (windowing)

### Modes

- **as_of** : valeur à une date (ex. stock à date).
- **interval** : valeur sur une période \([start, end)\) (ex. cumul mensuel).

### Granularité

Le moteur doit supporter un `default_granularity` par KPI, mais permettre des exécutions explicites (ex. quarterly pour un KPI monthly) **sans changer la définition** (uniquement la fenêtre d’input).

### Timezone

La timezone est un paramètre contractuel pour éviter des écarts de jour/mois lors des agrégations.

## 5) Filtres (territoire, cohorte, genre…)

Les filtres sont exprimés sous forme de clauses `filters[]` (field/op/value). Le moteur doit :

- appliquer les filtres à la source (pushdown) si possible,
- vérifier que les champs/dimensions filtrés sont autorisés (contrôle sécurité / gouvernance),
- préserver la traçabilité (filters inclus dans `input_fingerprint`).

Exemples de filtres :

- `territory_id in ["Dakar", "Thies"]`
- `cohort_id eq "COHORT-2026-Q2-TRN-001"`
- `gender in ["F", "M"]`

## 6) Exemples `indicators.formula`

### 6.1 `sum` — total bénéficiaires servis (cumul période)

```json
{
  "version": "1.0",
  "type": "count",
  "description": "Bénéficiaires uniques servis sur la fenêtre",
  "output": { "unit": "people", "precision": 0 },
  "windowing": { "mode": "interval", "default_granularity": "monthly", "timezone": "Africa/Dakar" },
  "group_by": ["gender", "age_group", "territory"],
  "source": {
    "kind": "events",
    "ref": "service.delivered",
    "timestamp_field": "occurred_at",
    "entity_id_field": "beneficiary_id",
    "dimensions_map": {
      "gender": "beneficiary_gender",
      "age_group": "beneficiary_age_group",
      "territory": "territory_id"
    }
  },
  "expr": { "op": "count_distinct", "args": [{ "op": "field", "field": "beneficiary_id" }] },
  "null_handling": { "mode": "error" }
}
```

### 6.2 `rate` — taux d’achèvement formation

```json
{
  "version": "1.0",
  "type": "rate",
  "description": "Taux d’achèvement = completed / enrolled",
  "output": { "unit": "%", "precision": 2 },
  "windowing": { "mode": "interval", "default_granularity": "monthly", "timezone": "Africa/Dakar" },
  "group_by": ["gender", "territory", "cohort"],
  "source": {
    "kind": "table",
    "ref": "training_participations",
    "timestamp_field": "completed_at",
    "entity_id_field": "participant_id",
    "dimensions_map": {
      "gender": "participant_gender",
      "territory": "site_territory_id",
      "cohort": "cohort_id"
    }
  },
  "numerator": {
    "op": "count_distinct",
    "args": [{ "op": "field", "field": "participant_id" }]
  },
  "denominator": {
    "op": "count_distinct",
    "args": [{ "op": "field", "field": "participant_id" }]
  },
  "filters": [
    { "field": "status", "op": "eq", "value": "completed" }
  ],
  "rounding": { "mode": "half_up", "decimals": 2 }
}
```

Note : Dans un vrai modèle, `denominator` filtrerait `status in (enrolled, completed, ...)` et le `timestamp_field` du dénominateur pourrait être `enrolled_at`. Le contrat permet ces variations via `source.ref` (vues/table dédiées) ou via une source dédiée par sous-expression (si l’implémentation l’autorise). Le **contrat** n’impose pas le multi-source, mais autorise de composer via `derived` + projections intermédiaires.

### 6.3 `weighted` — score pondéré (exposition)

```json
{
  "version": "1.0",
  "type": "weighted",
  "description": "Score moyen pondéré par exposition",
  "output": { "unit": "score", "precision": 2 },
  "windowing": { "mode": "interval", "default_granularity": "quarterly", "timezone": "Africa/Dakar" },
  "group_by": ["territory"],
  "source": { "kind": "measurements", "ref": "indicator_measurements", "timestamp_field": "as_of" },
  "expr": { "op": "field", "field": "value" },
  "weights": { "op": "field", "field": "exposure_weight" },
  "null_handling": { "mode": "skip" }
}
```

## 7) Sécurité & gouvernance

- **Whitelist sources** : `source.ref` doit être validé (liste blanche) pour éviter l’exfiltration via formule.
- **Schema evolution** : `version` du contrat + `revision` KPI couvrent l’évolution.
- **Freeze reporting** : les calculs servant un rapport bailleur doivent être associés à un `run_id` gelé et référencé dans le pack.

## Acceptance Criteria (mini)

- **AC1** : `indicators.formula` est défini par un JSON Schema contractuel (versionné) couvrant `sum/count/rate/weighted/derived`.
- **AC2** : Le contrat d’exécution précise entrées/sorties, inclut `run_id` et `input_fingerprint` pour idempotence/audit.
- **AC3** : Le fenêtrage temps (as_of/interval, timezone, granularité) est explicitement supporté.
- **AC4** : Les filtres territoire/cohorte/genre et group_by sont gérés de manière contrôlée (désagrégation autorisée).
