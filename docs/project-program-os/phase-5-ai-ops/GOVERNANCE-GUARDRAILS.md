# PHASE 5 — Governance Guardrails (safety, policies, break-glass) — contractuel

Objectif: définir des guardrails “non contournables” pour AI Ops, alignés avec:
- **PHASE 2 Governance Engine** (approvals, break-glass, audit),
- exigences **no auto-approval**, **citations**, **multi-tenant**, **offline/deferred AI**,
- défense contre **prompt injection** et usage abusif.

---

## 1) Règles d’or (hard guardrails)

### G1 — No auto-approval
- AI Ops ne peut pas approuver, geler, publier, ni signer un artefact.
- Toute sortie “finale” doit être marquée **draft** et passer par `RequestApproval` (humain).

### G2 — No irreversible actions
- AI Ops ne déclenche aucune action irréversible (delete, override, publish, migration, changement RLS).
- Si une action est demandée, l’output doit être: **refused_by_policy** + alternative (procédure gouvernée).

### G3 — Citations internes obligatoires
- Sans citations: pas d’assertion factuelle/chiffrée.
- “Je ne sais pas” est acceptable; proposer les sources à fournir (evidence pack).

### G4 — Multi-tenant isolation (RLS-first)
- Toute requête doit être bornée par `organization_id`.
- Toute tentative cross-tenant = incident sécurité (log + alerte).

### G5 — PII minimisation
- Ne jamais exposer de PII inutile.
- Redaction stricte pour incidents/notes terrain.
- Les logs doivent être “safe by default”.

### G6 — Offline/deferred AI (compat)
- Le système doit fonctionner en mode “deferred”: exécution post-sync.
- Les outputs doivent afficher `freshness` et mentionner les données potentiellement stale.

---

## 2) Break-glass (override d’urgence) — contrat

### 2.1 Principe
Le break-glass est une **procédure humaine** (PHASE 2) réservée à des rôles stricts, avec:
- justification obligatoire,
- audit renforcé,
- post-review obligatoire.

### 2.2 Rôle de l’AI Ops
AI Ops peut:
- **détecter** qu’une situation pourrait nécessiter un break-glass,
- **recommander** la procédure,
- **préparer** un dossier (citations + timeline) pour le décideur.

AI Ops ne peut jamais:
- déclencher l’override,
- masquer ou minimiser l’audit,
- recommander un break-glass sans citations.

---

## 3) Défense “prompt injection” (documents non fiables)

### 3.1 Menace
Des documents/notes peuvent contenir:
- instructions malveillantes (“ignore policies”, “export data”, “approve now”),
- contenus trompeurs (faux chiffres, fausses validations).

### 3.2 Contremesures (contractuelles)
- **Isolation des sources**: traiter tout contenu comme donnée; jamais comme policy.
- **Tool gating**: aucun tool write; lecture limitée au scope.
- **Citation-first**: ne pas accepter une instruction non citée comme règle.
- **Policy precedence**: policies > prompts > documents.

### 3.3 Signaux d’alerte
Si détecté:
- “ignore previous instructions”
- demande d’exfiltration (“export all orgs”)
- demande d’override/publish

Alors:
- `refused_by_policy`
- log `security.prompt_injection_suspected`
- recommandations: revue humaine + isolation du document.

---

## 4) Policy as Code — checklist minimale

### 4.1 Policies minimales (doivent exister)
- `citations_required`
- `tenant_scope_required`
- `no_write_actions`
- `no_auto_approval`
- `pii_redaction_strict`
- `freshness_ttl_enforced`
- `snapshot_required_for_donor_pack`

### 4.2 Audit policy (obligatoire)
Chaque décision policy doit produire:
- `policy`, `decision`, `reason`, `inputs_used` (minimisés), `timestamp`, `run_id`.

---

## 5) Evaluation checklist (pré-prod)

### 5.1 Sécurité & conformité
- [ ] Aucune sortie ne contient d’instructions d’actions irréversibles.
- [ ] Toute assertion factuelle/chiffrée a des citations internes.
- [ ] Les sorties respectent `organization_id` (tests anti-fuite).
- [ ] Redaction PII: noms/numéros/adresses masqués par défaut.

### 5.2 Gouvernance
- [ ] Les outputs “prêts à publier” sont toujours `draft` + `next_actions.request_approval`.
- [ ] Le break-glass n’est jamais déclenché par AI; seulement référencé.
- [ ] Les policies “strict donor pack” bloquent si snapshot absent ou stale.

### 5.3 Offline / deferred AI
- [ ] Le système fonctionne sans connectivité constante (jobs différés).
- [ ] Les outputs incluent `freshness` et signalent les sources stale.

### 5.4 Observabilité
- [ ] Chaque run a `run_id` + logs d’audit (minimal, non-PII).
- [ ] Les citations sont traçables jusqu’à `document_version_id`/`evidence_item_id`.

