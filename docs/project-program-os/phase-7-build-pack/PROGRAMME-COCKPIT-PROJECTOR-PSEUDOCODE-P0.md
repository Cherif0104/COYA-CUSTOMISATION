# Programme Cockpit — Projector batch (P0) — pseudo-code

## Objectif
Générer un snapshot **read-model** `programme_cockpit.v1` par `programme_id`, avec:

- **isolation tenant** (`organization_id`)
- **IDs d’alertes déterministes**
- **watermarks** (`domain_events.occurred_at` + `max(updated_at)` sources)
- exécution “batch rebuild” prête pour évoluer vers incrémental (P1)

## Artefacts implémentés
- **DB migration**: `supabase/migrations/20260508140000_programme_cockpit_read_model.sql`
- **DB migration (run/status)**: `supabase/migrations/20260508143000_programme_cockpit_projection_run.sql`
- **Edge Function**: `supabase/functions/programme-cockpit-rebuild/index.ts`
- **Contrat TS**: `services/programmeCockpitContract.ts`

## Entrée / sortie
### Entrée
`POST /functions/v1/programme-cockpit-rebuild`

Body:
```json
{ "programme_id": "<uuid>" }
```

### Sortie
`200 { ok: true, programme_id, generated_at }` (ou erreur structurée)

## Pseudo-code (niveau logique)
```text
rebuild(programme_id, actor_jwt):
  assert actor_jwt valid
  org_id = profiles(actor).organization_id
  assert programmes(programme_id).organization_id == org_id

  sources = load:
    programme_budget_lines where programme_id
    budget_cascade_lines where programme_id (+ rollup views)
    programme_actions where programme_id (+ programme_action_assignees)
    project_activities where programme_id
    expense_requests where programme_id
    last_event = domain_events where (org_id, aggregate_type='programme', aggregate_id=programme_id) order by occurred_at desc limit 1

  compute KPIs:
    budget totals + variance + burn-rate
    governance pending approvals (budget lines submitted + expense pending + actions pending_validation)
    actions due counters (overdue, due soon, unassigned) + proof completeness
    MEL coverage + anomalies
    risk proxy = weighted sum (budget + overdue + mel anomalies + pending approvals)

  alerts:
    for each alert scenario:
      alert_key = "prog:<programme_id>:<kind>:<scope>:<referenceId>"
      alert_id = sha256(alert_key)  // déterministe
      push alert { id, key, kind, severity, ... }

  watermarks:
    watermark_event_occurred_at = last_event.occurred_at
    watermark_source_updated_at = max(updated_at) across all loaded rows

  model = { schemaId, modelVersion, ...payload, alerts, sync:{...} }

  upsert programme_cockpit_read_models(org_id, programme_id):
    schema_id='programme_cockpit.v1'
    model_version=1
    projection_run_id=new uuid
    projection_status = building -> ready/failed
    generated_at=now
    watermark_* columns
    model=jsonb

  upsert projection_checkpoints('programme_cockpit', org_id, programme_id):
    last_built_at=now
    last_event_occurred_at=watermark_event_occurred_at
    watermark_position=watermark_event_occurred_at
    metadata={schema_id, model_version}

  return ok
```

## Notes P1 (incrémental)
- Remplacer le rebuild “full scan” par:
  - consommation de `domain_events` par fenêtres (occurred_at)
  - recompute partiel par “affected programme_ids”
- Introduire une file / cron `pg_cron` ou queue.

