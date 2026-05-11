# PP-BE-004 — Read-models & projections (PHASE 4/6) — requêtes stables

- **Priorité**: P0 (cockpit Programme P0) + P1 (projections restantes)
- **Dépendances**: PP-DB-005, PP-BE-003, PP-OBS-001
- **Owner**: Backend/Data (placeholder)
- **Estimation**: M

## Objectif
Exposer des endpoints “read-models” performants et stables pour les vues Mission Control / Incident Center / Analytics (PHASE 6) et M&E (PHASE 4), en s’appuyant sur des schémas read-models/projections définis (PP-DB-005) sans recalcul ad hoc côté UI.

## Détail
- Projections attendues:
  - listes mission/activité avec filtres (territoire, période, statut)
  - incidence: listes + détails + timeline
  - gouvernance: statut approvals/workflows par cible
  - analytics: séries agrégées “as_of” (cf. PHASE 4)
- API:
  - pagination et tri stable (convention PP-BE-001)
  - champs calculés “safe” (pas d’accès cross-tenant)
- Observabilité:
  - loguer latence + paramètres (sans PII) + corrélation (PP-OBS-001)

## Acceptance criteria
- ✅ Les écrans PHASE 6 peuvent être alimentés sans requêtes N+1 côté client (endpoints dédiés).
- ✅ Les read-models respectent l’isolation tenant et ne révèlent pas de données hors scope.
- ✅ Temps de réponse acceptable sur listes principales (objectif: p95 raisonnable, à préciser en env staging).

## P0 — Implémentation de référence (Programme Cockpit)
- **Contrat**: `services/programmeCockpitContract.ts` (`programme_cockpit.v1`, `modelVersion=1`)
- **Projector**: Edge Function `supabase/functions/programme-cockpit-rebuild/index.ts`
- **Consommation UI**: `services/programmeCockpitService.ts` + wiring minimal `components/ProgrammeModule.tsx`
- **Watermarks**:
  - `domain_events.occurred_at` (aggregate programme)
  - `max(updated_at)` sur sources (budget/actions/terrain/dépenses)

## Stratégie de test
- **Integration**: tests multi-tenant sur endpoints read-models (org A vs org B).
- **Perf**: tests de charge modestes sur listes (pagination) + vérification indexation côté DB (sans écrire de SQL exécutable dans ce ticket).
- **E2E**: Mission Control v1 charge listes/détails sans erreurs et avec tri stable.
