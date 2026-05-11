# Permissions — Human Capital & Workforce

Séparation stricte **self** / **manager (scope équipe)** / **HR** / **finance** / **admin**.

| Capacité | Description |
|----------|---------------|
| `hr:employee:read` | Consulter fiche / workspace employé |
| `hr:employee:write` | Modifier données RH sensibles |
| `hr:leave:approve` | Approuver / refuser congés (N+1 ou HR selon policy) |
| `hr:attendance:read` | Voir présence & journal |
| `hr:attendance:write` | Corriger pointages (HR / admin) |
| `hr:time:validate` | Valider entrées temps (manager+) |
| `hr:payroll:simulate` | Lancer simulation run |
| `hr:payroll:validate_hr` | Valider run côté RH |
| `hr:payroll:validate_finance` | Valider run côté finance |
| `hr:payroll:close` | Clôturer run (souvent finance + HR) |
| `hr:policy:read` | Consulter politiques actives |
| `hr:policy:write` | Publier nouvelle version politique |
| `hr:contract:write` | Créer / modifier contrats |

Scopes : `organization`, `department`, `self` — résolution décrite dans [policies.md](./policies.md).
