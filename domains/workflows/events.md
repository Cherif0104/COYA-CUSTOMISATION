# Événements — Workflows (enveloppe)

## Méta-événements orchestration

| Événement | Description |
|-----------|-------------|
| `Workflow.RuleMatched` | Règle déclenchée |
| `Workflow.ActionExecuted` | Action appliquée (avec idempotence key) |
| `Workflow.ActionFailed` | Échec + retry policy |

## Catalogue métier

Le catalogue **métier** est **dispatché** par domaine (`projects/events.md`, `finance/events.md`, …).  
Le bus transporte un **enveloppe** commune : `eventId`, `type`, `occurredAt`, `orgId`, `actorId`, `payload`, `schemaVersion`.
