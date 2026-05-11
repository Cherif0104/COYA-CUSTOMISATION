# PP-OFF-002 — Résolution de conflits (merge strategy) + UX de conflit

- **Priorité**: P0
- **Dépendances**: PP-OFF-001
- **Owner**: Backend+Frontend (placeholder)
- **Estimation**: M

## Objectif
Implémenter la stratégie de résolution de conflits définie en PHASE 3 (`CONFLICT-RESOLUTION.md`) et exposer des conflits exploitables côté UI.

## Détail
- Définir règles par type d’objet:
  - last-write-wins (si acceptable) vs merge par champs vs “human review required”
- Produire un “conflict record”:
  - objet, versions, champs en conflit, horodatages, auteurs, recommandation
- Définir endpoints / read-models pour afficher et résoudre.

## Acceptance criteria
- ✅ Un conflit est détecté de manière déterministe et stocké.
- ✅ L’UI peut afficher: “ce qui a été gardé / rejeté / à arbitrer”.
- ✅ La résolution produit un audit log + event idempotent.

## Stratégie de test
- **E2E**: 2 clients offline modifient même mission → resync → conflit visible.
- **Replay**: rejouer la résolution → pas de doublon.

