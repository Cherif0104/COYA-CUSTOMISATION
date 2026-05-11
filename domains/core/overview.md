# Domaine — Core Platform

## Vision

Socle **multi-tenant** : organisations, utilisateurs, rôles, permissions, audit, notifications, présence, configuration — tout ce sans quoi les domaines métier ne peuvent pas garantir **sécurité** ni **cohérence**.

## Périmètre

- Organisations (ONG, entreprise, institution) et paramètres.
- Utilisateurs, profils, appartenances, invitations.
- RBAC + scopes ; alignement **RLS Supabase**.
- Journal d’audit, logs d’activité.
- Notifications transverses (canal, préférences).
- Temps réel / présence si applicable au socle.

## Non-objectifs

- Règles métier **projet** ou **écriture comptable** (domaines dédiés).

## Interfaces

Fournit identité et contexte (`orgId`, `userId`, rôles) à **tous** les autres domaines.

## Modules plateforme vs modules scopés

La plateforme distingue :

- **Platform modules** (toujours accessibles) — ex. `dashboard`, `settings`
- **Scoped modules** (périmètre département / policy) — ex. `finance`, `crm`, `rh`
- **Runtime global** (auth, présence, navigation) vs **runtime scoped**

Référence : [platform-modules.md](./platform-modules.md).
