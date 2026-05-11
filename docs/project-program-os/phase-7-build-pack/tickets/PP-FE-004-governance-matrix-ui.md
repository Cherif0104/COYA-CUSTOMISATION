# PP-FE-004 — Governance matrix UI (roles/scopes/approvals)

- **Priorité**: P1
- **Dépendances**: PP-BE-002, PP-SEC-001, PP-WF-001, PP-WF-002
- **Owner**: Frontend (placeholder)
- **Estimation**: M

## Objectif
Fournir une UI contractuelle pour rendre la gouvernance opérable: matrice rôles/scopes, visualisation des règles d’approbation (quorum, override), et prévisualisation des effets (qui peut faire quoi) — sans jamais contourner RLS/ABAC.

## Périmètre / non-objectif
- **Périmètre**:
  - Écrans “matrice” lisibles: rôles × scopes × actions critiques, avec explication des règles.
  - Visualisation des chaînes d’approbation et états d’un workflow type (read-models).
  - Actions limitées (P1): activer/désactiver une règle non-critique ou publier une version (si supporté).
- **Non-objectif**:
  - Éditeur complet de DSL (la compilation est côté backend, PP-WF-001).
  - Gestion IAM/secrets (voir tickets SEC/INFRA).

## Acceptance criteria
- ✅ La matrice de gouvernance est disponible en read-only et reflète les règles actives côté runtime.
- ✅ Toute action UI potentiellement mutative est protégée par confirmations + idempotence (anti double-submit).
- ✅ Les affichages ne révèlent pas d’informations cross-tenant; tests multi-tenant incluent “mêmes IDs dans deux tenants”.
- ✅ Les règles affichées ont un identifiant/version permettant d’auditer “qui a publié quoi” (aligné audit, PP-SEC-002).

## Stratégie de test
- **Unit**: mapping règles → matrice, composants d’explication, protections UI.
- **Integration**: mocks read-models gouvernance; vérif pagination/filtre.
- **E2E**: tenant A vs tenant B sur mêmes parcours + vérification que la matrice varie selon politiques.
