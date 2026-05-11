# Appliquer les migrations Workforce sur Supabase

## Option A — MCP Supabase (Cursor)

1. Vérifie que le serveur MCP **Supabase** est connecté (OAuth dans Cursor).
2. Utilise l’outil **`apply_migration`** deux fois, ou **`execute_sql`** une fois avec le contenu de  
   [`../../scripts/apply-workforce-migrations-remote.sql`](../../scripts/apply-workforce-migrations-remote.sql).

Les fichiers sources dans le repo restent :

- `supabase/migrations/20260509120000_workforce_activity_events.sql`
- `supabase/migrations/20260510120000_workforce_timeline_segments.sql`

## Option B — SQL Editor (dashboard Supabase)

1. Ouvre ton projet sur [supabase.com](https://supabase.com) → **SQL Editor** → **New query**.
2. Colle tout le contenu de **`scripts/apply-workforce-migrations-remote.sql`**.
3. Exécute (**Run**). En cas d’erreur « already exists », les `IF NOT EXISTS` / `DROP POLICY IF EXISTS` limitent les conflits.

## Option C — CLI local (`supabase link` + `db push`)

Si le CLI est installé et le projet lié :

```bash
supabase db push
```

(Applique toutes les migrations du dossier `supabase/migrations` non encore appliquées.)

## Vérification

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('workforce_activity_events', 'workforce_timeline_segments');
```

Les deux lignes doivent apparaître.

## Données de démo (SQL)

Pour remplir rapidement la carte **Chronologie activité** du dashboard pour un utilisateur réel :

1. Ouvre [`../../scripts/seed-workforce-demo.sql`](../../scripts/seed-workforce-demo.sql).
2. Remplace `v_org` et `v_uid` dans le bloc `DO $$` par ton `organizations.id` et `auth.users.id`.
3. Exécute le script dans le **SQL Editor** (rôle postgres).

Les segments utilisent le **jour calendaire UTC** du serveur au moment de l’exécution (`v_day`). Si le dashboard est vide, vérifie le fuseau : tu peux forcer `v_day := 'AAAA-MM-JJ'::date;` dans le script.
