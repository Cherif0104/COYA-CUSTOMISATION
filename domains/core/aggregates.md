# Agrégats — Core

| ID | Agrégat | Racine | Contenu principal |
|----|---------|--------|-------------------|
| ORG | Organisation | organisation | Paramètres tenant, modules activés, limites |
| USR | Utilisateur | user / profile | Identité app, préférences, langue |
| MEM | Membership | membership | Lien user ↔ org ↔ rôles / départements |
| ROLE | Rôle applicatif | role | Jeux de permissions logiques |
| AUD | Entrée audit | audit_log | Qui, quoi, quand, delta (réf. types) |
| NTF | Notification | notification | État lecture, canal, payload référencé |

## À compléter

- Cartographie exacte avec tables Supabase et types TypeScript (`types.ts`).
