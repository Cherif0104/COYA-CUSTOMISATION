# PP-DB-004 — Schéma M&E: KPI definitions + formules

- **Priorité**: P1
- **Dépendances**: PP-DB-001, PP-DB-002
- **Owner**: Backend/DB (placeholder)
- **Estimation**: M

## Objectif
Formaliser un schéma M&E (PHASE 4/5) pour définir les KPI de manière versionnée et auditable: définitions, formules, unités, dimensions et règles de qualité — exploitable par projections et reporting.

## Périmètre / non-objectif
- **Périmètre**:
  - Tables: `kpi_definitions`, `kpi_formulas`, `kpi_dimensions` (ou équivalent), versionnage, statut (draft/active/deprecated).
  - Contraintes multi-tenant: `organization_id` partout + RLS.
  - Champs d’audit: `created_by`, `published_by`, timestamps, `definition_version`.
- **Non-objectif**:
  - Calcul runtime complet des KPI (peut être côté projections, PP-BE-004/PP-DB-005).
  - UI de gouvernance (PP-FE-004).

## Acceptance criteria
- ✅ Les définitions KPI sont stockées de façon versionnée, activables/dépréciables, et auditées.
- ✅ Les formules sont représentées de façon non ambiguë (AST, DSL ou expression contrôlée) avec validation.
- ✅ L’isolation tenant est démontrée: impossible de lire/écrire des KPI d’un autre tenant (tests).
- ✅ Des index existent pour les accès usuels (par tenant, par statut, par code KPI).

## Stratégie de test
- **Integration**: migrations + création/activation/dépréciation; validation de formules (cas invalides).
- **RLS**: matrice tenant A/B sur select/insert/update.
- **Perf**: vérifier plans/index sur lectures “liste KPI actifs” par tenant.
