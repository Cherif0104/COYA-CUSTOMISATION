# RH-5 — Attendance Runtime Engine

## Doctrine

Le cœur métier n’est **pas** une ligne « journée » mutable (`daily_presence_row` mental model), mais un **runtime de session** alimenté par des **événements append-only**.  
Toute métrique affichée (retards, HS, scores, exports, paie) est une **projection** de ces événements, filtrée par les **policies** et les **validations**.

Identité canonique salarié côté runtime : **`employeeProfileId`** (= `profiles.id` / `Employee.profileId`) — unifie auth, présence, audit, analytics.

## 1. Agrégat racine : `PresenceSession`

Une session représente une **continuité de travail** (une « journée » ou un segment explicite), avec bornes temporelles et contexte.

| Champ | Rôle |
|--------|------|
| `id` | Identifiant stable session |
| `organizationId` | Tenant |
| `employeeProfileId` | **Canon** (préféré à un seul `userId` pour corrélation RH) |
| `startedAt` / `endedAt` | Bornes ISO ; `endedAt` null = session ouverte |
| `source` | Origine (`widget`, `mobile`, `api`, `import`, `system`, …) |
| `device` | Identifiant device optionnel (hash / type) |
| `ip` / `timezone` | Audit & interprétation locale des horaires |
| `currentStatus` | État dérivé du dernier événement pertinent (voir `states.md`) |
| `productivityScore` | Projection optionnelle (jamais source de vérité seule) |
| `validatedBy` | Dernière validation manager / RH sur la session (référence profil), si applicable |

**Legacy aujourd’hui** : `PresenceSession` / `PresenceStatusEvent` dans `types.ts` — migration **strangler** : enrichir puis converger vers ce modèle sans casser l’UI existante.

## 2. Journal append-only : `PresenceEvent`

Les transitions et faits sont **immutable** ; une correction = **nouvel événement** (ou événement compensateur) + trace audit.

| Champ | Rôle |
|--------|------|
| `id` | Identifiant événement |
| `sessionId` | FK `PresenceSession` |
| `organizationId` | Tenant |
| `employeeProfileId` | Redondance contrôlée pour requêtes analytics |
| `type` | Voir enum ci-dessous |
| `occurredAt` | Horodatage effectif (UTC stocké, affichage TZ policy) |
| `metadata` | JSON typé (durée, ref réunion, geo hash, motif, ids tickets, etc.) |
| `correlationId` | Lien transversal (`projects`, `planning`, `documents`) — voir [event-catalog](../shared/event-catalog.md) |

### Types d’événements (canon code)

Noms stables **SNAKE** ou **Pascal.Case** selon convention bus ; à aligner avec [events.md](./events.md).

| Type | Sens métier |
|------|-------------|
| `CLOCK_IN` | Entrée / début de journée ou segment |
| `CLOCK_OUT` | Sortie / fin segment |
| `BREAK_START` / `BREAK_END` | Pause |
| `MEETING_START` / `MEETING_END` | Réunion (lien `meetingId` en metadata) |
| `IDLE_DETECTED` | Inactivité prolongée (seuil policy) |
| `TECHNICAL_ISSUE` | Incident poste / coupure |
| `MISSION_OUTSIDE` | Mission / déplacement |
| `OVERTIME_REQUESTED` | HS détectée ou demandée |
| `OVERTIME_APPROVED` / `OVERTIME_REJECTED` | Décision manager |
| `MANAGER_OVERRIDE` | Exception tracée (qui, quoi, pourquoi) |

Les événements **domaine** plus larges (`LeaveRequest.*`, `WorkEvidence.*`, …) restent dans le catalogue global ; la **timeline workspace** les fusionne par `occurredAt` + filtres.

## 3. Moteur de calcul temps (projections)

Le moteur **ne persiste pas** obligatoirement chaque minute en base : il peut **matérialiser** des snapshots (cache, table de projection) invalidés quand de nouveaux événements arrivent.

Champs cibles (read model « journée / session ») :

| Agrégat | Description |
|---------|-------------|
| `workedMinutes` | Temps total dans états « travail effectif » |
| `productiveMinutes` | Sous-ensemble (hors réunion si policy l’exclut, etc.) |
| `meetingMinutes` | Réunions |
| `breakMinutes` | Pauses |
| `idleMinutes` | Inactivité comptée |
| `lateMinutes` | Retard vs policy `expectedWorkStartTime` |
| `overtimeMinutes` | HS **détectée** (brut) |
| `validatedOvertimeMinutes` | HS **approuvée** (manager / policy) |

### Overtime : trois couches (obligatoire pour paie / audit)

| Concept | Rôle |
|---------|------|
| **detected_overtime** | Calcul brut à partir des événements + fenêtre de travail |
| **validated_overtime** | Après `OVERTIME_APPROVED` (ou règle auto si policy) |
| **paid_overtime** | Sous-ensemble exporté vers **PayrollProjection** (période, contrat, barème) |

Sans cette séparation, la paie devient **inauditable** et les litiges ingérables.

## 4. Policies Engine (bloquant pour scaler)

Les règles **ne doivent pas** être codées en dur dans chaque écran. Héritage typique :

```txt
country → company → department → contract → employee
```

Référence : [policies.md](./policies.md), [HrAttendancePolicy](../../types.ts) (à faire évoluer vers le schéma cible : `lateToleranceMinutes`, `maxBreakMinutes`, `overtimeRequiresApproval`, `idleThresholdMinutes`, …).

## 5. Timeline unifiée (workspace)

Une seule **vue chronologique** pour le salarié / le manager : événements présence + journal + tickets + validations, triés par `occurredAt`, avec badges source et lien inspecteur.

## 6. Ordre d’implémentation recommandé

| Sous-ID | Livrable |
|---------|----------|
| **RH-5.1** | Bus / persistance **événements append-only** + corrélation |
| **RH-5.2** | **Time computation engine** (projections + invalidation) |
| **RH-5.3** | **Policies engine** (résolution hiérarchique + tests) |
| **RH-5.4** | **Attendance analytics** (read models cockpit + workspace onglet Présence) |

## 7. Ce qui attend volontairement

- **Payroll** : uniquement en tant que **PayrollProjection** alimentée par événements + policies + validations — voir roadmap [overview.md](./overview.md) ; **pas** de `calculateSalary(employee)` monolithique.

## 8. Lien code applicatif

- UI : [workspace-contract.md](./workspace-contract.md) (`/hr/employees/:profileId`)
- Types runtime actuels : `PresenceSession`, `PresenceStatusEvent` dans `types.ts` — documenter chaque étape de convergence dans les PR (strangler).
