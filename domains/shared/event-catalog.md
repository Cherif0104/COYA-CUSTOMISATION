# Registre des événements COYA (Event Naming Registry)

**Normatif.** Si un événement n’est pas listé ici, il ne doit pas être émis vers le bus / l’event store (sauf phase expérimentale explicite `experimental` + issue de stabilisation).

Convention de nom : **`Aggregate.Action`** en **PascalCase** avec **Anglais** stable pour le `event_type` (payload peut rester multilingue côté UI).

| event_type | Owner domaine | schema_version (payload) | Stabilité | Persisté (`domain_events`) | Notes |
|------------|---------------|---------------------------|-----------|----------------------------|--------|
| `Task.StatusChanged` | `projects` | 1 | **stable** | oui | Transition statut tâche ; payload : `projectId`, `taskId`, `from`, `to`, `taskTitle?` — voir `services/domain/events/projectDomainEvents.ts` |
| `Project.HealthRecalculated` | `projects` (projection) | 1 | **experimental** | oui | Dérivé policy ; peut évoluer (champs score). `causation_id` = parent `Task.StatusChanged` |
| *(réservé)* `Project.BudgetThresholdCrossed` | `finance` → `projects` | — | planned | futur | Événement **integration** cross-domain |
| *(réservé)* `JournalEntry.Posted` | `finance` | — | planned | futur | Entrée comptable validée |

## Champs enveloppe (tous événements persistés)

Voir `DomainEventEnvelope` dans `services/domain/envelope.ts` : `eventId`, `type`, `occurredAt`, `schemaVersion`, `organizationId`, `actorId`, `source`, `payload`, `correlationId`, `causationId`.

## Évolution / upcasting

- Toute rupture de forme payload : **incrémenter** `schema_version` (colonne + enveloppe) et documenter la migration ici.
- Les consommateurs doivent accepter **N** versions en lecture jusqu’à migration complète (upcasting).

## View models (affichage)

Les libellés utilisateur pour la timeline ne reprennent pas brut `event_type` : utiliser `formatProjectDomainEventViewModel` (`services/domain/viewModels/formatProjectDomainEvent.ts`) et étendre ce fichier quand un nouvel `event_type` devient visible en UI.

## Anti-patterns (interdits)

- Événements UI bruts : `ButtonClicked`, `TabChanged`, `ModalOpened`.
- Doublons sémantiques : deux noms pour le même fait métier.
