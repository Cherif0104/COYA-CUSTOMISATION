# Inventaire des tables `public` créées dans les migrations du dépôt

Document généré pour la phase **assainissement / gouvernance** : liste les tables introduites via `create table if not exists public.*` dans `supabase/migrations/`.  
Les tables créées hors ce motif (scripts legacy, extensions `ALTER`, ou autres dépôts) peuvent exister en base sans figurer ici.

## Pilotage & stratégie

| Table | Rôle |
| --- | --- |
| `domain_events` | Journal append-only des événements métier |
| `programme_cockpit_read_models` | Snapshot CQRS cockpit programme |
| `projection_checkpoints` | Watermarks des projections |
| `module_labels` | Libellés modules par org |
| `dashboard_settings` | Configuration widgets dashboard |

## Organisation & people

| Table | Rôle |
| --- | --- |
| `departments` | Départements |
| `user_departments` | Rattachements utilisateurs |
| `employees` | Fiche salarié |
| `presence_sessions` | Sessions de présence |
| `hr_absence_events` | Événements d’absence |
| `hr_attendance_policies` | Politiques de présence |
| `presence_status_events` | Événements statut présence |
| `employee_work_schedules` | Plannings horaires |
| `hr_workforce_anomalies` | Anomalies workforce |
| `hr_document_requests` | Demandes documents RH |
| `workforce_timeline_segments` | Segments timeline RH |
| `workforce_activity_events` | Événements d’activité workforce |
| `coya_work_day_summaries` | Synthèses journées de travail |
| `coya_work_proofs` | Preuves associées |

## Programme & exécution terrain

| Table | Rôle |
| --- | --- |
| `programmes` | Programmes |
| `bailleurs` | Financeurs |
| `programme_bailleurs` | Liaisons programme / bailleur |
| `programme_stakeholders` | Parties prenantes |
| `programme_actions` | Actions programme |
| `programme_action_assignees` | Affectations actions |
| `programme_data_rows` | Données terrain programme |
| `project_activities` | Activités projet |
| `budget_cascade_lines` | Lignes budget cascade |

## Projets & planification (réf. migrations phase 2/3)

Les migrations référencent aussi `tasks`, `meetings`, `planning_slots`, `project_module_settings` (créations ou altérations selon fichiers `20250220*` et `20260331121000_*`).

## Finance & comptabilité

| Table | Rôle |
| --- | --- |
| `organization_accounting_settings` | Paramètres compta org |
| `chart_of_accounts` | Plan comptable |
| `accounting_journals` | Journaux |
| `journal_entries` | Écritures |
| `journal_entry_lines` | Lignes d’écritures |
| `accounting_period_closures` | Clôtures |
| `accounting_matching_groups` | Lettrage — groupes |
| `accounting_matching_lines` | Lettrage — lignes |
| `accounting_reconciliations` | Rapprochements |

## Documents & drive

| Table | Rôle |
| --- | --- |
| `drive_items` | Objets drive |
| `drive_item_acl` | ACL drive |
| `drive_access_requests` | Demandes d’accès |
| `document_acl_profiles` | ACL documents — profils |
| `document_acl_departments` | ACL documents — départements |
| `document_acl_projects` | ACL documents — projets |

## CRM & collecte

| Table | Rôle |
| --- | --- |
| `organization_crm_webhooks` | Webhooks CRM |
| `contact_dossier_items` | Items dossier contact |
| `contacts_collecte_source` *(migration contacts)* | Traçage collecte |
| `crm_interactions` | Interactions CRM |

## Messagerie

| Table | Rôle |
| --- | --- |
| `chat_channels` | Canaux |
| `chat_channel_members` | Membres canaux |
| `chat_direct_threads` | Fils DM |
| `chat_direct_members` | Membres DM |
| `chat_messages` | Messages |

## DAF / moyens généraux

| Table | Rôle |
| --- | --- |
| `daf_service_requests` | Demandes de service |
| `daf_service_request_messages` | Messages demandes |
| `daf_service_request_attachments` | Pièces jointes |

## LMS / formations

| Table | Rôle |
| --- | --- |
| `course_sessions` | Sessions de cours |
| `course_session_enrollments` | Inscriptions session |
| `learning_certificates` | Certificats |

## Trinité (évaluations)

| Table | Rôle |
| --- | --- |
| `trinite_scores` | Scores |
| `trinite_self_notes` | Notes auto |
| `trinite_manager_reviews` | Revues manager |

## IT & référentiels

| Table | Rôle |
| --- | --- |
| `referential_values` | Référentiels |
| `it_tickets` | Tickets IT |

## Logistique / flotte / studio

| Table | Rôle |
| --- | --- |
| `vehicle_photos` | Photos véhicules |
| `transport_partner_companies` | Partenaires transport |
| `transport_partner_vehicles` | Véhicules partenaires |
| `vehicle_request_status_transitions` | Transitions statut demande |
| `logistics_equipment_categories` | Catégories équipement |
| `logistics_audit_events` *(via services)* | Audit logistique |
| `studio_sites` | Sites studio |
| `studio_responsible_persons` | Responsables |
| `studio_staff_assignments` | Affectations staff |
| `studio_assets` | Actifs |
| `studio_investment_ledger` | Investissements |
| `studio_pricing_rules` | Tarification |
| `studio_bookings` | Réservations |
| `studio_quotes` | Devis |
| `studio_contracts` | Contrats |
| `studio_invoices` | Factures studio |
| `studio_audit_events` | Audit studio |

---

Pour une liste exhaustive à jour sur une instance déployée, exécuter en SQL :

```sql
select tablename from pg_catalog.pg_tables
where schemaname = 'public'
order by tablename;
```
