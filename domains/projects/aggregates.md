# Agrégats — Programmes & Projets

Une ligne = un **agrégat** ou sous-partie clairement bornée.

| ID | Agrégat | Racine persistance | Contenu / invariants | Notes |
|----|-----------|-------------------|----------------------|--------|
| PROG | Programme | `programme` (conceptuel) | Projets rattachés, bailleurs, objectifs stratégiques, indicateurs programme | Pilotage stratégique |
| PRJ | Projet | `project` | Tâches, équipe, planning, budget projet, risques, objectifs projet, rapports | Cœur exécution |
| ACT | Activité | `activity` (conceptuel) | Atelier, mission, formation, réunion — lien projet + ressources | Niveau terrain |
| TSK | Tâche | `task` / équivalent | Assignation, échéance, priorité, sous-tâches, dépendances, temps | Unité exécutable |
| MLST | Jalon | `milestone` | Date, statut, lien projet | Synchronisé cockpit |
| RISK | Risque projet | `risk` | Probabilité / impact, mitigation | Alerte cockpit |

## Règles transverses

- Une **tâche** appartient à un **projet** (ou activité si modèle hiérarchique retenu).
- Suppression logique préférée à la destruction ; états **Annulé** / **Gelé** plutôt que purge.
- Références **finance** et **documents** par ID stable (pas de copie métier dupliquée).

## Capacités métier (exemples à indexer)

| Capacité | Agrégat | Description courte |
|----------|---------|-------------------|
| CAP-PRJ-OPEN-COCKPIT | PRJ | Ouvrir workspace projet avec KPI cohérents |
| CAP-TSK-CHANGE-STATE | TSK | Transition d’état avec validation droits + audit |
| CAP-PRJ-BUDGET-VARIANCE | PRJ | Calcul variance prévu / réel (read model ou snapshot) |
