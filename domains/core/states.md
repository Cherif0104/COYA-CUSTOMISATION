# États — Core

## Utilisateur / accès

| Entité | États (exemple) | Notes |
|--------|-----------------|-------|
| Compte utilisateur | `pending`, `active`, `suspended`, `archived` | À aligner sur Auth |
| Invitation | `sent`, `accepted`, `expired`, `revoked` | |
| Membership | `active`, `revoked` | |

## Organisation

| État | Description |
|------|---------------|
| `trial` | Période d’essai |
| `active` | Production |
| `suspended` | Blocage facturation / conformité |
| `closed` | Archivage |

## À compléter

- États notification (queued, delivered, read, failed).
