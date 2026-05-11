# Automated Test Matrix — COYA

Légende : **U** = Unitaire · **I** = Intégration · **E** = E2E · **·** = non couvert aujourd’hui

## 1. Matrice par domaine

| Domaine / flux | U | I | E | Notes |
|------------------|---|---|---|--------|
| Auth / login | · | · | E? | Renforcer scénarios rôles |
| Dashboard accès | · | · | E | Sidebar → dashboard (régression navigation) |
| Projet — création tâche | U | · | · | Extraire pure logic |
| Projet — changement statut tâche | U | I | E | `applyTaskStatusChange` + UI |
| `domain_events` insert | · | I | · | Mock Supabase |
| workflowEngine cycle | U | I | · | Réduction actions dupliquées |
| RH — liste employés | · | · | E | léger |
| RH — workspace employé | · | · | E | URL `/hr/employees/:id` |
| RH — Workforce Live | · | · | E | KPI + refresh |
| Présence — dock actions | · | I | E | `setStatus` |
| Finance — facture (critique) | · | · | · | À définir par règle métier |
| Planning — congé | · | · | · | Dépend données |

## 2. Matrice RLS / sécurité (hors Cypress)

| Contrôle | Outil |
|----------|--------|
| Politiques `domain_events` | Tests SQL / CI Supabase |
| `profiles` / org | Idem |

## 3. Priorisation (3 premiers lots)

1. **Navigation + auth** (E2E) — stabilité tableau de bord / rôles.  
2. **Projet + domain** (U + I) — cœur du runtime exécutable.  
3. **RH présence + workspace** (E2E smoke) — alignement Workforce OS.

## 4. Indicateurs de suivi

| KPI | Cible |
|-----|--------|
| Couverture chemins critiques | 60 % des flux du tableau ci-dessus sous 2 trimestres |
| Temps suite E2E | < 15 min en CI |
