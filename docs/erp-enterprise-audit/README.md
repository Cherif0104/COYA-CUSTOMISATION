# COYA — ENTERPRISE DIAGNOSTIC & CONTINUITY AUDIT (pack)

Ce dossier contient la **réponse appliquée à notre projet COYA**, selon le prompt master `docs/CURSOR_PROMPT_MASTER_AUDIT_RESTRUCTURATION_ERP_COYA.md`.

## Livrables (obligatoires)

| Livrable | Fichier |
|---------|---------|
| System Architecture Map | `SYSTEM-ARCHITECTURE-MAP.md` |
| Module Maturity Matrix | `MODULE-MATURITY-MATRIX.md` |
| Workspace Compliance Audit | `WORKSPACE-COMPLIANCE-AUDIT.md` |
| Figma Alignment Report | `FIGMA-ALIGNMENT-REPORT.md` |
| Domain Runtime Audit | `DOMAIN-RUNTIME-AUDIT.md` |
| Executable Canon Audit | `EXECUTABLE-CANON-AUDIT.md` |
| Workforce Runtime Audit | `WORKFORCE-RUNTIME-AUDIT.md` |
| Technical Debt Report | `TECHNICAL-DEBT-REPORT.md` |
| ERP Test Strategy | `ERP-TEST-STRATEGY.md` |
| Automated Test Matrix | `AUTOMATED-TEST-MATRIX.md` |
| Continuity Roadmap | `CONTINUITY-ROADMAP.md` |

## Sources “réalité dépôt” utilisées

- UI : `components/`, `ui-runtime/`, `make figma/`
- Routing : `App.tsx` + `viewRegistry.tsx`
- Permissions / départements : `hooks/useModulePermissions.ts`, `utils/departmentPermissionPolicy.ts`, `services/departmentService.ts`
- Runtime event-driven : `services/domain/*`, table `domain_events` (cf. docs canon)
- Workflows : `services/workflowEngine.ts`
- Canon : `domains/*` + `docs/enterprise-canon/*`

## Note de périmètre

Ce pack est un **diagnostic enterprise** (architecture + cohérence métier + UX + runtime + gouvernance).  
Il ne remplace pas un audit Supabase/RLS exhaustif ; il identifie où le faire et comment le tester.

