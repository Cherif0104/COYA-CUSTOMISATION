# Workforce Intelligence — couche `services/workforce`

Module transversal **Human Capital & Workforce Intelligence OS** : contrat d’événements d’activité canoniques et moteur léger en processus (sans démarrage obligatoire au chargement de l’app).

**Philosophie.** Mesurer la **contribution** et la **valeur** (contextes métier, chronologie consolidée), pas seulement « qui est connecté » — voir [BEHAVIORAL-TIMELINE-SESSION-MODEL.md](../../docs/workforce-os/BEHAVIORAL-TIMELINE-SESSION-MODEL.md).

## Documentation d’architecture

- Référence complète : [`docs/HUMAN-CAPITAL-WORKFORCE-INTELLIGENCE-OS-ARCHITECTURE.md`](../../docs/HUMAN-CAPITAL-WORKFORCE-INTELLIGENCE-OS-ARCHITECTURE.md)
- Index docs produit : [`docs/workforce-os/README.md`](../../docs/workforce-os/README.md)

## Couches (alignement document d’architecture)

| Couche | Rôle dans ce dossier | État |
|--------|----------------------|------|
| **Activity Event Engine** | Types `ActivityEvent`, verbes, dimensions ; émission et abonnements ; persistance append-only (noop / mémoire / **Supabase** `workforce_activity_events`). | MVP + persistance distante |
| **Adaptateurs** | Ponts depuis Présence, Time Tracking, tâches projet → événements canoniques. | **Branché** : présence (`presenceActivityBridge`), temps (`timeLogActivityBridge`, `App.handleAddTimeLog`), tâche complétée (`taskActivityBridge` ← `applyTaskStatusChange`). |
| **Read-models / analytics** | Agrégats, faits journaliers, KPIs. | Hors périmètre MVP code ici |

## Périmètre MVP (ce package)

- Union de **verbes** d’activité (pointage, sessions, temps, tâches, missions, imputation, feuilles de temps).
- **Références d’objets** typées : `project` \| `programme` \| `task` \| `client` \| `department` \| `objective`.
- **Pub/sub** synchrone in-process + interface **`ActivityEventPersistence`** (noop par défaut, implémentation mémoire fournie).
- Aucun impact sur le démarrage tant que l’app n’importe pas ce module ou n’appelle pas `emitActivityEvent` / `configureDefaultActivityEventPersistence`.

## Intégration (hooks branchés)

- **Présence** : `emitPresenceActivityEvents` depuis `PresenceContext.setStatus`, `StatusSelector`, `StatusSelectorModal`.
- **Temps imputé** : `emitTimeLogImputationEvent` après création d’un `TimeLog` dans `App.tsx`.
- **Dev** : `index.tsx` active `InMemoryActivityEventPersistence` + log `console.debug` des événements.

Prochaines étapes : validation feuilles de temps (`timesheet_validated`), missions terrain (`mission_*`), read-models agrégés, bus / replay.

**Persistance** : si Supabase est configuré, `index.tsx` enchaîne `SupabaseActivityEventPersistence` + `SupabaseTimelineSegmentPersistence` (`ChainedActivityEventPersistence`) — tables `workforce_activity_events` (`20260509120000`) et `workforce_timeline_segments` (`20260510120000`). Sinon en dev uniquement : `InMemoryActivityEventPersistence`.

**Consolidation** : `mergeOverlappingIntervals`, `consolidateIsoSegments`, `consolidateBySegmentKind`, `totalDurationMs` (`sessionConsolidationEngine.ts`).

**UI** : `hooks/useWorkforceDayTimeline.ts` + carte `components/workforce/WorkforceDayTimelineCard.tsx` sur le **Dashboard** (requête `DataService.listMyWorkforceTimelineSegmentsForDay` — segments créés par l’utilisateur connecté, jour local).

## Imports depuis l’application

Alias projet `@/*` (voir `tsconfig.json`) :

```ts
import {
  emitActivityEvent,
  subscribeActivityEvents,
  configureDefaultActivityEventPersistence,
  InMemoryActivityEventPersistence,
  type ActivityEvent,
  type WorkforceObjectRef,
} from '@/services/workforce';
```

Chemins relatifs équivalents : `from '../services/workforce'` selon l’emplacement du fichier appelant.
