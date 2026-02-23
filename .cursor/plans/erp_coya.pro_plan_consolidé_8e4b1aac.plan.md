---
name: ERP COYA.PRO Plan consolidé
overview: "Consolidation du plan COYA.PRO : refonte du dashboard (analytics prédictif, scoring, cabanes colorées), renforcement Projets/Tâches (budgets, SMART/SWOT, scoring auto, gel, justificatifs), nouveaux modules (Logistique, Parc auto, Ticket IT, Alerte anonyme, Messagerie/Discuss), amélioration RH/Programme/Comptabilité/CRM, distinction Rôle/Poste, login fidèle à la ref, et classification modules avec contenu vs stub."
todos: []
isProject: false
---

# Plan consolidé COYA.PRO – Dashboard, modules, scoring et écosystème

Références : [plan_développement_coya.pro_5b4c919c.plan.md](c:\Users\Lenovo.cursor\plans\plan_développement_coya.pro_5b4c919c.plan.md) (Phases 0–24), [phase_4_modules_métier_ce5e40d1.plan.md](c:\Users\Lenovo.cursor\plans\phase_4_modules_métier_ce5e40d1.plan.md), [Sidebar.tsx](coya-pro/components/Sidebar.tsx), [App.tsx](coya-pro/App.tsx) (renderView), [Dashboard.tsx](coya-pro/components/Dashboard.tsx).

---

## État actuel des modules (analyse croisée)

**Modules avec contenu réel (composant dédié, workflow) :**

- **Tableau de bord** : [Dashboard.tsx](coya-pro/components/Dashboard.tsx) (refonte Boltz déjà faite jusqu’à Congés + bloc en dessous à revoir).
- **Projets** : [Projects.tsx](coya-pro/components/Projects.tsx) – à étendre (budgets, tâches SMART, scoring, gel).
- **Planning** : [Planning.tsx](coya-pro/components/Planning.tsx).
- **RH** : [RhModule.tsx](coya-pro/components/RhModule.tsx) – à renforcer (fiche poste, organigramme, paie, planning type My Timesquare).
- **Finance** : [Finance.tsx](coya-pro/components/Finance.tsx) – à garder et améliorer.
- **Formations** : [Courses.tsx](coya-pro/components/Courses.tsx), CourseDetail, CourseManagement.
- **Emplois** : [Jobs.tsx](coya-pro/components/Jobs.tsx), CreateJob, JobManagement.
- **CRM & Ventes** : [CRM](coya-pro/App.tsx) – à rendre extensible (partenaires, catégories).
- **Base de connaissances** : KnowledgeBase.
- **Analytique** : Analytics.
- **Analyse des talents** : TalentAnalytics.
- **Congés** : LeaveManagement, LeaveManagementAdmin.
- **Suivi du temps** : TimeTracking.
- **Paramètres** : Settings ; **Admin** : UserManagement, OrganizationManagement, DepartmentManagement.
- **Surveillance** : NotificationsPage, ActivityLogsPage.

**Modules stub (ModuleHub uniquement – “Contenu à venir”) :**

- Programme, Comptabilité, Partenariat, Qualité, Trinité, Juridique, Studio, Tech, Collecte, Conseil.

**À créer de bout en bout (nouveaux) :**

- Logistique (équipements, dotations, traçabilité, demande/validation).
- Parc automobile (gestion, suivi, entretien, mise à disposition sur demande).
- Ticket IT (demande → validation manager → envoi IT).
- Alerte anonyme (transparence, anticorruption, cellule de crise, enquête, preuves, audit plateforme).
- Messagerie / Discuss (remplacement chatbot : canaux, discussions individuelles, centres d’assistance, appels type Odoo/Teams).

---

## 1. Dashboard – Ce que tu aimes vs à remplacer

**Conserver (du haut vers le bas jusqu’à “Congés”) :**

- En-tête utilisateur (bonjour, rôle, présence, avatar).
- Barre recherche + “Filtrer période”.
- Titre “Tableau de bord”.
- 4 cartes KPI (jours travaillés, projets en cours, heures semaine, taux de complétion).
- Donut “Répartition des projets” + courbe “Heures / Tendance”.
- 4 cartes type Main Balance (Mes projets, Objectifs, Temps, Alertes).
- Activités récentes (time logs).
- Congés en attente + Factures en attente.

**Remplacer / transformer (en dessous) :**

- **Supprimer ou fortement réduire** : “Analyse intelligente & prédictions” actuelle ([IntelligentInsights](coya-pro/components/Dashboard.tsx) lignes 633+) – messages statiques (opportunité d’amélioration, projets en retard, etc.) sans vrais algorithmes.
- **Supprimer ou déplacer** : sections “Mes projets” (2 cartes), “Mes formations”, “Offres d’emploi”, “Raccourcis par module” en l’état – soit les intégrer dans le nouveau bloc analytique, soit les garder en bas mais simplifiés.

