# PHASE 1 — Migration Strategy (Supabase)

Ce document décrit comment passer du **schéma existant** (ECOSYSTIA-INTRANET) vers les tables foundation du module **Project & Program OS** sans casser la prod.

---

## 1) Principes

- **Additive first**: créer de nouvelles tables / colonnes avant toute suppression.
- **RLS partout**: activer RLS sur toutes les tables en schéma exposé (`public`) + policies correctes.
- **Idempotence**: migrations “safe” (`if not exists`, contraintes ajoutées progressivement).
- **Observabilité**: journaliser (audit) et tester les policies avant rollout.
- **Données existantes**: ne pas renommer brutalement `programmes`/`bailleurs`/`beneficiaires` si déjà utilisés.

---

## 2) État actuel Supabase (à date)

Projet Supabase identifié via MCP:
- **Project**: `ECOSYSTIA-INTRANET`
- **Ref**: `tdwbqgyubigaurnjzbfv`

Tables déjà présentes côté “Programme & Budget”:
- `public.programmes`
- `public.bailleurs`
- `public.programme_bailleurs`
- `public.programme_stakeholders`
- `public.programme_actions`
- `public.programme_data_rows`
- `public.programme_budget_lines`
- `public.beneficiaires`

Table `public.projects` existe déjà et contient `programme_id`.

---

## 3) Alerte sécurité (à traiter avant exposition large)

Le listing des tables a retourné un advisory **critique**: certaines tables `public.*` ont **RLS désactivé**.

**IMPORTANT**: ne pas activer RLS “à l’aveugle” en prod sans définir les policies, sinon vous bloquerez des flux.

Tables signalées (selon l’advisory au moment de la capture):
- `public.roles`
- `public.permissions`
- `public.role_permissions`
- `public.audit_logs`
- `public.organizations`
- `public.role_approval_logs`
- `public.currency_exchange_rates`
- `public.accounting_matching_groups`
- `public.accounting_matching_lines`
- `public.accounting_reconciliations`
- `public.notifications_archive`

Action recommandée (process):
- établir un owner/fonction pour chaque table
- définir policies minimales (select/insert/update/delete) selon besoin
- ensuite seulement activer RLS

---

## 4) Stratégie de migration (séquence)

### Étape A — Préflight
- Lister tables/colonnes réelles (MCP `list_tables verbose`)
- Lister policies actuelles via SQL:

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### Étape B — Foundation tables (Project & Program OS)
- Appliquer `POSTGRES-SCHEMA-DRAFT.sql` en migration (après adaptation)
- Vérifier indexation + contraintes FK

### Étape C — RLS policies
- Appliquer `RLS-POLICIES-DRAFT.sql` après validation des règles d’accès
- Vérifier le piège Postgres: **UPDATE nécessite SELECT policy**

### Étape D — Backfill & compat
- Backfill `organization_id` (si null) à partir de `profiles.organization_id` ou organisation “par défaut”
- Ajouter des colonnes manquantes sur tables existantes plutôt que recréer

### Étape E — Read models + outbox
- Créer projections (phase 4/6) via vues matérialisées ou tables de read-model
- Outbox: configurer un worker (Edge/Temporal/Nest) pour publier les events

---

## 5) Validation (acceptance checks)

- ✅ CRUD (activities/missions/incidents) fonctionne côté client avec JWT Supabase
- ✅ RLS: pas d’accès cross-org
- ✅ Offline: idempotence (event_id unique) et replays sans doublons
- ✅ Perf: indexes sur `organization_id` + pivots (programme/project/status/created_at)

---

## 6) Next (PHASE 2)

- Approval matrix (finance/région/programme)
- Governance DSL + flows Temporal (validation chains, escalations, quorum, override)

