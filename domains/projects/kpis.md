# KPI — Programmes & Projets

Chaque KPI a : **définition**, **formule ou source**, **fréquence**, **propriétaire domaine**.

| ID | Nom | Définition | Source de vérité | Fréquence |
|----|-----|------------|-------------------|-----------|
| KPI-PRJ-HEALTH | Santé projet | Score 0–100 agrégé (retard, budget, blocages, risques) | Read model + règles | Temps réel / horaire |
| KPI-PRJ-PROGRESS | Avancement | % tâches pondérées ou jalons atteints | Tâches + jalons | Temps réel |
| KPI-PRJ-BUDGET-VAR | Variance budget | (Réel − Prévu) / Prévu | `finance` + engagements projet | Quotidien |
| KPI-PRJ-LATE-TASKS | Tâches en retard | Count tâches `dueDate < today` et non `done` | Tâches | Temps réel |
| KPI-PRJ-TEAM-LOAD | Charge équipe | Somme charge / capacité par membre | `hr` + affectations | Quotidien |
| KPI-PRJ-RISK | Risques ouverts | Count risques non mitigés | Risques projet | Temps réel |

## Règles

- Un KPI affiché dans le **cockpit** doit exister dans ce fichier (pas de métrique « orpheline »).
- Les écarts entre UI et base doivent être traités comme **bugs de read model**, pas de patch UI.
