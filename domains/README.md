# Domaines métier COYA (Enterprise Canon)

Chaque dossier est un **bounded context** documenté avec les **10 artefacts** obligatoires (`overview.md` → `read-models.md`).

| Dossier | Domaine |
|---------|---------|
| [core](./core/) | Plateforme multi-tenant, identité, permissions, audit |
| [projects](./projects/) | Programmes, projets, activités, tâches *(pilote détaillé)* |
| [finance](./finance/) | Comptabilité & finance OHADA |
| [hr](./hr/) | **Human Capital / Workforce** — présence, temps, paie, performance *(canon étendu : [hr/README](./hr/README.md))* |
| [crm](./crm/) | CRM, opportunités, contacts |
| [documents](./documents/) | GED, versions, validations |
| [analytics](./analytics/) | KPI transverses, dashboards |
| [workflows](./workflows/) | Bus d’événements, orchestration |
| [shared](./shared/) | **Gouvernance événements** : catalogue, classification, registre des policies |

## Référentiel transverse

- Index et gouvernance : [docs/enterprise-canon/README.md](../docs/enterprise-canon/README.md)
- Contrat UX workspaces : [docs/enterprise-canon/WORKSPACE-UX-CONTRACT.md](../docs/enterprise-canon/WORKSPACE-UX-CONTRACT.md)
- Couches Domain / Workflow / Read model / UI : [docs/enterprise-canon/ARCHITECTURE-LAYERS.md](../docs/enterprise-canon/ARCHITECTURE-LAYERS.md)

## Règle de contribution

Toute évolution métier significative : **mettre à jour le canon du domaine** dans le même changement logiciel (ou PR associée), ou documenter une dérogation temporaire dans `docs/enterprise-canon/README.md`.
