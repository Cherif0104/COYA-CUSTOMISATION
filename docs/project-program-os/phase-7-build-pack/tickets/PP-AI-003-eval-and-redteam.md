# PP-AI-003 — Eval & red-team (quality + safety)

- **Priorité**: P2
- **Dépendances**: PP-AI-002
- **Owner**: AI/Security (placeholder)
- **Estimation**: M

## Objectif
Mettre en place un dispositif d’évaluation et de red-team (PHASE 6) pour valider la qualité et la sécurité des réponses AI: factualité basée sur citations, résistance à l’exfiltration, et non-régression.

## Périmètre / non-objectif
- **Périmètre**:
  - Jeu d’évaluation: prompts “golden” (ops, reporting, gouvernance) + attentes de citations.
  - Red-team: scénarios d’exfiltration cross-tenant, prompt injection, contournement guardrails.
  - Mesures: taux de réponses avec citations valides, refus corrects, latence, stabilité.
  - Gates CI (optionnel): exécuter un subset d’evals sur PR/release.
- **Non-objectif**:
  - Benchmarking public ou comparaison multi-modèles hors besoin.
  - Automatisation de remédiation “auto-fix” non contrôlée.

## Acceptance criteria
- ✅ Un harness d’évaluation existe (script/runner) et produit un rapport versionné (date/commit).
- ✅ Les tests incluent au moins 1 scénario d’exfiltration cross-tenant et 1 prompt injection, avec refus attendu.
- ✅ Les réponses “correctes” exigent des citations valides; absence de citation = échec (sauf cas “no evidence”).
- ✅ Les résultats sont traçables et comparables (baseline vs nouvelle version).

## Stratégie de test
- **Eval**: exécuter le set golden sur dataset figé, vérifier métriques minimales.
- **Security**: red-team automatisé + revue manuelle ponctuelle des cas limites.
- **Regression**: exécution régulière (CI ou release gate) avec seuils.
