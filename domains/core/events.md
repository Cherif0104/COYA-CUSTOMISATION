# Événements — Core

| Événement | Description |
|-----------|-------------|
| `Organization.Created` | Nouveau tenant |
| `Organization.StatusChanged` | Suspension / clôture |
| `User.Invited` | Invitation émise |
| `User.JoinedOrganization` | Membership créée |
| `Role.Assigned` | Attribution rôle |
| `Permission.Changed` | Matrice mise à jour |
| `Audit.Recorded` | *(méta)* entrée persistante |

## Règle

Les événements **core** alimentent la conformité et le **journal** ; ils ne remplacent pas les événements métier (`projects`, `finance`, …).