**Nouveau bloc “Power BI” / Business Analytics & Prédictif :**

- **Cabanes (cartes) avec code couleur** : vert = excellent, jaune = moyen, orange = à risque, rouge = critique (selon seuils paramétrables).
- **Périmètres** : utilisateur (mensuel / hebdo / journalier), équipe, département, entreprise.
- **Indicateurs** : performance (taux réalisation, objectifs atteints), assiduité (présence), discipline (retards, alertes), productivité (heures, livrables).
- **Règles métier** : personne sans objectif/tâche = 100 % (rien à manquer) ; mise à jour automatique dès que les statuts/tâches/objectifs changent.
- **Alertes risques** : calculées par algorithme (taux de réalisation, atteinte objectifs, présence, respect livrables, productivité, Trinité) – pas seulement des messages fixes.
- **Scoring** : intégration du scoring Projets/Tâches/Managers (voir section 2) et Trinité pour une vue agrégée (trimestriel, semestriel, annuel).

Livrable : refonte de la zone “sous Congés” en un bloc configurable (widgets activables en admin), formules et seuils en base ou config, avec droits par user/département/rôle.

---

## 2. Projets et Tâches – Élargissement et scoring

**Budgets :**

- Budget prévisionnel en amont et/ou budget existant (ou aucun) par projet ; lignes budgétaires par poste de dépense ; suivi prévu vs réel.

**Tâches SMART / SWOT :**

- Tâches avec critères SMART (optionnel SWOT) ; indicateurs de performance par projet calculés automatiquement par la plateforme (transparence, OKR, KPI).

**Assignation :**

- Assignation à un ou plusieurs utilisateurs, ou à un département entier ; stratégique et prioritaire (pas “à tout va”) ; politique de charge pour éviter surcharge et garder un barème de scoring unanime.

**Objectifs hebdo / journaliers :**

- Objectifs de la semaine possibles par jour selon le planning de la personne ; pour chaque tâche : durée, heure et date précises.
- **Règle gel** : si la date/heure/durée est dépassée et que l’utilisateur n’a pas mis “Réalisé”, le projet se gèle automatiquement ; seul le manager peut débloquer / clôturer (pour garantir la qualité).
- **Scoring** : tâche non réalisée à échéance = objectif manqué = score négatif ; réalisée dans les délais = objectif atteint = score positif. **Barème** : +5 % par tâche réalisée (salarié), +7 % (manager qui clôture les réalisations de ses subordonnés). Si le manager ne clôture pas les réalisations de son subordonné, il n’obtient pas son score (objectif non atteint). Bonus/malus, plafond 100 %.
- **Seuils** : 100 % excellent, 90 % très bien, 80 % bien, 70 % à encourager, 60 % insuffisant, 50 % très insuffisant, 40 % très faible → brief avec responsable, demande d’explication, alerte signée par le collaborateur ; **3 alertes en 6 mois** = malus sur salaire (règle à paramétrer).
- **Justificatif obligatoire** : chaque “Réalisé” doit avoir au moins une pièce jointe (photo, document, lien réunion, capture, accusé de réception, etc.).

**Risques et Trinité :**

- Gestion des risques basée sur : taux de réalisation, atteinte des objectifs, taux de présence, respect des livrables (mesurable), productivité, autres indicateurs à définir.
- Module Trinité : scoring (Ndiguel, Yar, Barké) qui s’ajoute aux indicateurs ; la moyenne détermine les évaluations trimestrielles / mensuelles / semestrielles / annuelles ; matrice déterminée par algorithme.

**Administration :** paramétrage par user, département ou rôle (seuils, barèmes, alertes, qui peut clôturer, etc.).

Référence code : [Projects.tsx](coya-pro/components/Projects.tsx), [ProjectDetailPage.tsx](coya-pro/components/ProjectDetailPage.tsx), types `Project`, `Task` dans [types.ts](coya-pro/types.ts).

---

## 3. Rôle vs Poste (Signup et profil)

- **Rôle** (ex. Super admin, Admin, Manager, Employé, Étudiant/Bénéficiaire, Facilitateur, Formateur, Partenaire) : inchangé dans [types.ts](coya-pro/types.ts) et [Signup.tsx](coya-pro/components/Signup.tsx) pour l’inscription.
- **Poste** (ex. Directeur Général, Directeur Exécutif, Directeur des Opérations, Directeur Administratif et Financier) : **nouveau référentiel extensible** (table `postes` ou équivalent, comme dans Odoo) ; champ “Poste” dans le profil / fiche salarié ; à l’édition : liste existante + “Créer et enregistrer” si nouveau.
- Sur la **page Signup** : clarifier la liste affichée (séparer visuellement “Rôle” et, si besoin, un futur “Poste” ou le retirer de l’inscription et ne le gérer qu’en RH/Paramètres) pour éviter la confusion actuelle.

