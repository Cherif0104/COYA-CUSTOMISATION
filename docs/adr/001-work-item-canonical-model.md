# ADR 001 — Modèle canonique WorkItem (exécution)

## Statut

Accepté (direction produit + technique), mise en œuvre progressive.

## Contexte

COYA expose plusieurs surfaces métier pour « faire avancer le travail » : tâches projet, actions programme, activités terrain, créneaux de planification, réunions, tickets IT, demandes véhicule, sessions de formation, demandes DAF, etc. Sans cadre commun, l’UX et l’IA décisionnelle restent fragmentées.

## Décision

Introduire un **concept canonique WorkItem** au niveau applicatif :

- **Kind** : discriminateur (`WorkItemKind` dans `types.ts`).
- **Référence** : `WorkItemCanonicalRef` = `{ kind, storageTable, id, organizationId? }`.
- **Persistence actuelle** : une ligne par variante dans la table indiquée par `WORK_ITEM_STORAGE_BY_KIND` (cartographie évolutive).

Les écrans et modules restent des **vues spécialisées** ; les workflows et le bus d’événements (`domain_events`) doivent progressivement référencer ce référentiel.

## Conséquences

- Les nouvelles fonctionnalités d’« exécution » doivent soit étendre `WorkItemKind` + mapping, soit être explicitement justifiées comme hors périmètre.
- Les fusions de modules (MERGE) visent à réduire le nombre de tables « racines » équivalentes, pas à multiplier les menus.
- Le journal `domain_events` reste la trace transverse ; les agrégats cockpit (ex. `programme_cockpit_read_models`) en sont des projections.

## Références code

- `types.ts` : `WorkItemKind`, `WorkItemCanonicalRef`, `WORK_ITEM_STORAGE_BY_KIND`
- `supabase/migrations/20260506140000_domain_events_event_store.sql`
- `services/programmeCockpitContract.ts`
