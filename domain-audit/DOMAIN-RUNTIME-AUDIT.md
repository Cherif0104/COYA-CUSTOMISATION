# Domain Runtime Audit — COYA

## 1. Périmètre

Analyse de la **cohérence métier** vs **`domains/*`** et de la **dispersion de la logique** (React vs services vs runtime).

## 2. Agrégats métier

| Domaine | Agrégats explicites (doc) | Implémentation réelle |
|---------|----------------------------|-------------------------|
| **Projets** | Projet, tâches, budget (canon) | `types.ts` + `ProjectDetailPage` ; commandes `applyTaskStatusChange` |
| **RH** | Employé, session présence, paie (cible) | `Employee`, `PresenceSession`, `PresenceStatusEvent` ; paie surtout **UI + services** |
| **Finance** | Factures, budgets (canon) | `Finance.tsx`, services finance — **peu de pont** vers `domain_events` |
| **CRM** | Contacts, opportunités | Composants + services CRM |

**Agrégats implicites** : « journée de travail », « cockpit projet » — calculés dans des services (`hrAnalyticsService`, `projectCockpitReadModel`) plutôt que comme agrégats nommés persistés.

## 3. États métier

- **Tâches / projets** : transitions partiellement centralisées (`isAllowedTaskStatusTransition`, policies projet).
- **Présence** : `PresenceStatus` + sessions ; **pas encore** machine à états unique `CONNECTED / IDLE / …` du canon RH-5 (voir `domains/hr/states.md` vs `types.ts`).
- **Congés** : statuts `LeaveRequest` ; validations dans UI + workflow cycle.

**Risque** : mutations **directes** dans React (setState + DataAdapter) côte à côte avec des chemins « domain » (projets).

## 4. Workflows

- **workflowEngine** : règles opérationnelles **impératives** (scan → actions) ; utile mais **distinct** du bus `services/domain`.
- **RH** : Workforce Live + liste employés + workspace ; **Temps & Présence** analytique — cohérence **en amélioration** ; corrélation **projet ↔ temps** encore partielle côté UX.

## 5. Événements

| Source | Utilisation |
|--------|-------------|
| **`domains/*/events.md`** | Catalogue cible riche |
| **`domain_events` (DB)** | Alimenté pour **événements projet** persistés |
| **Présence** | Événements **techniques** (`PresenceStatusEvent`) vs **métier CLOCK_IN** (canon `attendance-runtime.md`) — **écart documenté** |

**Spaghetti potentiel** : deux « philosophies » (workflowEngine vs domain bus) sans frontière écrite pour les contributeurs.

## 6. Policies

- **Projets** : `projectPolicies.ts` — bon pattern.
- **RH** : `HrAttendancePolicy`, `PresencePolicy` dans `types` / defaults — **pas** encore moteur d’héritage pays → société → employé (canon `domains/hr/policies.md`).

## 7. Permissions

- **Frontend** : `useModulePermissions`, `viewModuleMap`, garde dans `App.tsx`.
- **Risque ERP** : toute règle **uniquement** côté UI doit être **doublée** par RLS / API — à valider par revue Supabase (hors périmètre exhaustif de ce document).

## 8. Synthèse & écarts canon

| Sujet | Écart |
|-------|--------|
| Event-driven | Riche **projet** ; **RH / finance** surtout procédural |
| Command layer | Existe pour **tâches** ; généralisation **à planifier** |
| Read models | Cockpit projet structuré ; RH **en construction** (Workforce Live = read UI, pas encore projection persistée dédiée) |

**Action** : aligner les **prochaines features** sur `domains/hr/attendance-runtime.md` et sur l’extension du **bus** (ou contrat clair workflowEngine ↔ domain).
