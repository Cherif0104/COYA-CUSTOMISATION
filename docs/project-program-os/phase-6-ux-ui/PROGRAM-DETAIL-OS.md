# Program Detail OS (écran canonique)

## But
Donner une vue “command center” d’un **programme**: budget, territoires, activités, impact, risques, gouvernance, documents, incidents.

## Layout (structure)
1) **Header stratégique** (gradient)
- Nom programme + code
- Statut workflow (Draft/Review/Validated/…)
- Bailleurs (badges) + partenaires clés
- Budget: engagé / consommé / restant
- Score santé + niveau risque (badge couleur)
- CTA: “Créer projet/activité”, “Publier rapport”, “Exporter pack bailleur”

2) **Métriques (Power BI)** — 4 à 8 cartes
- Budget consommé (%)
- Progression globale (roadmap)
- Activités (validées / en cours / bloquées)
- Incidents (ouverts / critiques)
- Qualité données (DQ score)
- Bénéficiaires (atteints vs cible)

3) **Tabs (minimum)** — chaque tab = projection dédiée
- **Synthèse**
- **Carte / Territoires**
- **Impact (M&E)**
- **Timeline (événements)**
- **Gouvernance**
- **Documents**
- **Incidents**

## Comportements clés
- **Filtre global** sticky: période, territoire, bailleur, statut (workflow), criticité (incidents).
- **Drill-down**: clique sur une région → ouvre “Territorial Command View” pré-filtré.
- **Tout événement important** (validation, override, publication) apparaît dans Timeline + Audit.

## Read-model attendu (exemples)
Projection `program_detail_read_model` (conceptuel):
- `program`: id, name, code, workflow_state, health_score, risk_level
- `budget`: planned, committed, spent, remaining, burn_rate
- `territories`: count + breakdown (heatmap)
- `kpis_top`: list (code, name, target, actual, trend, dq_flag)
- `incidents`: counts by severity/status + top blockers
- `governance`: pending_approvals, quorum_needed, delegates_active
- `documents`: last_updated, missing_required, donor_pack_status

## Empty / Error / Offline states
- **Empty**: aucun projet/activité → CTA “Créer activité” + guide.
- **Error (RLS)**: bannière “Accès restreint” + bouton “Demander accès” (crée incident/req).
- **Offline**:
  - badge “Offline” + last sync
  - certaines tabs passent en “lecture seule”
  - timeline locale (outbox events non publiés) visible

## Acceptance Criteria
- **AC-PROG-01**: header affiche bailleurs + budget + score santé + état workflow.
- **AC-PROG-02**: chaque tab a un read-model identifié (pas de logique métier cachée).
- **AC-PROG-03**: timeline inclut validations/overrides/publications + liens audit.
- **AC-PROG-04**: offline: état sync + outbox visible + UX mode dégradé.