---

## 4. Login – Reproduction fidèle

- Refonte de [Login.tsx](coya-pro/components/Login.tsx) pour reproduire fidèlement [REF-LOGIN PAGE.png](coya-pro/REF-LOGIN PAGE.png) (ou le fichier équivalent dans le workspace) : fond, carte centrée, logo COYA/SENEGEL, champs épurés, bouton primaire charte, liens “Mot de passe oublié” / “Créer un compte” discrets.
- Alignement avec [CHARTE-GRAPHIQUE-COYA.md](coya-pro/docs/CHARTE-GRAPHIQUE-COYA.md) et [index.css](coya-pro/src/index.css).

---

## 5. Partenaires et CRM extensible

- Intégrer la **gestion des partenaires** au CRM (pas seulement “clients”) : nouvelles catégories et extensions possibles (modulable).
- CRM “malléable et extensible” : types de contacts/entités configurables, champs et cibles personnalisables.
- Administration des droits par user, département ou rôle.

---

## 6. Logistique (nouveau module)

- **Objet** : immobilisations, matériel, produits ; nature et type d’usage ; gestion des équipements, dotations, mise à disposition, traçabilité, optimisation, prévision des besoins.
- **Liens** : Comptabilité, Formations, Studio, Projets, Programme (rattachement à une tâche, projet, formation, réunion).
- **Workflow** : demande d’équipement → validation → mise à disposition (durée d’usage, date de retour prévue) ; suivi et alertes automatiques.
- **Fiche équipement** : image, marque, modèle, couleur, références, emplacement, personne responsable, motif du besoin.
- Administration et droits par user/département/rôle.

---

## 7. Parc automobile (nouveau module)

- Même logique que Logistique mais dédié aux véhicules : gestion, suivi, contrôle, entretien, dépannage, mise à disposition sur **demande validée** par la personne en charge.

---

## 8. Ticket IT (nouveau module)

- Toute panne ou problème technique passe par **Ticket IT** : création par l’utilisateur → **validation obligatoire par le manager** → envoi au département IT.
- Créer tables, écrans (liste, détail, workflow) et droits (qui peut créer, valider, traiter).

---

## 9. Messagerie / Discuss (remplacement chatbot)

- Remplacer ou compléter le **chatbot** par une **messagerie** :
  - Discussions de groupe (administration par user/département/rôle).
  - Canaux généraux et **conversations individuelles** (user à user).
  - Centres d’assistance par département, équipe ou rôle (modulable).
  - **Appels** : département, groupe, ou d’un user à un autre (type Odoo Discuss / Teams).
- Administration et droits par user/département/rôle.

Alignement avec Phase 24 du plan existant (Chat intégré / Discuss).

---

## 10. Alerte anonyme (nouveau module)

- **Objectif** : transparence, protection des salariés, intégrité de l’entreprise, politique anticorruption, anti-discrimination, anti-despotisme.
- Toute personne peut lancer une **alerte** (anonyme ou non) en cas de manquement au règlement, injustice, harcèlement, etc.
- **Administration** : supervision et suivi des alertes (user/département/rôle).
- **Protocole** : réception d’une alerte (ex. favoritisme, harcèlement) → activation de la **cellule de crise / Alerte anonyme** ; contrôle conformité / enquête interne **anonyme et confidentielle**.
- **Contenu** : lanceur peut rester anonyme mais désigner le(s) collaborateur(s) présumé(s) coupable(s), complices ; nature des faits, date, heure, lieu ; pièces jointes (image, vidéo, audio, document).
- **Audit plateforme** : à partir de l’alerte, la plateforme peut lancer un **audit** sur le(s) user(s) concerné(s) (messages, gestion des tâches, logs, etc.).

---

## 11. Comptabilité

- Tenue du **journal annuel** conforme **SYSCOHADA** et **SYCEBNL** (Sénégal / Afrique).
- Génération de **bilans** (mensuel, bimestriel, trimestriel, semestriel, annuel), **comptes de résultat**, **analyse financière**, **comptabilité générale**, **gestion des budgets**, **flux de trésorerie**, **fiscalité**.
- Remplacer le stub [ModuleHub](coya-pro/App.tsx) pour `comptabilite` par un module complet (tables, écrans, rapports).

---

## 12. Ressources humaines (refonte / renforcement)

