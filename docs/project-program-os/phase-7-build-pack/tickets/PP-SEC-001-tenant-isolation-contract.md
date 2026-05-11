# PP-SEC-001 — Contrat d’isolation multi-tenant (RLS + scopes)

- **Priorité**: P0
- **Dépendances**: inventaire rôles/tables existants, PP-DB-001
- **Owner**: Security (placeholder)
- **Estimation**: M

## Objectif
Formaliser et appliquer un contrat d’isolation “tenant” (par `organization_id`) sur toutes les lectures/écritures, y compris read-models et audit.

## Détail
- Standardiser:
  - colonnes `organization_id` obligatoires
  - conventions `auth.uid()` / mapping `profiles.organization_id`
  - scopes ABAC (programme/projet/territoire) en plus du tenant
- Définir un “minimum role model”:
  - contributor terrain, manager programme, auditor (lecture), super_admin (break-glass)
- Produire un pack de tests RLS (matrice) réutilisé par PP-DB-002.

## Acceptance criteria
- ✅ Toute table exposée a une policy RLS (au moins SELECT) compatible tenant.
- ✅ Read-models et vues respectent la même contrainte.
- ✅ Break-glass strictement limité et audité (voir PHASE 2).

## Stratégie de test
- **Automated RLS matrix**: tests par rôle × table × op (S/I/U/D) × org A/B.
- **Regression**: tests sur endpoints UI principaux (list/detail) avec org A/B.

