# Politiques RH — Policies Engine (RH-6)

Les politiques encodent le **droit du travail**, les **règles internes** et les **tolérances** par niveau de granularité.

## Niveaux de résolution (du plus général au plus spécifique)

1. **Pays / juridiction** (ex. SN, FR)
2. **Entité légale** (`organization_id` / société)
3. **Département / équipe**
4. **Contrat** (CDI, CDD, stage, consultant)
5. **Salarié** (override documenté + audit)

Résolution : **merge** avec précédence **salarié > contrat > département > entité > pays** (dernier gagne pour chaque clé).

## Types de politique

| Type | Exemples de paramètres |
|------|-------------------------|
| `AttendancePolicy` | tolérance retard (min), durée pause max, détection inactivité |
| `WorkPolicy` | durée journée (7h / 8h / 9h), règle arrondi minute, télétravail |
| `OvertimePolicy` | seuil déclenchement, validation manager obligatoire, plafond mensuel |
| `LeavePolicy` | acquisition congés, carry-over, blackout dates |
| `PayrollPolicy` | barème, cotisations, primes récurrentes, retenues |
| `ContractPolicy` | durée essai, préavis, clauses renouvellement |
| `PerformancePolicy` | pondération score (tâches, présence, feedback) |

## Évaluation runtime

Entrée typique : **contexte** `{ userId, orgId, departmentId, contractType, date, action }`  
Sortie : `{ allowed: boolean, reasons[], computedValues? }`

Les mêmes politiques alimentent :

- le **cockpit** (alertes),
- le **journal** (blocage ou avertissement),
- la **simulation paie** (variables),
- les **workflows** (N+1 obligatoire).

## Stockage cible (à migrer progressivement)

- Table `hr_policy_sets` (versionnées) ou JSON versionné par org + `effective_from`.
- Jamais de calcul paie **sans** trace de la version de policy appliquée (`policyVersion` sur `payroll_runs` / slips).

## Exemple métier (documentation)

```txt
AttendancePolicy v3 — entité Dakar
- journée cible 8h
- pause max 1h non fractionnée au-delà de 45 min cumulées
- retard toléré 10 min / 3 fois / mois puis alerte RH
- heures supp après 18h30 → validation manager + OT policy
```
