# Aggregation Engine — projections & read-models (PHASE 4)

## Objet

Ce document spécifie le **contrat d’agrégation** pour produire des **read-models** (tableaux de bord, exports, reporting) à partir :

- des mesures (`indicator_measurements`),
- des cibles (`indicator_targets`) et baselines,
- des événements M&E (outbox),
en garantissant **performance**, **idempotence**, **auditabilité** et compatibilité **offline-first**.

## 1) Principes d’architecture

- **Write-side** : capture/validation des mesures, append-only events, corrections traçables.
- **Read-side** : projections matérialisées, optimisées pour lecture (dashboards).
- **Reproductibilité** : tout chiffre affiché dans un contexte “bailleur” doit être relié à un `run_id` (snapshot).
- **Pushdown** : pousser filtres (scope, window, dimensions) au plus proche du stockage.

## 2) Read-models (projections) — catalogue minimal

### 2.1 `me_dashboard_kpi_timeseries`

Série temporelle par indicateur + scope + dimensions.

Clés logiques :

- `indicator_id`, `indicator_revision`
- `scope_kind`, `scope_id`
- `bucket_start` (selon granularité), `bucket_granularity`
- `dimensions_hash` + `dimensions` (json)
- `value`, `unit`
- `run_id` (si calculé / gelé)

### 2.2 `me_dashboard_kpi_vs_target`

Vue “réalisé vs cible” (progression, delta, %).

Champs :

- `value_actual`, `value_target`, `delta`, `progress_ratio`
- `baseline_value` optionnel
- `status`: `on_track | at_risk | off_track` (règles métier)

### 2.3 `me_reporting_pack_snapshot`

Snapshot pour un pack bailleur (période + scope + version KPI + run_id).

Champs :

- `pack_id`, `donor_id`, `period_start/end`, `scope`
- `kpi_values` (json, liste)
- `evidence_refs` consolidées
- `generated_at`, `generated_by`, `run_id`

Remarque : le modèle exact peut être table ou stockage objet, mais le **contrat** impose un snapshot gelé.

## 3) Calcul batch vs streaming

### Batch (recommandé pour bailleurs)

Caractéristiques :

- recalcul périodique (nightly/weekly) + backfill,
- stable et audit-friendly (run_id),
- facile à valider et signer.

Cas d’usage :

- génération de packs bailleurs,
- clôture mensuelle/trimestrielle,
- recalcul après correction DQ majeure.

### Streaming (pour dashboards opérationnels)

Caractéristiques :

- incrémental à partir d’événements `measurement.*`,
- latence faible (quasi temps-réel),
- nécessite stratégie de déduplication et reprocessing.

Cas d’usage :

- monitoring terrain (collecte du jour),
- alertes qualité (outliers immédiats),
- suivi d’avancement opérationnel.

### Cohérence entre batch et streaming

Contrat :

- un même KPI doit produire des valeurs cohérentes pour une fenêtre donnée,
- le batch est la **source de vérité** pour reporting gelé; le streaming peut être “provisoire” tant que non validé.

## 4) Matérialisation : vues matérialisées vs tables

### Option A — Materialized views (MV)

Avantages :

- recalcul atomique, indexable,
- simplicité si requêtes stables.

Risques :

- refresh coûteux si volumétrie élevée,
- plus difficile en mode streaming.

### Option B — Tables de projection (recommandé)

Avantages :

- support natif des mises à jour incrémentales,
- meilleur contrôle idempotence, run_id, replays.

Risques :

- plus de code (gestion upserts, partitions),
- nécessite discipline de schéma (clés uniques).

Recommandation contractuelle : **tables de projection** pour dashboards, et MV optionnelles pour cas “batch-only”.

## 5) Idempotence & déduplication

### Identifiants

- **Événement** : `event_id` (ULID) + `dedupe_key` stable (offline).
- **Mesure** : `client_idempotency_key` stable côté mobile/terrain.
- **Run** : `run_id` pour tout calcul batch (ULID).

### Règles

- **R1** : toute écriture de projection doit être un **upsert** avec clé unique.
- **R2** : une projection streaming doit conserver un `last_event_id` ou watermark pour replay.
- **R3** : un recalcul batch ne doit pas “mélanger” des runs : si `run_id` change, on écrit dans un nouvel espace logique (partition ou table snapshot).

## 6) Performance : partitions, indexes, shapes

### Indexes recommandés (shape)

Sans imposer la DB (contrat), les patterns d’accès typiques :

- lecture par `indicator_id + period_bucket + scope_id`
- lecture par `scope_id + period_bucket` (dashboard territoire)
- lecture par `indicator_id + run_id` (report pack)
- filtrage par dimensions (genre/âge/cohorte)

Recommandations :

- **partition par temps** : `bucket_start` (mois) sur tables timeseries,
- **index composite** : `(indicator_id, scope_id, bucket_start, dimensions_hash)` unique,
- **index run** : `(run_id, indicator_id)` pour extraction pack,
- **dimensions_hash** : hash stable du JSON dimensions (pour clé courte).

### Pagination & limites

Les APIs read-side doivent :

- paginer sur `bucket_start` et/ou sur séries,
- imposer des limites de cardinalité `group_by` (ex. pas plus de 3 dimensions simultanées).

## 7) Contract d’exécution du moteur d’agrégation

### Entrées (minimum)

- `job_type`: `compute_kpi_timeseries | compute_pack_snapshot | recompute_scope`
- `scope` + `window` + `granularity`
- `indicator_set`: liste (ou “all active”)
- `run_id` (obligatoire en batch)
- `mode`: `batch | streaming`
- `force_recompute`: boolean (batch)

### Sorties (minimum)

- `run_id`
- `status`: `success | partial | failed`
- `written_rows` (par projection)
- `warnings` (DQ, coverage)
- `artifacts` : références snapshot / export

## 8) Liens avec gouvernance

Un pack bailleur “approved/frozen” exige :

- un `run_id` batch associé,
- des valeurs calculées **à partir de mesures validées**,
- un snapshot immuable (ou append-only).

Le moteur doit refuser une exécution “pack snapshot” si :

- la fenêtre est ouverte (pas clôturée) et le bailleur impose clôture,
- le taux de complétude désagrégation est insuffisant (règles DQ),
- des incidents qualité critiques sont ouverts sur le scope/période.

## Acceptance Criteria (mini)

- **AC1** : Le document définit au moins 3 read-models (timeseries, vs target, snapshot pack) avec clés logiques et exigences run_id.
- **AC2** : Batch vs streaming est explicitement cadré (source de vérité, cohérence, cas d’usage).
- **AC3** : Les règles d’idempotence/déduplication sont définies pour offline + replays.
- **AC4** : Les recommandations performance (indexes/partitions/limites de cardinalité) sont alignées avec les patterns dashboard/pack.
