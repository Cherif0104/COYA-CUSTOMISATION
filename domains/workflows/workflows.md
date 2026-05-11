# Workflows — (méta) orchestration

## WF-ORCH-DISPATCH

1. Réception événement normalisé.
2. Résolution des règles actives (`automation-rules.md` de chaque domaine + règles globales).
3. Exécution actions (notif, RPC domaine, mise à jour read model).
4. Persistance trace + idempotence.

## WF-ORCH-COMPENSATE

En cas d’échec partiel : stratégie **saga** / compensations (à détailler par cas d’usage finance).
