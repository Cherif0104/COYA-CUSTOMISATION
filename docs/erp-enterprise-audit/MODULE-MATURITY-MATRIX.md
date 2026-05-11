# Module Maturity Matrix — COYA

Légende : **M** = Mature · **A** = Avancé · **P** = Partiel · **F** = Fragmenté · **G** = Gap majeur

| Module | Vues / zones | Maturité | Risques & dettes | Notes |
|--------|--------------|----------|------------------|------|
| Dashboard | `dashboard` | A | composant massif, guard/scope | module “plateforme” |
| Projets | `projects`, `/projects/:id` | A | `ProjectDetailPage` très volumineux | runtime `domain_events` amorcé |
| Planning | `planning` | A | couplage cross-modules (RH/congés) | bon levier “ops” |
| RH (Workforce OS) | `rh`, `/hr/employees/:profileId` | A | paie encore en retard vs canon | **Workforce Live** très fort |
| Temps/Présence | docks + `time_tracking` | P→A | session vs segments, policies à consolider | chrono & pointage global OK |
| Finance | `finance` | P | risque critique (réglementaire, volumineux) | à refondre après boundary + command layer |
| Comptabilité | `comptabilite` | P | idem finance | |
| CRM | `crm_sales` | P | UX/workspace à renforcer | |
| Documents/Drive | `drive` | P | scope ACL département/projet présent | |
| Analytics | `analytics` | P | read models implicites | |
| Workflows | `workflowEngine` | P | double moteur, règles ad hoc | clarifier boundary |
| Runtime domaine (projets) | `services/domain/*` | A | non généralisé à RH/finance | pattern solide |

## Synthèse

- **Forces** : Workspaces (projet + employé), direction Workforce, canon `domains/`.
- **Faiblesses** : mega-composants, App.tsx central, finance exposée, double moteur runtime.

