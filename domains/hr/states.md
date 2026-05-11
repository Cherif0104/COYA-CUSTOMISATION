# États — Human Capital & Workforce

## Congé

`draft` → `submitted` → `approved` | `rejected` → `cancelled`

## Contrat (runtime objet)

| État | Description |
|------|----------------|
| `draft` | Brouillon / non signé |
| `probation` | Période d’essai active |
| `active` | Exécution normale |
| `suspended` | Suspension (discipline, force majeure) |
| `terminated` | Rompu / fin anticipée |
| `expired` | Fin naturelle sans renouvellement |
| `archived` | Conservé hors effectif actif |

Automatisations typiques : voir [workflows.md](./workflows.md) (`Contract.ExpiringSoon` → renouvellement).

## Présence — états officiels (cible Presence Engine)

Valeurs normalisées pour le **Presence Runtime** (mapping depuis l’existant) :

| État | Description courte |
|------|---------------------|
| `OFFLINE` | Non connecté plateforme |
| `ONLINE` | Session active sans granularité métier |
| `PRESENT` | Activité détectée / pointage valide |
| `BREAK` | Pause |
| `MEETING` | En réunion (corrélation calendrier / meeting) |
| `FOCUS` | Mode profond / ne pas déranger |
| `FIELD_MISSION` | Mission terrain |
| `TRAINING` | Formation |
| `SICK` | Arrêt maladie (preuve doc) |
| `LEAVE` | Congé approuvé |
| `TECHNICAL_ISSUE` | Incident IT / SSO |
| `DISCONNECTED` | Déconnexion brutale / timeout |

Règle produit : **login** → au minimum `ONLINE` ; corrélation activité → `PRESENT` ; inactivité → `AWAY_WARNING` (événement) → `BREAK` si policy l’impose.

## Run de paie

| État | Description |
|------|-------------|
| `draft` | Import variables incomplet |
| `simulated` | Calcul sans engagement |
| `hr_review` | Attente RH |
| `finance_review` | Attente finance |
| `closed` | Figé, bulletins émis |
| `posted` | Écritures comptables demandées / confirmées |

## Pointage / entrée temps (exemple)

`draft` → `submitted` → `manager_approved` | `disputed` → `locked` (inclus dans run paie clôturé)
