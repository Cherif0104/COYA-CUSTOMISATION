# PHASE 2 — Temporal Flows (draft) — Governance

Objectif: décrire les flows **Temporal** (ou orchestration équivalente) nécessaires au Governance Engine, en pseudo-code, avec:
- commandes, signaux, timers
- idempotence (`event_id`)
- compensations/rollback (logique)
- intégration outbox (événements fiables)

Ce document est un **draft contractuel** pour PHASE 7.

---

## 1) Primitives (contrat)

### 1.1 Commandes (inputs synchrones)
- `RequestApproval(target, policy_key, context, event_id, correlation_id)`
- `CancelApproval(approval_id, reason, event_id)`
- `ReopenApproval(approval_id, reason, event_id)` (si autorisé)

### 1.2 Signaux (inputs asynchrones)
- `SignalApprove(approval_id, actor_id, step_key, comment, event_id)`
- `SignalReject(approval_id, actor_id, step_key, comment, event_id)`
- `SignalDelegate(approval_id, delegator_id, delegatee_id, scope, valid_to, reason, event_id)`
- `SignalOverride(approval_id, actor_id, reason, attachments, event_id)` (break-glass)
- `SignalComment(approval_id, actor_id, comment, event_id)`

### 1.3 Timers
- `SlaTimer(step_key, due_in)`
- `EscalationTimer(step_key, after)`

### 1.4 Idempotence
Règle: **toute commande/signal** doit être dédoublonnable:
- `event_id` unique par action
- stockage “processed events” (dans workflow events / audit / table dédiée)
- si `event_id` déjà traité → retourner “OK (no-op)”

### 1.5 Outbox
Règle: chaque transition/effet publie un événement via outbox:
- write DB transaction + insert `outbox_events` dans la même transaction
- un worker publie `outbox_events` vers bus/notifications

---

## 2) Flow principal — `ApprovalOrchestratorWorkflow`

Pseudo-code (Temporal-style):

```txt
workflow ApprovalOrchestratorWorkflow(input):
  # input: { approval_id, policy_key, target, context, correlation_id }

  state = "pending"
  policy = Activities.LoadPolicy(policy_key)  # from versioned store (git / table)

  Activities.WriteAudit("governance.approval.requested", ...)
  Activities.EnqueueOutbox("governance.approval.requested", ...)

  for step in policy.steps:
    resolved_assignees = Activities.ResolveAssignees(step, context)
    resolved_assignees = Activities.ApplyDelegations(resolved_assignees, context.now)
    Activities.AssignStep(approval_id, step.step_key, resolved_assignees)
    Activities.EnqueueOutbox("governance.step.assigned", { step_key, assignees })

    # timers
    start SlaTimer(step.step_key, step.sla.due_in)
    start EscalationTimers(step.step_key, step.sla.escalation[])

    step_result = wait_for_step_completion(step, approval_id)
    if step_result == "rejected":
      state = "rejected"
      Activities.MarkApproval(approval_id, "rejected")
      Activities.WriteAudit("governance.approval.rejected", ...)
      Activities.EnqueueOutbox("governance.approval.rejected", ...)
      return state

    if step_result == "overridden":
      state = "overridden"
      Activities.MarkApproval(approval_id, "overridden")
      Activities.WriteAudit("governance.approval.overridden", {break_glass:true, ...})
      Activities.EnqueueOutbox("governance.approval.overridden", ...)
      Activities.TriggerPostReview(policy.override.post_review_policy_key, approval_id)
      return state

  state = "approved"
  Activities.MarkApproval(approval_id, "approved")
  Activities.WriteAudit("governance.approval.approved", ...)
  Activities.EnqueueOutbox("governance.approval.approved", ...)
  return state
```

### 2.1 `wait_for_step_completion` (quorum + signaux)

