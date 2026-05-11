# Contrat workspace — Employé (Employee Workspace)

Référence UX globale : [WORKSPACE-UX-CONTRACT](../../docs/enterprise-canon/WORKSPACE-UX-CONTRACT.md).

## Objectif

Remplacer la **fiche employé verticale monolithique** par un **workspace objet** au même niveau de finition qu’un **projet** : hero, KPI strip, pills, zone principale, inspector, états vides explicites.

## Route canonique (figée)

```txt
/hr/employees/:profileId
```

**`:profileId`** = `profiles.id` = `Employee.profileId` — identifiant unique pour auth, présence, permissions, journal, paie runtime, analytics et audit (pas l’id interne `employees.id` dans l’URL).

## Structure

```txt
EmployeeWorkspace
├── Hero (identité, statut contrat, CTA contextuels)
├── KPIStrip (présence, congés, charge, dernière paie, alertes)
├── PillTabs
│   ├── Overview      — synthèse & prochaines actions
│   ├── Attendance    — timeline présence + anomalies
│   ├── WorkJournal   — preuves journée (Work Evidence)
│   ├── Payroll       — slips, simulation, demandes
│   ├── Performance   — score & objectifs & feedback
│   ├── Documents     — coffre-fort RH typé
│   ├── Leave         — soldes & demandes
│   ├── Career        — parcours, formations, certifications
│   ├── Access        — rôles, accès, sécurité
│   └── History       — flux domain events (comme Historique projet)
└── Inspector (optionnel) — sélection ligne liste / événement
```

## Principes

- **Pas** de long formulaire comme page unique : édition = **drawer** ou **panneau** contextuel.
- Actions destructrices ou contractuelles : **confirmation** + traçabilité.
- Données sensibles : masquage progressif + audit (`documents`, `core`).

## Cohérence runtime

Chaque onglet consomme des **read models** ([read-models.md](./read-models.md)) alimentés par les **événements** ([events.md](./events.md)) ; les mutations passent par des **commandes** ([commands.md](./commands.md)).

## Liste employés (niveau au-dessus)

- KPI strip global + filtres + **inspector** fiche courte (sélection ligne).
- Cohérent avec **Workforce Cockpit** (même design system).
