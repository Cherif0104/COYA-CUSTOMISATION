# PP-FE-003 — Incident Center v1 (triage & suivi)

- **Priorité**: P0
- **Dépendances**: PP-BE-001, PP-BE-004, PP-OBS-001, PP-WF-002
- **Owner**: Frontend (placeholder)
- **Estimation**: M

## Objectif
Mettre à disposition une UI de triage “Incident Center” (PHASE 3/4) pour suivre les incidents, leur état workflow, et les actions de remédiation (replay, assignation, clôture) avec traçabilité audit et corrélation.

## Périmètre / non-objectif
- **Périmètre**:
  - Liste/détail incidents + timeline d’événements (workflow/read-model) avec `correlation_id`.
  - Actions P0: changer d’état (si autorisé), relancer une étape (replay), ajouter un commentaire/évidence si disponible.
  - Affichage des erreurs “systèmes” corrélées (sync failures, workflow stuck) quand exposées.
- **Non-objectif**:
  - Automatisation d’escalations/notifications (voir PP-WF-003, PP-NOTIF-002).
  - Analyse d’impact avancée (voir PP-FE-005).

## Acceptance criteria
- ✅ Un incident possède une vue détail avec état workflow courant + historique minimal (au moins transitions principales).
- ✅ Les actions exposées sont idempotentes côté client (anti double-submit) et utilisent `event_id` quand applicable.
- ✅ Les refus d’autorisation (RLS/ABAC) sont gérés proprement sans fuite et avec un message canonique.
- ✅ Les écrans supportent une pagination stable et une recherche/filtre minimal (période + statut).

## Stratégie de test
- **Unit**: règles d’affichage par état, désactivation actions, mapping erreurs.
- **Integration**: mocks API (read + write) + simulation de transitions; vérif idempotence UI.
- **E2E**: scénario incident “créé → en cours → résolu” + tentative actions interdites (tenant B).
