# Technical Debt Report — COYA

Données : analyse statique rapide (fév. 2026) — lignes de fichiers `components/**/*.tsx`.

## 1. Dette critique (priorité haute)

| Item | Détail | Impact |
|------|--------|--------|
| **App.tsx ~3366 lignes** | Orchestration + données + routing | Maintenance, tests, onboarding |
| **Mega-composants** | `ProgrammeModule.tsx` ~3076, `ProjectDetailPage.tsx` ~3041, `Finance.tsx` ~2168 | Bugs, conflits PR, perf React |
| **Double moteur** | `workflowEngine` + `services/domain` | Compréhension, duplication logique |

## 2. Dette élevée

| Item | Fichiers / zones |
|------|------------------|
| **Prop drilling / état global** | App.tsx lève beaucoup d’état vers les enfants |
| **Types monolithiques** | `types.ts` très volumineux |
| **Listeners / cycles** | `App.tsx` (workflow, realtime) — vérifier démontage et fréquence |

## 3. Dette modérée

- Composants **500–1500** lignes : `RhModule`, `Planning`, `CRM`, `TimeTracking`, etc.
- **Grep `any`** : occurrences dans services / adapters — typer progressivement.

## 4. Qualité positive (à préserver)

- **`ui-runtime/`** : séparation UI workspace réutilisable.
- **`services/domain/`** : structure claire pour le **domaine projet**.
- **`domains/`** : gouvernance documentaire **solide**.

## 5. Métriques cibles (objectifs de réduction)

| Métrique | Cible 6 mois |
|----------|--------------|
| Lignes `App.tsx` | **< 1200** (extraction hooks + layout + routeur) |
| Fichiers > 2000 lignes | **0** (découpage par onglet/feature) |
| Chemins métier sans test | **-50 %** sur projet + RH présence |

## 6. Risques performance

- **Re-renders** : App state large → `useMemo` / contextes scindés.
- **Realtime** : abonnements — vérifier **un seul** canal par org/user quand possible.

## 7. Actions recommandées (quick wins)

1. Extraire **`useAppNavigation`** + **`useAppDataBootstrap`** depuis `App.tsx`.
2. Découper **`ProjectDetailPage`** par onglets déjà existants (fichiers sous `components/project/workspace/`).
3. Linter rule **max-lines** warning seuil 800 sur `components/`.
