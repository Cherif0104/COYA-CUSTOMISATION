# PP-SEC-003 — Secrets management & rotation des clés

- **Priorité**: P1
- **Dépendances**: PP-SEC-001, PP-INFRA-001
- **Owner**: Security/Platform (placeholder)
- **Estimation**: M

## Objectif
Mettre en place un cadre de gestion des secrets et de rotation des clés compatible production: séparation des environnements, rotation planifiée, révocation, traçabilité, et absence de secrets en clair dans le dépôt/CI.

## Périmètre / non-objectif
- **Périmètre**:
  - Inventaire des secrets (API keys, tokens, DB creds, signing keys) et classification (critique/non-critique).
  - Stratégie de rotation: fréquence, procédure, rollback, et validation post-rotation.
  - Durcissement CI/CD: masquage, scoping, permissions minimales; scanning basique des fuites.
  - Journalisation: qui a rotaté quoi, quand, sur quel environnement.
- **Non-objectif**:
  - Refonte complète IAM fournisseur (hors scope si non requis).
  - Changement de modèle d’authn applicatif (sauf nécessité sécurité).

## Acceptance criteria
- ✅ Aucun secret n’est requis en clair dans le repo; `.env.example` ne contient que des placeholders.
- ✅ Une procédure de rotation documentée existe et est testée sur au moins un secret critique (staging).
- ✅ La révocation d’un secret compromis est possible sans downtime non maîtrisé (runbook + rollback).
- ✅ Les accès CI sont au minimum nécessaire; les logs CI ne leakent pas de secrets (vérification).

## Stratégie de test
- **Drill**: exercice “rotation” sur staging avec validation applicative (smoke tests).
- **Negative**: tentative d’utilisation d’un secret révoqué → échec attendu.
- **CI**: test de non-régression sur masquage/permissions (pas de secrets dans logs/artefacts).
