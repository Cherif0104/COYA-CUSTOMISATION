# COYA — Enterprise diagnostic & continuity audit (index maître)

Ce document pointe vers le **pack d’audit ERP** livré dans le dépôt (vision **domaine + workspace + runtime + dette + tests + roadmap**), conforme au brief « diagnostic enterprise, pas QA classique seule ».

## Structure des livrables

| Dossier | Contenu |
|---------|---------|
| [system-audit/](./system-audit/) | Cartographie système, maturité modules |
| [domain-audit/](./domain-audit/) | Cohérence métier vs `domains/`, agrégats, workflows |
| [ui-audit/](./ui-audit/) | Conformité workspace, alignement `make figma/` |
| [runtime-audit/](./runtime-audit/) | Bus `domain_events`, canon exécutable, workforce |
| [technical-debt/](./technical-debt/) | Volumétrie, `App.tsx`, mega-composants |
| [erp-test-strategy/](./erp-test-strategy/) | Stratégie tests métier / E2E / RLS |
| [continuity-roadmap/](./continuity-roadmap/) | Phases de transformation P0–P3 |

## Documents par titre demandé

| Titre | Emplacement |
|-------|----------------|
| **System Architecture Map** | [system-audit/ARCHITECTURE-MAP.md](./system-audit/ARCHITECTURE-MAP.md) |
| **Module Maturity Matrix** | [system-audit/MODULE-MATURITY-MATRIX.md](./system-audit/MODULE-MATURITY-MATRIX.md) |
| **Workspace Compliance Audit** | [ui-audit/WORKSPACE-COMPLIANCE-AUDIT.md](./ui-audit/WORKSPACE-COMPLIANCE-AUDIT.md) |
| **Figma Alignment Report** | [ui-audit/FIGMA-ALIGNMENT-REPORT.md](./ui-audit/FIGMA-ALIGNMENT-REPORT.md) |
| **Domain Runtime Audit** | [domain-audit/DOMAIN-RUNTIME-AUDIT.md](./domain-audit/DOMAIN-RUNTIME-AUDIT.md) |
| **Executable Canon Audit** | [runtime-audit/EXECUTABLE-CANON-AUDIT.md](./runtime-audit/EXECUTABLE-CANON-AUDIT.md) |
| **Workforce Runtime Audit** | [runtime-audit/WORKFORCE-RUNTIME-AUDIT.md](./runtime-audit/WORKFORCE-RUNTIME-AUDIT.md) |
| **Technical Debt Report** | [technical-debt/TECHNICAL-DEBT-REPORT.md](./technical-debt/TECHNICAL-DEBT-REPORT.md) |
| **ERP Test Strategy** | [erp-test-strategy/ERP-TEST-STRATEGY.md](./erp-test-strategy/ERP-TEST-STRATEGY.md) |
| **Automated Test Matrix** | [erp-test-strategy/AUTOMATED-TEST-MATRIX.md](./erp-test-strategy/AUTOMATED-TEST-MATRIX.md) |
| **Continuity roadmap (phases)** | [continuity-roadmap/CONTINUITY-ROADMAP.md](./continuity-roadmap/CONTINUITY-ROADMAP.md) |

## Méthode

Audit basé sur **l’arborescence réelle** (`services/domain/`, `domains/`, `components/`, `ui-runtime/`, `make figma/`, volumétrie composants) et sur les **évolutions récentes** (RH Workforce, docks pointage, workspace employé). Les scores Figma / conformité sont **indicatifs** ; une passe « captures + tickets » peut affiner chaque score.

## Prochaine itération recommandée

1. Revue **Supabase RLS** par module (hors scope texte ici).  
2. Compléter **AUTOMATED-TEST-MATRIX** avec les IDs Cypress existants.  
3. Tenir ce pack **à jour** à chaque release majeure (changelog lien vers ces dossiers).
