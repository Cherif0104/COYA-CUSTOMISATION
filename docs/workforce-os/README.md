# Workforce OS — index documentation

Point d’entrée pour le **Human Capital & Workforce Intelligence OS** dans COYA ERP.

## Références

| Document | Description |
|----------|-------------|
| [Architecture Workforce Intelligence OS](../HUMAN-CAPITAL-WORKFORCE-INTELLIGENCE-OS-ARCHITECTURE.md) | Vision, couches métier, modèle de données conceptuel, événements canoniques, conformité. |
| [Chronologie comportementale & sessions d’activité](./BEHAVIORAL-TIMELINE-SESSION-MODEL.md) | Timeline, 5 dimensions (présence système / activité / productivité / disponibilité / engagement), multi-device, scores, éthique « intelligence » vs surveillance. |
| [Module runtime `services/workforce`](../../services/workforce/README.md) | Activity Event Engine MVP, types, persistance append-only, pub/sub. |
| [Appliquer les migrations Supabase](./APPLY-MIGRATIONS-SUPABASE.md) | MCP, SQL Editor, ou CLI — script unique [`scripts/apply-workforce-migrations-remote.sql`](../../scripts/apply-workforce-migrations-remote.sql). |

## Roadmap (extrait — détail dans le doc d’architecture)

- **MVP (foundations)** : événements temps minimaux, imputation projet/tâche, validation manager simple, dashboards basiques, audit léger, RBAC standard.
- **Phase 2 (en cours)** : persistance **Supabase** `workforce_activity_events` + **`workforce_timeline_segments`** (dérivé événements), chaînage persistance, **consolidation d’intervalles** (`mergeOverlappingIntervals`) ; adaptateurs présence, time log, `task_completed` ; suite : validation feuilles de temps, fusion multi-device avancée, read-models.
- **Phase 3** : GPEC intégré, IA prédictive contrôlée, offline mature multi-site, ABAC complet, entrepôt analytique.

Pour la formulation complète et les livrables associés, voir la section *Roadmap MVP → Enterprise* du document d’architecture.
