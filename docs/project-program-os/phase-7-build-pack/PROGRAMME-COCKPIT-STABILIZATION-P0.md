# Programme Cockpit — Stabilisation runtime (pré-P1)

Objectif: valider que `programme_cockpit.v1` est **fiable sous stress** avant de passer en P1 incrémental.

## A) Déterminisme réel (rebuild)
### Scénarios
- **Rebuild concurrent**: 2+ rebuild simultanés sur le même `programme_id`.
- **Rebuild massif**: rebuild séquentiel sur N programmes (20–200).
- **Données partielles**: programme sans budget, sans actions, sans activités.
- **Snapshots incomplets**: tables sources vides ou manquantes (selon modules activés).
- **Rollback**: re-générer après correction de données (alertes doivent se mettre à jour sans doublons).

### Attendus (P0)
- Les **alert IDs** restent identiques à donnée identique (pas de duplication).
- Le snapshot est **cohérent**: aucune exception, champs présents, types stables.
- `projection_checkpoints` est mis à jour à chaque rebuild.

## B) Validation multi-tenant agressive
### Scénarios
- Org A ne peut pas lire `programme_cockpit_read_models` de org B (RLS).
- Un utilisateur org A ne peut pas rebuild un programme org B (Edge Function).

### Attendus
- Erreurs nettes: `organization_mismatch` côté function / 0 rows côté RLS.

## C) Observabilité “2 minutes”
Vous devez pouvoir répondre à: **“Pourquoi cette alerte existe ?”**

### Ce qui doit exister
- Logs structurés JSON du projector:
  - `rebuild_start`, `rebuild_end`, `rebuild_error`
  - `organization_id`, `programme_id`, `duration_ms`, `watermarks`, `rows`, `alert_count`
- Convention d’alerte:
  - `key` lisible `prog:<programmeId>:<kind>:<scope>:<referenceId>`
  - `id` déterministe (SHA-256 de la clé)

## D) Backfill dataset réaliste
Créer un dataset de test contenant:
- budget en dépassement (variance > 15%)
- burn-rate trop élevé vs elapsed
- actions en retard + preuves manquantes
- anomalies MEL (missing target/result)
- validations en attente (budget cascade submitted + dépenses pending)

Voir: `supabase/manual/programme_cockpit_seed_minimal.sql`

