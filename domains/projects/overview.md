# Domaine — Programmes & Projets

## Vision métier

Pilotage **stratégique** (programmes, financements, bailleurs, objectifs) et **exécution** (projets, activités, tâches, ressources, budgets, risques). Ce domaine est le **pivot opérationnel** de COYA pour ONG / institutions / entreprises.

## Objectifs mesurables

- Visibilité unique sur **santé**, **échéance**, **budget**, **charge** par projet.
- Traçabilité des **décisions** et **validations** liées au projet.
- Alignement tâches ↔ planning ↔ ressources humaines (interfaces avec `hr`).

## Périmètre

**Inclus** : programme, projet, activité (terrain), tâche, jalons, risques projet, budget projet (en lien avec `finance`), documents rattachés au projet (référence `documents`).

**Exclu** : comptabilisation OHADA détaillée (`finance`), fiche paie (`hr`), pipeline commercial pur (`crm`).

## Workspace canon (projet)

Onglets contextuels recommandés : Cockpit · Activités · Tâches · Planning · Équipe · Budget · Documents · Historique · Performance.

Voir `workspace-contract.md` pour le détail par zone UX.

## Dépendances inter-domaines

| Domaine | Interaction |
|---------|-------------|
| `core` | organisations, utilisateurs, audit |
| `hr` | charge, disponibilité, affectations |
| `finance` | budget, imputations, dépenses |
| `documents` | pièces, contrats, rapports |
| `workflows` | événements transverses (retard, dépassement, validation) |
| `analytics` | agrégation KPI cockpit |
