# Programme Cockpit — Consommation UI (P0)

## Objectif
Standardiser la consommation UI du read-model `programme_cockpit.v1` afin d’éviter:

- recalculs ad hoc côté UI,
- requêtes N+1,
- divergence de KPIs entre pages.

## Artefacts implémentés
- **Contrat TS**: `services/programmeCockpitContract.ts`
- **Service UI**: `services/programmeCockpitService.ts`
- **Wiring minimal**: `components/ProgrammeModule.tsx` (tab “Résumé”)

## Pattern recommandé
### 1) Lecture (read-only)
```ts
import { getProgrammeCockpitReadModel } from '../services/programmeCockpitService';
const model = await getProgrammeCockpitReadModel(programmeId);
```

### 2) Rebuild (à la demande P0)
```ts
import { rebuildProgrammeCockpit } from '../services/programmeCockpitService';
await rebuildProgrammeCockpit(programmeId);
```

## UX P0 (déjà en place)
- Dans `ProgrammeModule` / onglet “Résumé”:
  - un bouton **Rebuild cockpit**
  - un mini résumé (risque, budget, alertes)
  - si aucun snapshot: message + rebuild.

## Évolution P1 (sans changer l’UI)
- Rebuild automatique si snapshot absent/stale (ex: > 15 min).
- Dégradation affichée via `model.sync.projectorStatus`.
- Liste d’alertes cliquables vers entités (actions, lignes budget, activités).

