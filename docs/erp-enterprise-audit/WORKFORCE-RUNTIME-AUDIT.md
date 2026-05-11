# Workforce Runtime Audit — RH / présence / paie (COYA)

## 1) Point fort majeur

COYA a déjà basculé vers une logique **Workforce Operating System** :

- pointage **global** (desktop/tablette/mobile),
- cockpit **Workforce Live** (landing RH),
- workspace employé séparé de la fiche formulaire,
- modèle overtime conceptualisé (détecté/validé/payé) dans le canon.

## 2) Présence — état actuel

- Source runtime actuelle : `PresenceSession` + `PresenceStatusEvent`.
- UX : actions pointage + chronomètre session temps réel.
- Analytics : `hrAnalyticsService` (riche mais encore très “service imperative”).

## 3) Écart canon (RH-5)

Canon : `domains/hr/attendance-runtime.md`

Gap : `PresenceEvent` append-only + projections matérialisées (workedMinutes, idle, overtime…).

## 4) Paie

Règle : **ne pas** coder un `calculateSalary(employee)`.  
Paie = **PayrollProjection** issue des événements + policies + validations.

## 5) Priorités

- **P0** : `PresenceEvent` append-only (RH-5.1) + corrélation + idempotence.
- **P0/P1** : policies engine hiérarchique (pays→org→dept→contrat→employé).
- **P1** : read models cockpit/workspace branchés sur projections, pas mock.

