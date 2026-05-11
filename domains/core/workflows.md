# Workflows — Core

| ID | Workflow | Étapes métier |
|----|----------|----------------|
| WF-CORE-INVITE | Invitation utilisateur | création invitation → email → acceptation → membership |
| WF-CORE-OFFBOARD | Sortie utilisateur | révocation memberships → anonymisation / archivage (RGPD) |
| WF-CORE-SUSPEND-ORG | Suspension org | notification → blocage connexions / lecture selon règle |

## Note

L’orchestration fine peut vivre dans `domains/workflows/` ; ici on documente les **processus identité / tenant**.
