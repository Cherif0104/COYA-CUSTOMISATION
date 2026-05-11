# Classification des événements

Objectif : **ne pas tout mettre dans le même sac** — sinon explosion de volume, perte de sens audit, et spaghetti orchestrateur.

## 1. Domain events (faits métier)

**Définition** : un fait **significatif** dans un bounded context, pertinent pour audit, conformité, ou orchestration métier.

**Exemples** : `Task.StatusChanged`, `JournalEntry.Posted` (futur).

**Règles** :

- Nom stable dans [event-catalog.md](./event-catalog.md).
- Persistés dans `domain_events` **par défaut** si le canon le prévoit.
- Payload minimal et **versionné** (`schema_version`).

## 2. Integration events (cross-domain)

**Définition** : événement **publié** pour synchroniser un autre contexte, sans être le cœur du premier agrégat.

**Exemples** : `Project.BudgetThresholdCrossed` (finance → cockpit projet), `Crm.OpportunityWon` → tâche onboarding projet.

**Règles** :

- Owner **documentaire double** (source + cible) dans le catalogue.
- Souvent consommés par **policies** d’un autre domaine ; éviter les chaînes circulaires (graphe DAG recommandé).

## 3. Internal / technical events (non domaine)

**Définition** : cache invalidation, métrique technique, log de projection **sans** valeur métier directe.

**Règles** :

- **Ne pas** persister dans `domain_events` sauf besoin debug temporaire (feature flag).
- Peuvent rester in-process (bus seul) ou logs applicatifs.

## Décision rapide

| Question | Si oui → |
|----------|----------|
| Un auditeur ou un régulateur devrait-il le voir ? | Domain (persisté) |
| Un autre module doit réagir de façon **contractuelle** ? | Domain ou Integration |
| C’est du bruit UI / technique ? | Internal (pas d’event store) |
