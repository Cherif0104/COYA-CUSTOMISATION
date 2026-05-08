# Donor Report Templates — packs d’extraction (PHASE 4)

## Objet

Ce document définit des **templates de rapports bailleurs** sous forme de **packs**. Un pack est un artefact gouverné qui assemble :

- des chiffres (KPI) **gelés** via `run_id` (batch),
- des tableaux (désagrégations standard),
- une narration structurée (méthode, écarts, leçons),
- les preuves (`evidence_items`) et le trail audit,
en respectant l’offline-first (données terrain sync) et la gouvernance (validation finale).

## 1) Contrat d’un “pack” bailleur

### 1.1 Identité & paramètres

- **`pack_code`** : identifiant stable (ex. `DONOR_EU_Q_REPORT_V1`).
- **`donor`** : bailleur / programme de financement.
- **`period`** : `[start_at, end_at)` + timezone.
- **`scope`** : programme/projet/territoire/partner (explicit).
- **`kpi_set`** : liste d’indicateurs (code + revision) inclus.
- **`disaggregation_profile`** : dimensions obligatoires (ex. genre/âge/territoire).
- **`narrative_sections`** : sections standard (voir ci-dessous).
- **`audit_requirements`** : exigences de preuves, signatures, gel.

### 1.2 Sorties attendues

Un pack produit (au minimum) :

- **Exports** : `CSV`/`XLSX` (tables) + `PDF`/`DOCX` (narratif) selon capacité.
- **Snapshot** : `pack_snapshot` (ou équivalent) référencé par `run_id`.
- **Evidence bundle** : liste de `evidence_items` (liens + métadonnées).

### 1.3 Gouvernance (workflow)

États recommandés :

- `draft → in_review → approved → frozen → published`

Règles :

- “approved” nécessite validations (M&E Officer + Programme Manager).
- “frozen” exige `run_id` + snapshot immuable + verrou de période.
- “published” exige checks audit (preuves, cohérence, complétude désagrégation).

## 2) Sections standard (narratif)

Chaque pack doit contenir une structure stable, indépendante du bailleur (avec adaptations).

- **S1 — Executive Summary** : résultats majeurs (KPI clés), comparaison target, messages clés.
- **S2 — Contexte & scope** : zones, cohorte(s), partenaires, période.
- **S3 — Méthodologie M&E** : sources, outils, fréquence, validation, limites.
- **S4 — Résultats par outcome** : tableaux + analyses (KPI → interprétation).
- **S5 — Désagrégations & inclusion** : genre/âge/vulnérabilité/territoire, couverture, biais.
- **S6 — Écarts vs targets** : explications, actions correctives, risques.
- **S7 — Evidence & audit trail** : preuves, échantillonnage, signatures, liens.
- **S8 — Leçons apprises & recommandations** : pour la période suivante.
- **S9 — Annexes** : dictionnaire KPI, exports bruts, logs d’incidents qualité.

## 3) Mapping données → narratif (contractuel)

### 3.1 Principe

Le narratif ne doit pas “inventer” les chiffres : il référence des éléments de snapshot :

- `kpi_value_ref` : `(indicator_code, revision, scope, window, dimensions, run_id)`
- `target_ref` : `(indicator_code, scope, period)`
- `evidence_ref` : `evidence_items[]`

### 3.2 Patterns de phrases (gabarits)

Exemples de mapping :

- **KPI résultat** : “Sur la période, {KPI.name} atteint {value}{unit} (cible: {target}{unit}, écart: {delta}{unit}).”
- **Désagrégation** : “La performance diffère selon {dimension}: {breakdown_summary}. La couverture de catégorisation est {coverage}%.”
- **Justification écart** : “L’écart est principalement expliqué par {factor}, corroboré par {evidence_refs}.”

Le pack doit stocker ces liens afin que l’audit puisse remonter du texte aux données.

## 4) Packs types (exemples ONG/bailleur)

### Pack 1 — Rapport trimestriel standard (EU/AFD/USAID-like)

- **Code** : `DONOR_STD_QUARTERLY_V1`
- **Période** : quarterly
- **KPIs** (exemples) :
  - `SRV_UNIQUE_BENEFICIARIES`
  - `TRN_COMPLETION_RATE`
  - `EMP_PLACEMENTS_3M`
  - `TRN_SCORE_DELTA_AVG`
- **Désagrégations obligatoires** : `gender`, `age_group`, `territory`
- **Outputs** : XLSX + PDF
- **Evidence** : requis sur KPIs “haute criticité” (placements, dépenses, listes)

### Pack 2 — Rapport mensuel opérationnel (donneur interne / steering)

- **Code** : `STEERING_MONTHLY_V1`
- **Focus** : vitesse d’exécution + alertes
- **KPIs** :
  - reach (mensuel), complétion formation, sessions délivrées
  - incidents qualité ouverts/fermés
- **Désagrégations** : territoire (prioritaire), genre (si disponible)
- **Outputs** : dashboard + export CSV
- **Gouvernance** : “approved” rapide, “frozen” optionnel

### Pack 3 — Rapport final projet (endline)

- **Code** : `DONOR_PROJECT_ENDLINE_V1`
- **Période** : projet entier + cohortes
- **KPIs** :
  - baseline vs endline (progression)
  - insertion à 3/6 mois
  - indicateurs d’impact spécifiques (si disponibles)
- **Evidence** : bundle complet (annexes) + méthodologie détaillée
- **Gouvernance** : validations renforcées + signature compliance

## 5) Exigences audit (minimales)

### 5.1 Traçabilité

Le pack doit contenir :

- `run_id` batch
- liste des KPIs (code + revision)
- fenêtre (timezone incluse)
- scope (program/project/territory/cohort)
- références evidence_items (IDs + métadonnées)
- journal des validations (qui/quand/quoi)

### 5.2 Contrôles automatiques (gate)

Avant `approved` / `frozen` :

- complétude désagrégation ≥ seuil,
- absence d’incidents qualité critiques ouverts,
- valeurs hors plage traitées (ou justifiées),
- preuves requises présentes (ou dérogation signée).

## 6) Offline-first (impact sur packs)

Règle : un pack ne doit pas figer une période tant que :

- des événements offline sont en attente de sync pour le scope/période, **ou**
- des mesures sont “submitted” non validées qui impactent des KPIs critiques.

Le moteur d’agrégation doit pouvoir produire :

- un mode “preview” (non gelé) pour revue,
- un mode “freeze” (gelé) qui verrouille l’input.

## Acceptance Criteria (mini)

- **AC1** : Le contrat de pack (identité, période, scope, kpi_set, disaggregation_profile, audit_requirements) est défini.
- **AC2** : Une structure standard de sections narratif est fournie + mapping data→texte via références snapshot.
- **AC3** : Au moins 3 packs types sont décrits (trimestriel bailleur, mensuel steering, endline).
- **AC4** : Les exigences audit et les gates (DQ, preuves, validations, gel run_id) sont explicitement listées.
