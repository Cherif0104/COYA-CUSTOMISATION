# Workflows — Programmes & Projets

## Définition

Un **workflow** ici = enchaînement **métier** de transitions et d’effets de bord (notifications, blocages, recalculs), pas le seul moteur TypeScript actuel.

## Workflows canon

### WF-PRJ — Lancement projet

1. Vérification budget / bailleur disponible (`finance` en lecture).
2. `Project.Created` → membres notifiés.
3. Cockpit initialisé (read model).

### WF-TSK — Cycle de vie tâche

1. Création (`draft` ou `todo`) selon règle org.
2. Assignation → `Task.Assigned` → mise à jour charge (`hr` en consommation).
3. Passage `in_review` → file de validation responsable projet.
4. `done` → recalcul progression projet (`Project.HealthRecalculated`).

### WF-RISK — Alerte retard / blocage

1. `Task.DueDateBreached` ou tâche `blocked`.
2. Notification CP + option création **incident** (`workflows` transverse).
3. Mise à jour santé cockpit.

## Points d’intégration `workflowEngine`

- Aujourd’hui : logique **transversale** dans `services/workflowEngine.ts`.
- Cible : ce domaine **publie** des événements ; l’orchestrateur **souscrit** et applique les règles ci-dessus.
