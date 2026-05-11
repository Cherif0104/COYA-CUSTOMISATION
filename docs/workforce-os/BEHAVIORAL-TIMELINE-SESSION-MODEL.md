# COYA — Chronologie comportementale & « session d’activité »

**Statut :** modèle produit / données (référence)  
**Rapport au doc principal :** complète [Human Capital & Workforce Intelligence OS](../HUMAN-CAPITAL-WORKFORCE-INTELLIGENCE-OS-ARCHITECTURE.md)  
**Positionnement :** **Workforce Intelligence**, pas surveillance employé  

---

## 1. Ne plus réduire l’humain à trois états

Les outils classiques échouent souvent en traitant **présence / absence / pause** comme des booléens métier.

En réalité, un salarié moderne produit une **chronologie comportementale** : enchaînements de contextes (machine, application, mission, collaboration, inactivité déclarée ou détectée, hors système mais productif).

**Décision COYA.** Le vocabulaire interne et les écrans évoluent vers :

- **timeline d’activité** (segments horodatés) ;
- **sessions** (regroupements logiques : device, contexte opérationnel, focus) ;
- **consolidation** (une seule journée utilisateur malgré multi-PC / multi-app).

Les statuts « présence » historiques restent des **étiquettes de contexte** ou des **résumés réglementaires**, pas la vérité unique du travail.

---

## 2. Cinq dimensions à distinguer (toujours)

| Dimension | Question posée | Exemple de signal |
|-----------|------------------|-------------------|
| **A. Présence système** | La personne est-elle authentifiée / connectée à un canal COYA ? | session web, mobile, borne |
| **B. Activité réelle** | Y a-t-il des interactions techniques ou métier ? | saisie, navigation, action CRM, commit, validation |
| **C. Productivité** | De la **valeur métier** sort-elle ? | tâche clôturée, ticket résolu, document publié, mission validée |
| **D. Disponibilité** | Est-on joignable / interruptible ? | statut collaboratif, calendrier |
| **E. Engagement opérationnel** | La contribution est-elle alignée objectifs / charge ? | avancement OKR, charge vs capacité |

**Règle d’or.** « Connecté » **≠** « productif ». Les KPIs doivent le dire explicitement (définitions versionnées, affichage non ambigu).

---

## 3. Multi-device & multi-session

**Un utilisateur ≠ une machine.**

- Plusieurs **devices** (laptop, desktop, mobile terrain).
- Plusieurs **sessions** concurrentes ou successives.

**Interdit métier.** Doubler le temps de travail parce que deux machines sont ouvertes.

**Obligation.** Un **Session Consolidation Engine** (moteur ultérieur) :

- fusionne les intervalles qui se chevauchent ;
- attribue les segments à une **timeline unique par worker et par jour (fuseau)** ;
- recalcule durées : connecté, actif, productif, collaboratif, inactif, pause déclarée, hors système **justifié** (contexte).

---

## 4. Interprétation : trois niveaux d’activité

1. **Niveau 1 — Activité technique** (clavier, souris, navigation) : utile en complément, **jamais suffisant** seul (risque de faux positifs / présence fantôme).
2. **Niveau 2 — Activité métier** (tâches, tickets, documents, workflows COYA) : cœur de la corrélation déjà amorcée via *Activity Events*.
3. **Niveau 3 — Valeur produite** (livrables, validations, objectifs) : base des **scores de productivité réelle**.

---

## 5. Scores (à définir contractuellement, pas « en dur » moralisateur)

| Score | Axes typiques |
|-------|----------------|
| **Activity** | densité d’interactions / diversité d’actions (bornes, transparence) |
| **Productivity** | sorties métier / temps productif déclaré ou prouvé |
| **Focus** | durées continues sur une même imputation / tâche |
| **Collaboration** | validations, échanges, co-édition (modules concernés) |
| **Efficiency** | temps estimé vs temps réel (projets, tâches) |

Chaque score : **période, périmètre, données utilisées, limites légales**, et **jamais** une phrase du type « cet employé est mauvais ».

---

## 6. Langage RH / management : hypothèses, pas verdicts

Le système propose des **pistes d’interprétation** :

- surcharge, mauvaise affectation, lacune de compétence, friction workflow, outillage, charge manageriale, multitâche excessif, etc.

La **décision** reste humaine (manager, RH, médecine du travail selon cas).

---

## 7. Contextes opérationnels (hors « simple absence »)

Réunion externe, mission terrain, appel client, formation, support, déplacement : souvent **hors COYA** mais **productifs**.

**Réponse COYA.** Contextes déclarés ou inférés (avec garde-fous) pour classer le segment : *hors système mais productif*, *mission*, *formation*, etc. — aligné programmes/projets/missions existants.

---

## 8. Restitution & exports

- **Timeline** journalière (segments + légende).
- **Heatmaps** (pics, creux, surcharge).
- Vues analytiques par projet / mission / client / équipe.
- Vues RH (régularité, fatigue **estimée**, signaux — pas diagnostic médical).
- **PDF / Excel / CSV / API** : rapports avec timeline + synthèse chiffrée + anomalies signalées (pas uniquement tableaux plats).

---

## 9. Moteurs à cartographier sur l’implémentation COYA

| Moteur | Rôle |
|--------|------|
| **Session Engine** | devices, sessions, connexions |
| **Activity Engine** | événements métier & techniques (déjà amorcé : `ActivityEvent`) |
| **Context Engine** | mission, réunion, pause, terrain, formation |
| **Productivity Engine** | agrégats valeur / efficacité |
| **Consolidation Engine** | fusion multi-device, anti-double comptage |
| **Workforce Intelligence Engine** | anomalies, fatigue opérationnelle **estimée**, dérives |

L’implémentation actuelle alimente **Activity Engine** (`workforce_activity_events`) et dérive des **segments** (`workforce_timeline_segments`, migration `20260510120000`) via une persistance chaînée. Le **Session Consolidation Engine** (`mergeOverlappingIntervals` / `consolidateIsoSegments` dans `services/workforce/sessionConsolidationEngine.ts`) sert aux agrégations lecture (anti double comptage) ; la fusion multi-device complète viendra au-dessus de ces primitives.

---

## 10. Éthique & conformité

- Pas de finalité punitive cachée ; transparence sur les données collectées.
- Minimisation : ne pas activer la couche « technique invasive » sans politique explicite par organisation / pays.
- Positionnement marché : **intelligence opérationnelle** et santé organisationnelle, pas « employee surveillance ».

---

## Références marché (lecture comparative)

Des acteurs comme Hubstaff, Toggl Track, Clockify ou des offres *workforce analytics* illustrent la corrélation temps / activité / projets ; les **gaps** fréquents (états trop simplistes, KPI trompeurs, faible lien RH–projets, reporting statique) sont explicitement des axes de **différenciation** pour COYA, via événements riches, contextes métier et consolidation multi-session.

---

*Document vivant — à synchroniser avec le registre métrique et les migrations de segments de timeline lorsqu’elles seront introduites.*
