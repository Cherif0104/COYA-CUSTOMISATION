# Human Capital — canon domaine COYA

Ce dossier décrit le **bounded context RH** tel qu’il doit converger : **HCM / HRIS / Workforce Intelligence**, pas une simple collection de formulaires.

## Artefacts (canon)

| Fichier | Rôle |
|---------|------|
| [overview.md](./overview.md) | Vision, chaîne de valeur Temps → Paie, roadmap |
| [events.md](./events.md) | Catalogue événements métier (bus / audit / read models) |
| [commands.md](./commands.md) | Commandes write-side (CQRS) |
| [policies.md](./policies.md) | Moteur de politiques (pays, entité, dépt, contrat) |
| [states.md](./states.md) | États présence, contrat, congé, run paie |
| [workflows.md](./workflows.md) | Orchestrations N+1, renouvellement, clôture |
| [aggregates.md](./aggregates.md) | Racines d’agrégation |
| [read-models.md](./read-models.md) | Projections UI (cockpit, workspace, analytics) |
| [workspace-contract.md](./workspace-contract.md) | UX workspace employé (type projet) |
| [attendance-runtime.md](./attendance-runtime.md) | **RH-5** — moteur présence (session, événements, temps, overtime) |
| [automation-rules.md](./automation-rules.md) | Règles automatiques transverses |
| [permissions.md](./permissions.md) | RBAC / scopes |
| [kpis.md](./kpis.md) | Indicateurs cockpit |

## Priorités d’implémentation (alignement produit)

| ID | Livrable |
|----|----------|
| **RH-1** | Canon `domains/hr/` + runtime événements ([event-catalog](../shared/event-catalog.md), `domain_events`) |
| **RH-4** | **Employee Workspace** — route `/hr/employees/:profileId`, shell hero / KPI / pills / inspector / timeline ([workspace-contract.md](./workspace-contract.md)) |
| **RH-5** | **Attendance Runtime Engine** — session + événements append-only + calcul temps ([attendance-runtime.md](./attendance-runtime.md)) |
| **RH-5.1** → **5.4** | Événements → calcul temps → policies → analytics (détail dans [attendance-runtime.md](./attendance-runtime.md)) |
| **RH-6** | **Payroll projection** (variables / validations / clôture — **pas** calculateur monolithique) |
| **RH-7** | **Workforce intelligence** (risques, fiabilité, staffing, corrélation performance) |
| **—** | **Workforce Cockpit** (homepage RH exécutive) : read models au-dessus de RH-5 / RH-7 |
| **—** | **Policies Engine** transverse : bloquant pour RH-5.3 ; héritage pays → société → département → contrat |

## Références transverses

- [WORKSPACE-UX-CONTRACT](../../docs/enterprise-canon/WORKSPACE-UX-CONTRACT.md)
- [event-catalog](../shared/event-catalog.md) — classification globale
- Domaines voisins : [projects](../projects/), [workflows](../workflows/), [finance](../finance/)
