# Plan de continuité & transformation — COYA ERP

Roadmap **réaliste** en phases ; chaque phase : objectifs, risques, dépendances, quick wins, dette critique, impact métier, priorité.

---

## PHASE 1 — Stabilisation runtime

| | |
|--|--|
| **Objectifs** | Frontière claire `workflowEngine` ↔ `services/domain` ; tests bus projet ; garde navigation |
| **Risques** | Régression tâches si refactor trop large |
| **Dépendances** | Aucune |
| **Quick wins** | Tests unitaires `applyTaskStatusChange` ; doc boundary |
| **Dette critique** | `App.tsx` |
| **Impact métier** | **Élevé** (fiabilité projet) |
| **Priorité** | **P0** |

---

## PHASE 2 — Migration workspace

| | |
|--|--|
| **Objectifs** | Finance / CRM vers floorplans ; réduction pages « tableau seul » |
| **Risques** | Retours utilisateurs habitués au CRUD |
| **Dépendances** | `ui-runtime` stable |
| **Quick wins** | KPI strip + header commun sur 1 module pilote (ex. CRM) |
| **Dette** | Mega-fichiers UI |
| **Impact** | **Moyen–élevé** (adoption, clarté) |
| **Priorité** | **P1** |

---

## PHASE 3 — Command layer généralisé

| | |
|--|--|
| **Objectifs** | Nouvelles mutations RH/finance passent par commandes + événements |
| **Risques** | Double écriture temporaire |
| **Dépendances** | Phase 1 |
| **Quick wins** | Première commande RH (ex. demande congé) |
| **Dette** | Mutations React éparses |
| **Impact** | **Élevé** (audit, conformité) |
| **Priorité** | **P1** |

---

## PHASE 4 — Finance runtime

| | |
|--|--|
| **Objectifs** | Read models facturation / trésorerie ; liens projet ; règles OHADA encapsulées |
| **Risques** | Complexité réglementaire |
| **Dépendances** | Phase 3 partielle |
| **Quick wins** | Cartographie événements `domains/finance/events.md` → code |
| **Impact** | **Très élevé** entreprise |
| **Priorité** | **P2** |

---

## PHASE 5 — Workforce runtime

| | |
|--|--|
| **Objectifs** | `PresenceEvent` append-only ; calculs ; policies ; payroll projection |
| **Risques** | Migration données présence |
| **Dépendances** | Canon `attendance-runtime.md` ; Phase 3 pour commandes |
| **Quick wins** | Déjà : Workforce Live + docks ; suite : persistance events |
| **Impact** | **Très élevé** (temps = base paie) |
| **Priorité** | **P0–P1** (parallélisable avec Phase 2 partiellement) |

---

## PHASE 6 — Analytics & IA

| | |
|--|--|
| **Objectifs** | Cockpit exécutif cross-modules ; assistances IA sur read models fiables |
| **Risques** | IA sur données incohérentes |
| **Dépendances** | Phases 4–5 pour données temps / finance |
| **Quick wins** | KPI agrégés déjà disponibles dans workflow snapshot |
| **Impact** | **Moyen** court terme ; **élevé** long terme |
| **Priorité** | **P3** |

---

## Synthèse exécutive

1. **Sécuriser** le runtime **projet** (Phase 1) en parallèle du **Workforce** (Phase 5 déjà amorcée côté UX).  
2. **Découper** `App.tsx` et les **mega-modules** en continu (transversal).  
3. **Ne pas** ajouter de gros modules sans **événement + read model** dans le canon.