- **Fiche de poste** et **fiche employé** (type Odoo) ; **organigramme** : affectation manager, superviseur, formateur ; rattachement au département ; départements parent/enfant ; plusieurs managers/superviseurs par département.
- **Fiches de mission**, **état civil**, **CV numérique**.
- **Paie** : édition manuelle des bulletins ; politique de paie (ex. mois comptable 16–15, paiement avant le 10) ; assiduité, primes, bonus/malus, retenues, correction d’erreurs ; l’utilisateur voit un **aperçu de ses stats du mois** et indicateurs affectant son salaire.
- **Congés** : intégration à la paie (ex. 1,5 j / 26 j travaillés, cumul 3–6 mois, accord selon pics d’activité) ; pour postes plus élevés, indice de congés évolutif (ex. 2 j après 26 j à 44 h/semaine).
- **Planning horaire** : type “My Timesquare” pour tous les employés ; planification intelligente du personnel, shifts rotatifs ; **publication J-14 à J-7** ; modulation possible (ex. 44 h → 30 h ou 40 h/semaine en basse activité, heures cumulables et réaffectables ; crédit d’heures à l’entreprise au départ, impact sur solde de congés).
- Administration par user/département/rôle.

---

## 13. Programme & Bailleur (module complet)

- Programmes (formation, incubation, social, économique) financés par bailleurs (UNICEF, GIZ, ENABEL, etc.) ; pilotage, co-pilotage ou exécution seule.
- **Projets** par programme ; **équipe** : chef de projet, coachs, facilitateurs, formateurs, mentors, consultants, staff (journalistes, restauration, technique, photo, IT, logistique, bureautique), ressources matérielles/intellectuelles/financières.
- **Lignes budgétaires** prévisionnel par poste de dépense (programme/projet) ; dépenses réelles suivies ; devis / facture proforma signés et datés ; validation des paiements ; justificatifs ; calendrier propre au programme/projet.
- **Audits et contrôles** possibles sans préavis ; rapports (preuves, contacts vendeurs, dates, signatures).
- **Organigramme** des intervenants (pilotage / management).
- **Bénéficiaires** : thème, cible, genre, secteur, pays, région, contact, âge, niveau d’études, profession ; utilisation du module **Collecte** pour formulaires rattachés (projet, programme, enquête, recrutement).
- **Comptes bénéficiaires / apprenants** : création automatique avec **durée d’accès** ; à l’échéance suppression du compte mais **historisation** des contenus de formation et du programme/projet.
- Remplacer le stub `programme` par ce module complet ; administration par user/département/rôle.

---

## 14. Historique et évaluation

- **Conserver l’historique** des anciens projets et de tout ce qui a été renseigné sur la plateforme.
- Pour le **nouveau système d’évaluation / notation / scoring** : possibilité de le considérer “hors délai” jusqu’à une **date de démarrage** choisie (évaluations à partir de cette date) ; les données passées restent consultables mais pas nécessairement notées avec le nouveau barème.

---

## 15. Administration et droits (transversal)

- **Système d’administration** (paramétrage, droits d’accès) **modulable par utilisateur, par département et par rôle** : qui peut faire quoi, qui peut accéder à quoi, pour chaque module et sous-fonctionnalité.
- **Sélection multi-utilisateurs** : pouvoir sélectionner, filtrer et trier plusieurs utilisateurs pour assignation de tâches, attribution de droits ou de fonctionnalités (éviter le “un par un”).

---

## Ordre d’exécution recommandé (fusion avec Phases 0–24)

1. **Phase 0** (fondations) : Charte Login (refonte fidèle REF-LOGIN), sélecteur de statut + compte à rebours, libellés modules, rôle vs poste (Signup + référentiel Poste), droits et administration de base.
2. **Phase 1 – Dashboard** : Conserver la partie “du haut jusqu’à Congés” ; remplacer le bloc “Analyse intelligente” et le bas par le **bloc Power BI / analytics prédictif** (cabanes colorées, scoring, alertes algorithmiques, user/équipe/département/entreprise).
3. **Phase 2 – Projets** : Budgets, tâches SMART/SWOT, indicateurs auto, assignation smart, objectifs hebdo/jour avec date/heure/durée, gel automatique, clôture manager, **scoring 5 % / 7 %**, justificatifs obligatoires, risques, intégration Trinité ; politique de charge.
4. **Phases 3 à 23** (plan existant) : Planning, RH (avec fiches, organigramme, paie, congés, planning My Timesquare), Finance, Programme (complet), Comptabilité (SYSCOHADA/SYCEBNL), Formations, Emplois, CRM (extensible + partenaires), Partenariat, Conseil, Analytique, Qualité, Talents, Juridique, Studio, Tech, Collecte, Trinité, Base de connaissances, Monitoring, Paramètres.
5. **Nouveaux modules** : Logistique, Parc automobile, Ticket IT, Alerte anonyme (à insérer dans l’ordre selon priorité métier).
6. **Phase 24** : Messagerie / Discuss (remplacement ou extension du chatbot) + appels.

À chaque phase : interconnexion avec le Dashboard, couche objectifs/temps (SMART), droits et administration par user/département/rôle, et **préservation de l’historique** des données existantes.