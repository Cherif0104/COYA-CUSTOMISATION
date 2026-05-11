# PP-OFF-003 — Observabilité du sync (serveur + client)

- **Priorité**: P1
- **Dépendances**: PP-OFF-001, PP-FE-001, PP-OBS-001
- **Owner**: Platform (placeholder)
- **Estimation**: M

## Objectif
Rendre la synchronisation offline observable de bout en bout: métriques, logs corrélés, diagnostics actionnables et surfaces minimales de visibilité (UI/ops) pour réduire le MTTR sur échecs de sync et conflits.

## Périmètre / non-objectif
- **Périmètre**:
  - Corrélation systématique par `event_id` et `correlation_id` (client → serveur → outbox → projections).
  - Métriques clés: batch sizes, latency, retries, failure rate, types d’erreurs, backlog outbox client.
  - Diagnostics: “why failed” (catégories), “stuck detection”, et export minimal de traces.
  - Signalement qualité: erreurs RLS/ABAC, payload invalid, conflit détecté.
- **Non-objectif**:
  - Mise en place d’une stack observabilité complète (hors scope si déjà outillée).
  - SLA/alerting complet (peut démarrer minimalement dans PP-OBS-002).

## Acceptance criteria
- ✅ Chaque batch de sync est traçable via un identifiant de corrélation consultable dans logs.
- ✅ Le client expose un diagnostic lisible (dernier échec + cause + action recommandée) pour sync.
- ✅ Le serveur expose des métriques permettant d’identifier: pics d’échecs, tenants touchés, causes dominantes.
- ✅ Les erreurs sensibles n’exposent pas de données; elles restent actionnables (codes stables).

## Stratégie de test
- **Integration**: exécuter sync avec succès/échecs; vérifier présence métriques/logs/corrélation.
- **Offline**: mode avion + reprise + conflit → signaux observables (client + serveur).
- **Security**: erreurs RLS/ABAC → codes stables sans fuite d’informations.
