# Domain Runtime Audit — COYA (écarts canon vs exécution)

## 1) Transition de 2 architectures

| Ancien monde | Nouveau monde |
|---|---|
| CRUD React + services dispersés | runtime métier (commands/events/policies) |
| mutations directes UI | mutations via commandes |
| “read models implicites” | projections explicites |
| pages monolithiques | floorplans workspaces |

Le risque principal n’est pas le legacy : c’est la **divergence** (3 systèmes concurrents).

## 2) Agrégats (réalité)

- **Projets** : tâches + gouvernance de transitions (commande + policy) **en place**.
- **RH** : employé workspace + présence ; canon RH-5 défini mais runtime append-only non encore généralisé.
- **Finance/CRM** : dominés par logique UI/services ; canon présent mais exécution incomplète.

## 3) États & transitions

- Projets : transitions partiellement centralisées.
- RH présence : `PresenceStatus` + sessions ; machine à états cible plus riche à converger.

## 4) Workflows

`workflowEngine` orchestre des actions transverses ; utile mais doit rester **automation système**, pas **write-side métier**.

## 5) Événements / policies / permissions

- `services/domain/*` : solide pour projets.
- Departments scope : désormais frontière claire `user.id` vs `profileId` et modules plateforme.

## 6) Recommandations P0–P1

1. **Runtime boundary** (document normatif) : qui fait quoi entre `workflowEngine` et `services/domain`.
2. RH : introduire `PresenceEvent` append-only en strangler autour de l’existant.
3. Extraire un `services/security/*` pour centraliser identité/scope/policies (éviter logique d’accès dans UI).

