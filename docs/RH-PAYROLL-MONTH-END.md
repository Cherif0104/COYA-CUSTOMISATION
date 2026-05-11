# Paie — fin de mois (manuel, RPC, Edge stub)

## Comportement actuel (production applicative)

1. **Matrice paie** (`components/PayrollMatrix.tsx`)  
   - **« Remplir la période depuis la présence »** : appelle `payrollService.bulkGenerateDraftPaySlipsForPeriod(periodStart, periodEnd)` — création / mise à jour des bulletins **brouillon** et lignes SN indicatives.  
   - **« Clôture mensuelle RH »** : appelle d’abord le RPC Postgres `public.rh_payroll_close_period_stub(period_start, period_end)` (traçabilité / point d’extension), puis enchaîne sur le même remplissage que le bouton précédent.

2. **RPC SQL** `rh_payroll_close_period_stub(date, date)`  
   - Retourne un JSON d’information (FR/EN).  
   - Ne crée pas de lignes en base : la persistance reste côté `payrollService` / moteur `payrollEngine`.

## Automatisation future

- **Cron Supabase** : planifier un appel HTTP vers la Edge Function `payroll-month-close` (stub dans `supabase/functions/payroll-month-close/index.ts`) ou vers un worker interne avec **service role** si la logique métier est portée serveur.  
- **Prérequis** : consolidation des temps / présence validés pour la période ; alignement fiscal à valider avec l’expert-comptable (mentions dans l’UI bulletin).

## Références code

- `services/payrollService.ts` — `bulkGenerateDraftPaySlipsForPeriod`  
- `services/payrollEngine.ts`  
- Migration `20260510143000_hr_document_requests_and_payroll_stub_rpc.sql` (définition RPC)
