# Module Maturity Matrix — COYA

Légende : **M** = Mature · **A** = Avancé · **P** = Partiel · **F** = Fragmenté · **G** = Gap majeur documenté

Les niveaux reflètent **code + UX + cohérence avec `domains/` + runtime**.

| Module | Vue(s) typique(s) | Maturité | Dette / friction | Canon `domains/` |
|--------|-------------------|----------|------------------|------------------|
| **Dashboard** | `dashboard` | A | Gros composant, mélange métriques / navigation | `core`, `analytics` (partiel) |
| **Programmes & Projets** | `programmes_projects`, `programme`, `projects`, `project_workspace` | A | `ProjectDetailPage` > 3000 lignes ; workspace MAKE aligné | `projects` ✓ |
| **Planning** | `planning` | A | Fort couplage données RH / réunions | `projects`, `hr` (croisé) |
| **RH** | `rh`, `employee_workspace` | A | Legacy onglets + **Workforce Live** + workspace employé ; paie encore « outil » | `hr` ✓ (riche) |
| **Temps / Présence** | `time_tracking` + docks globaux | P→A | Runtime présence partagé ; segment fin vs session à affiner | `hr/attendance-runtime.md` |
| **Finance** | `finance` | P | Module volumineux, logique dispersée | `finance` ✓ |
| **Comptabilité** | `comptabilite` | P | P | `finance` |
| **CRM** | `crm_sales` | P | P | `crm` ✓ |
| **Formations** | `courses`, … | P | P | (moins détaillé dans `domains/`) |
| **Messagerie / IT / Logistique / Parc** | vues dédiées | P–F | Souvent écran autonome vs workspace canon | Partiel |
| **Documents / Drive** | `drive`, … | P | P | `documents` ✓ |
| **Objectifs** | `goals_okrs` | P | P | croisement `projects` |
| **Workflow moteur** | (transverse) | P | Cycle impératif ; pas encore bus unique métier | `workflows` ✓ |
| **Domain runtime projet** | (transverse) | A | Bus + `domain_events` côté projet | `projects` + `services/domain` |

## Synthèse

- **Forces** : canon `domains/` étendu ; **workspace projet** et **RH Workforce / employé** en progression ; **domain_events** pour le fil projet.
- **Faiblesses** : **App.tsx** et **quelques modules** très volumineux ; **event-driven** pas homogène hors projet ; **paie / pipeline** encore en retard vs canon RH.
