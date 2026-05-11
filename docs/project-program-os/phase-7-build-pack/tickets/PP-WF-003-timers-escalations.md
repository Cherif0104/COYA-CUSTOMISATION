# PP-WF-003 — Timers & escalations (workflow fiable)

- **Priorité**: P1
- **Dépendances**: PP-WF-002, PP-DB-003, PP-OBS-001, PP-NOTIF-002
- **Owner**: Backend (placeholder)
- **Estimation**: L

## Objectif
Implémenter les timers et mécanismes d’escalation des workflows (PHASE 2): délais, SLA, relances, changement d’assignation, et transitions automatiques — de manière idempotente, auditable et observable.

## Périmètre / non-objectif
- **Périmètre**:
  - Modèle “timer” persistant: `due_at`, `timer_type`, `workflow_instance_id`, état (scheduled/fired/cancelled).
  - Worker/runner: déclenchement à échéance, backoff/retries, idempotence par `event_id`.
  - Escalations: relance, notification, reassign, passage à un état “overdue” selon règles.
  - Audit: chaque déclenchement produit un événement immuable (workflow_events/outbox).
- **Non-objectif**:
  - UI complète de paramétrage (peut être read-only dans FE-004).
  - Notification provider détaillé (voir NOTIF-001).

## Acceptance criteria
- ✅ Un workflow peut définir au moins 2 timers (ex: “reminder”, “overdue”) et ils se déclenchent au bon moment.
- ✅ Rejouer le worker (crash/restart) ne crée pas de double escalade (idempotence prouvée).
- ✅ Les timers respectent l’isolation tenant; aucun timer d’un tenant ne peut impacter un autre.
- ✅ Des métriques/logs existent: timers scheduled, fired, retries, failures, “workflow stuck”.

## Stratégie de test
- **Unit**: calcul des échéances, annulation timer, règles d’escalade.
- **Integration**: temps simulé (clock) + crash/restart du worker; vérification des événements immuables.
- **Chaos**: injection latence/erreurs DB → retries; absence de double firing.
