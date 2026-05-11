# Automatisations — Workflows (globales)

Exemple transverse (déjà évoqué dans la vision produit) :

| ID | Déclencheur | Actions |
|----|-------------|---------|
| AUTO-WF-BUDGET-001 | `Project.BudgetThresholdCrossed` | Notif DAF + blocage validation (`finance`) + incident + recalcul KPI |
| AUTO-WF-GLOBAL-001 | `Workflow.ActionFailed` N fois | Escalade DLQ + alerte admin |

Les règles **métier fines** restent dans les fichiers `automation-rules.md` de chaque domaine ; ce fichier regroupe les **chaînes multi-domaines**.
