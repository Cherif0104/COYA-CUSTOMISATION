# Domaine — Human Capital & Workforce Runtime

## Positionnement

Le module RH COYA vise un **Human Capital Workspace** : même niveau d’ambition qu’un **HCM / HRIS / Workforce Intelligence** — données fiables, temps quasi réel, managers au centre, **événements métier** comme fil conducteur.

Ce n’est **pas** une juxtaposition de pages (`salariés`, `congés`, `paie`) sans runtime commun.

## Chaîne de valeur cible (ordre logique)

```txt
Présence / connexion
  → Temps travaillé & preuves (journal)
  → Activité projet / tâches (corrélation)
  → Validation manager
  → Politiques RH (retard, pause, heures sup, pays)
  → Variables de paie
  → Simulation paie
  → Clôture période
  → Bulletin PDF (template société)
  → Écriture comptable (finance)
```

Toute l’UI et les intégrations doivent **ressortir** de cette chaîne (pas l’inverse).

## Périmètre fonctionnel (cible)

- **Workforce Cockpit** : KPIs exécutifs (présents, absences, retards, charge, HS, contrats, congés, masse salariale projetée, alertes).
- **Employees** : liste + **Employee Workspace** par **`profileId`** canon (`/hr/employees/:profileId`).
- **Attendance Runtime Engine** ([attendance-runtime.md](./attendance-runtime.md)) : **session** + **événements append-only** + projections temps (dont **detected / validated / paid** overtime) ; corrélation planning, congés, réunions, missions.
- **Work Evidence Journal** : journée structurée (preuves, temps, validations, commentaires).
- **Payroll Engine** : runs, variables, ajustements, simulation, validation RH + finance, bulletins.
- **Leave & Absence** : workflows N+1, soldes, cohérence planning.
- **Performance** : score employé corrélé projets / présence / feedback (alimente bonus, promotion, alertes).
- **Recruitment, Learning, Organization, Contracts, Documents RH, Analytics, Policies** : documentés dans les fichiers du canon ; implémentation par vagues.

## Hors périmètre (court terme)

- Remplacement complet du legacy en un seul merge : **interdit** ; migration par **strangler fig** (nouveau runtime à côté de l’existant).

## Doctrine UI

Alignement **MAKE FIGMA / workspace COYA** : KPI strip, pills, workspace route, inspector, cards, timelines, split layouts — **pas** de long formulaire vertical unique comme surface principale.

## Liens fichiers

- Événements : [events.md](./events.md)
- Commandes : [commands.md](./commands.md)
- Politiques : [policies.md](./policies.md)
- Read models : [read-models.md](./read-models.md)
- Workspace employé : [workspace-contract.md](./workspace-contract.md)
- Moteur présence (RH-5) : [attendance-runtime.md](./attendance-runtime.md)