```txt
function wait_for_step_completion(step, approval_id):
  approvals = set()
  rejections = set()

  while true:
    signal = wait SignalApprove|SignalReject|SignalOverride|Cancel|Timeout

    if signal.type == SignalOverride:
      if Activities.CheckPermission(signal.actor_id, "override", approval_id) == false:
        Activities.WriteAudit("governance.override.denied", ...)
        continue
      if Activities.IdempotenceCheck(signal.event_id) == "duplicate": continue
      Activities.RecordOverride(approval_id, signal)
      return "overridden"

    if signal.type == SignalReject:
      if Activities.CheckPermission(signal.actor_id, "reject", approval_id, step.step_key) == false: continue
      if Activities.IdempotenceCheck(signal.event_id) == "duplicate": continue
      Activities.RecordVote(approval_id, step.step_key, signal, vote="reject")
      return "rejected"  # reject stop by default

    if signal.type == SignalApprove:
      if Activities.CheckPermission(signal.actor_id, "approve", approval_id, step.step_key) == false: continue
      if Activities.IdempotenceCheck(signal.event_id) == "duplicate": continue
      Activities.RecordVote(approval_id, step.step_key, signal, vote="approve")
      approvals.add(signal.actor_id)
      if quorum_reached(step.quorum, approvals, Activities.CommitteeMembers(step, context)):
        Activities.CompleteStep(approval_id, step.step_key)
        Activities.EnqueueOutbox("governance.step.completed", {step_key})
        return "approved"
```

---

## 3) Gestion des timers (SLA / escalade)

### 3.1 Timer SLA (expiration)
Si `SlaTimer` atteint:
- marquer step “overdue”
- écrire audit + outbox `governance.step.overdue`
- déclencher plan d’escalade (si non déjà exécuté)

### 3.2 Escalation timers (actions)
Chaque entrée `escalation[]` (après N) déclenche:
- `notify`: envoi via Notification Engine (via outbox)
- `reassign`: recalcul assignees et assignation (outbox `step.reassigned`)
- `fallback`: assignation à un rôle “secours” (ex: `super_admin`)

Idempotence timers:
- clé stable: `approval_id + step_key + escalation_index`
- si action déjà appliquée → no-op

---

## 4) Délégation (flow séparé)

### 4.1 `DelegationManagerWorkflow` (optionnel)
Gère la création/expiration/révocation des délégations.

```txt
workflow DelegationManagerWorkflow(command):
  if command.type == CreateDelegation:
    assert CheckPermission(delegator, "delegate", scope)
    assert valid_to <= now + policy.max_validity_days
    assert delegatee_scope ⊆ delegator_scope
    assert delegatee.approval_limit <= delegator.approval_limit  # enforce_min_approval_limit
    write delegation row
    audit + outbox "governance.delegation.created"

  if command.type == RevokeDelegation:
    write revoked_at
    audit + outbox "governance.delegation.revoked"
```

---

## 5) Compensations / rollback (principes)

Le Governance Engine ne “rollback” pas une décision passée; il applique des **compensations**:
- `ReopenApproval`: rouvre une demande si policy le permet (audit + outbox).
- `Override`: compense un blocage en marquant l’état `overridden` + post-review.
- `CancelApproval`: annule un workflow en cours (ex: entité archivée).

Règle: les journaux restent immuables; la correction se fait par événements ultérieurs.

---

## 6) Intégration DB (draft, non-exécuté)

Sans exécuter de SQL, le runtime PHASE 7 devrait persister:
- `governance_approvals` (request/state/policy_key/target)
- `governance_approval_steps` (assignees, quorum, due dates, status)
- `governance_votes` (actor, vote, event_id, delegated_by)
- `governance_delegations` (delegator, delegatee, scope, valid_to)

Chaque écriture: `organization_id` + `created_by` + timestamps + `event_id`.

---

## 7) Sécurité / RLS (rappel)

Les tables gouvernance doivent être RLS-first:
- select limité aux acteurs impliqués (assignees, owners, auditor) via ABAC
- write limité aux actions autorisées (approve/reject/delegate/override/comment/reopen)
- les événements outbox/audit ne doivent pas exposer de données cross-org

