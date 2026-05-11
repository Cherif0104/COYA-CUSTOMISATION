# PP-NOTIF-002 — Notifications d’escalade (SLA, relances)

- **Priorité**: P1
- **Dépendances**: PP-NOTIF-001, PP-WF-003
- **Owner**: Backend/Platform (placeholder)
- **Estimation**: M

## Objectif
Standardiser les notifications d’escalade liées aux workflows (PHASE 2): rappels, dépassements de SLA, changements d’assignation et alertes “stuck”, avec règles explicites et traçabilité.

## Périmètre / non-objectif
- **Périmètre**:
  - Types de notifications: reminder, overdue, reassign, stuck.
  - Règles de ciblage: rôles/assignees; respect strict des scopes/tenant.
  - Anti-spam: déduplication, coalescing (regrouper), fenêtres de silence.
  - Lien “actionnable”: deep-links vers Mission Control / Incident Center.
- **Non-objectif**:
  - Routage avancé (SMS/WhatsApp) sauf si déjà standardisé.
  - Personnalisation complète par utilisateur (préférences fines).

## Acceptance criteria
- ✅ Une escalade workflow déclenche la notification attendue au bon moment (tests sur clock simulée).
- ✅ Les notifications d’escalade sont dédupliquées (pas de spam sur retries/replay).
- ✅ Les destinataires sont calculés sans fuite d’informations et respectent RLS/ABAC.
- ✅ Les notifications contiennent les métadonnées minimales pour audit et triage (workflow_id, état, échéance).

## Stratégie de test
- **Integration**: scénario timers (WF-003) → notifications; crash/restart → pas de doublons.
- **Security**: vérifier destinataires/tenants (A/B) et absence d’infos cross-tenant.
- **E2E**: overdue → notification in-app visible + deep-link fonctionnel.
