# Registre des policies (orchestration)

**Normatif pour les effets orchestrés** liés au bus `DomainEventBus`. Toute nouvelle policy **métier** doit être ajoutée ici avant ou avec le code.

Format : **une ligne = une policy** identifiable.

| Policy ID | Déclencheur (`event_type`) | Fichier / fonction | Effets de bord | Idempotent | Notes |
|-----------|----------------------------|--------------------|-----------------|------------|--------|
| `CMD-PRJ-TASK-001` | *(commande)* patch tâche | `applyTaskStatusChange` | Validation gouvernance + enrichissement « Réalisé » + collecte `Task.StatusChanged` | n/a (commande) | `services/domain/commands/applyTaskStatusChange.ts` — entrée métier depuis l’UI |
| `POL-PRJ-001` | `Task.StatusChanged` | `applyTaskStatusChangedPolicy` | Recalcul read model cockpit (`buildProjectCockpitReadModel`) ; émission `Project.HealthRecalculated` avec `causation_id` | oui (même entrée `client_event_id`) | `services/domain/policies/projectPolicies.ts` |
| *(réservé)* `POL-FIN-001` | `JournalEntry.Posted` | — | Mise à jour variance budget projet ; `Project.HealthRecalculated` | — | Finance → projects |

## Règles transverses

1. **Pas** d’effet caché dans un composant React qui devrait être une policy (sauf pure UI).
2. Policies **courtes** : si > ~50 lignes ou multiples I/O, découper en sous-fonctions testables.
3. **Pas** d’orchestration circulaire : A → B → A interdit ; documenter le graphe si chaîne > 2 sauts.

## Lien avec `workflowEngine`

`runWorkflowCycle` (transverse, `services/workflowEngine.ts`) reste **parallèle** jusqu’à convergence : les nouvelles règles **orientées événements** doivent idéalement **réduire** la duplication et pointer vers ce registre.
