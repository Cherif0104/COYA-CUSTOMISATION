# États — Tâche (machine canon)

Référence normative pour le cycle de vie **tâche**. Les autres entités (projet, activité) ont leurs propres machines — à documenter ici quand gelées.

## Tâche — états

| État | Code | Description |
|------|------|-------------|
| Brouillon | `draft` | Création non publiée |
| À faire | `todo` | Prête à être prise en charge |
| En cours | `in_progress` | Exécution |
| En validation | `in_review` | Attente validation manager / MOA |
| Réalisé | `done` | Accepté |
| Bloqué | `blocked` | Impédiment explicite |
| Gelé | `on_hold` | Pause volontaire |
| Annulé | `cancelled` | Fin sans livrable |

## Transitions autorisées (matrice simplifiée)

- `draft` → `todo` | `cancelled`
- `todo` → `in_progress` | `on_hold` | `cancelled`
- `in_progress` → `in_review` | `blocked` | `on_hold` | `cancelled`
- `in_review` → `done` | `in_progress` (refus) | `cancelled`
- `blocked` → `in_progress` | `on_hold` | `cancelled`
- `on_hold` → `todo` | `in_progress` | `cancelled`
- `done` → *(aucune sauf correction admin — à traiter par événement exceptionnel)*
- `cancelled` → terminal

## Projet — états (brouillon canon)

| État | Code | Description |
|------|------|-------------|
| Proposition | `proposed` | Avant lancement |
| Actif | `active` | Exécution |
| En clôture | `closing` | Bilan en cours |
| Clôturé | `closed` | Archivé opérationnel |
| Annulé | `cancelled` | Abandon |

*(Affiner avec le modèle de données réel Supabase / types TypeScript.)*
