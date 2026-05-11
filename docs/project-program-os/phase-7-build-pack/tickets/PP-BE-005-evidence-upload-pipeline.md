# PP-BE-005 — Evidence upload pipeline (PHASE 3) — fiable & vérifiable

- **Priorité**: P1
- **Dépendances**: PP-BE-003, PP-OFF-001, PP-SEC-003, PP-OBS-001
- **Owner**: Backend/Platform (placeholder)
- **Estimation**: L

## Objectif
Implémenter un pipeline d’upload de preuves (photos/docs) compatible offline-first, garantissant intégrité (hash), idempotence, et traçabilité (audit), sans fuite inter-tenant.

## Détail
- Flux recommandé (contractuel):
  - étape 1: enregistrer métadonnées preuve (write-model) + obtenir un “upload intent”
  - étape 2: upload (direct storage/presigned) avec checksum/hash
  - étape 3: finaliser (commit) → lier `document_version`/référence storage à `evidence_item`
- Contraintes:
  - idempotence par `event_id`/`idempotence_key` (retries offline)
  - limite taille/type MIME + validation côté serveur
  - redaction/PII: éviter logs de contenu; loguer uniquement ids + tailles + hash tronqué
- Sécurité:
  - rotation de clés/URLs (PP-SEC-003)
  - permissions storage liées à `organization_id` (tenant isolation)
- Observabilité:
  - métriques uploads: pending/success/fail, latence, retries, erreurs signature

## Acceptance criteria
- ✅ Upload repris après interruption réseau (retries) sans doublons ni corruption.
- ✅ Hash d’intégrité stocké et vérifiable; une incohérence bloque la finalisation.
- ✅ Isolation: un utilisateur ne peut pas upload/associer un media à une preuve d’une autre org.
- ✅ Les journaux/audits permettent de reconstituer “qui a upload quoi, quand” (sans stocker le contenu).

## Stratégie de test
- **Integration**: upload “happy path” + retry + replay (même `event_id`) → même résultat.
- **Offline/E2E**: mode avion: capturer preuve → file d’attente → resync → preuve visible + hash stable.
- **Security**: tests d’accès croisé (org A essaye de finaliser un intent org B) → refus + audit.
