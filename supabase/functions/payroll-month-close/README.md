# `payroll-month-close` (stub)

Handler Deno minimal : vérifie le JWT, renvoie un JSON `stub: true` (pas de génération de bulletins côté serveur pour l’instant).

## Variables d’environnement (Supabase / local)

Les secrets suivants sont injectés automatiquement par la plateforme lors du déploiement :

| Variable            | Rôle                                      |
|---------------------|-------------------------------------------|
| `SUPABASE_URL`      | URL du projet                             |
| `SUPABASE_ANON_KEY` | Clé anon (le handler lit l’utilisateur via le header `Authorization` du client) |

Pour des tests locaux : `supabase secrets set` ou fichier `.env` lu par `supabase functions serve` selon votre flux.

## Déploiement

```bash
supabase functions deploy payroll-month-close --project-ref <VOTRE_PROJECT_REF>
```

JWT : `verify_jwt = true` dans `supabase/config.toml` pour cette fonction (aligné avec les autres fonctions du dépôt).

## Appel HTTP (exemple)

```bash
curl -i -X POST \
  -H "Authorization: Bearer <access_token_utilisateur>" \
  -H "Content-Type: application/json" \
  -d '{"period_start":"2026-05-01","period_end":"2026-05-31"}' \
  "https://<project-ref>.supabase.co/functions/v1/payroll-month-close"
```

Évolution prévue : cron + `service_role` ou appel RPC `rh_payroll_close_period_stub` + pipeline métier (voir `docs/RH-PAYROLL-MONTH-END.md`).
