# Agrégats — Human Capital & Workforce

Racines de cohérence transactionnelle. Les agrégats émettent des **événements** et valident les **policies**.

| ID | Agrégat | Contenu principal |
|----|---------|-------------------|
| EMP | Employé | Identité RH, rattachement org, département, rôles |
| CTR | Contrat | Type, dates, rémunération, statut ([states.md](./states.md)) |
| LV | Demande congé | Dates, type, workflow approbation |
| ATT | Journée présence | Statuts officiels, segments, sources |
| WJ | Work journal / journée preuve | Agrégat des preuves & temps par jour |
| TE | Time entry | Durée, projet/tâche, état validation |
| PR | Payroll run | Période, statut, variables, validations |
| SL | Payroll slip | Bulletin individuel, PDF ref, hash |
| PV | Payroll variables | Brut / net / cotisations par période employé |
| LOAD | Charge de travail | Agrégation tâches + disponibilité (`projects`) |
| PERF | Performance snapshot | Score versionné + facteurs |
| POL | Policy set | Version règles actives par scope ([policies.md](./policies.md)) |

## Règles transverses

- **Paie** : aucun `Payroll.Closed` sans `policyVersion` + double validation (RH + finance) si policy l’exige.
- **Contrat** : une seule ligne `active` par employé et période (sauf dispositions multi-contrats documentées).
- **Temps** : une entrée `locked` n’est plus modifiable sauf **commande compensatrice** auditée.
