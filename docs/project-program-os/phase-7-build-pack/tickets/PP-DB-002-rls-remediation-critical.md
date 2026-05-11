# PP-DB-002 — Remédiation critique: activer RLS + policies minimales

- **Priorité**: P0
- **Dépendances**: inventaire policies actuelles (staging), PP-SEC-001
- **Owner**: Security/DB (placeholder)
- **Estimation**: L

## Objectif
Remédier au risque critique identifié en PHASE 1: tables `public.*` avec **RLS désactivé** (ex: `roles`, `permissions`, `audit_logs`, `organizations`, etc.).

## Détail
- Établir un inventaire exact des tables et de leur état RLS.
- Pour chaque table:
  - définir un owner métier/technique,
  - définir policies minimales (lecture/écriture) **multi-tenant**,
  - activer RLS de façon progressive (staging → prod) avec monitoring.
- Appliquer les garde-fous Postgres (UPDATE nécessite souvent SELECT policy).

## Acceptance criteria
- ✅ RLS activé sur toutes les tables ciblées + policies minimales validées.
- ✅ Aucun accès cross-tenant (org A ne voit jamais org B).
- ✅ Aucun “lock-out” des flux essentiels (rollback plan documenté).
- ✅ Monitoring: taux d’erreurs RLS observé et alertable.

## Stratégie de test
- **RLS matrix**: suite de tests automatisés “org A vs org B” (select/insert/update/delete).
- **Canary**: activer RLS sur 1–2 tables à faible risque en premier + monitorer.
- **Observabilité**: logs/metrics sur erreurs RLS et requêtes rejetées.

