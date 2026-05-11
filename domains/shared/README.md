# Gouvernance transverse — événements & politiques

Ce dossier **ne remplace pas** les fichiers `events.md` par domaine : il **centralise** les règles globales pour éviter le **chaos événementiel** (naming, classification, ownership, politiques orchestrées).

| Document | Rôle |
|----------|------|
| [event-catalog.md](./event-catalog.md) | Registre officiel des noms d’événements, versions, owners, stabilité |
| [event-classification.md](./event-classification.md) | Domain vs Integration vs Internal — quand utiliser quoi |
| [event-policies-registry.md](./event-policies-registry.md) | Registre des policies (déclencheur → effets) |

## Code associé

- Runtime : `services/domain/`
- Lecture timeline : `listDomainEventsForProject` dans `services/domain/domainEventQueries.ts`

## Règle de contribution

Tout **nouvel** `event_type` ou policy orchestrée : mettre à jour ce dossier **dans la même livraison** que le code (ou PR liée).
