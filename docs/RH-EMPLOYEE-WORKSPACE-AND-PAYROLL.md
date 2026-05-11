# Workspace salarié (RH) — données, paie PDF, demandes documents

## Ordre des onglets (aligné `docs/RH-MODULE-AUDIT-INVENTAIRE.md` §4)

| # | Onglet | Contenu |
|---|--------|---------|
| 1 | Vue d’ensemble | Synthèse org, congés du salarié, agrégats journal 30 j. |
| 2 | Présence | `DataAdapter.listPresenceStatusEvents` (14 j.) — `userId` = id utilisateur roster |
| 3 | Journal d’activité | `WorkJournalTab` → `coya_work_day_summaries`, `coya_work_proofs` |
| 4 | Paie | Sous-onglets pipeline ; **Bulletins** = `payrollService.listPaySlipsWithLinesForPeriod` filtré profil + téléchargement PDF |
| 5 | Performance | Renvoi module RH (placeholder court) |
| 6 | Congés | Liste `leave_requests` filtrée (`userId` = `profileId`) |
| 7 | Documents | **Demandes administratives** → `hr_document_requests` |
| 8–10 | Parcours, Formation, Accès | Placeholders courts |
| 11 | Chronologie | Fusion événements présence + preuves récentes |

## Rafraîchissement

- Rechargement au changement d’onglet / sous-onglet bulletins, au **focus** fenêtre (`window` `focus`), au retour onglet navigateur (`document.visibilitychange` → `visible`), et **toutes les 60 s** si l’onglet est visible (pas de canal Realtime dédié sur cet écran).
- Onglet **Documents** : la liste `hr_document_requests` se rafraîchit aussi sur visibilité + intervalle 60 s.

## Tables Supabase

| Table | Usage |
|-------|--------|
| `coya_work_day_summaries`, `coya_work_proofs` | Journal (migration `coya_work_journal_summaries_proofs`) |
| `pay_slips`, `pay_slip_lines` | Bulletins (voir `payrollService`) |
| `hr_document_requests` | Demandes documents (migration `20260510143000_hr_document_requests_and_payroll_stub_rpc.sql`) |

### RLS `hr_document_requests`

- **SELECT** : même organisation et (demandeur = profil auth **ou** rôle `super_administrator` / `administrator` / `manager`).  
- **INSERT** : org cohérente ; profil cible dans l’org ; salarié sur son propre profil **ou** manager de l’org.  
- **UPDATE** : `super_administrator`, `administrator`, `manager`, `hr_officer`, `hr_business_partner` (migration `20260510150000_hr_document_requests_rls_hr_officer_update.sql`).

## PDF bulletin (employeur)

- **Tiroir matrice** (`PaySlipDetailDrawer`) : boutons *Télécharger PDF* / *Imprimer* — `services/paySlipPdfExport.ts` (`jspdf`).  
- **Workspace salarié** onglet Paie → Bulletins : même export pour le profil affiché.  
- Logo / nom : `OrganizationService.getCurrentUserOrganization()` (`logo_url` si colonne présente en base, sinon nom seul).  
- Mentions légales indicatives dans le PDF (pas de SIRET/SN en colonnes `organizations` sur tous les déploiements).

## Automatisation fin de mois

Voir **`docs/RH-PAYROLL-MONTH-END.md`** (bouton RH, RPC, Edge Function stub).

## Permissions UI (demandes & PDF)

- **PDF / matrice paie** : accès module RH avec écriture (`canWriteRh` / `PayrollMatrix` `canWrite`) — aligné `useModulePermissions` + module `rh`.  
- **Demandes documents — formulaire création** : uniquement si l’utilisateur connecté consulte **son** `profileId` (`isSelfWorkspace`).  
- **Mise à jour statut demande** : utilisateur connecté **non** self et rôle dans  
  `super_administrator`, `administrator`, `manager`, `hr_officer`, `hr_business_partner`  
  (aligné RLS `UPDATE` après migration `20260510150000_…`).

## Lacunes connues

- Colonnes légales entreprise (SIRET, etc.) absentes du schéma `organizations` sur certaines instances — PDF sans ces champs.
