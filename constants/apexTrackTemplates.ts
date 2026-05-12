export interface ApexTrackModule {
  id: string;
  title: string;
  weeks: number;
  focus: string;
}

export interface ApexTrackTemplate {
  id: string;
  name: string;
  durationMonths: number;
  audience: string;
  description: string;
  modules: ApexTrackModule[];
}

export const sixMonthsFourFilieresTrack: ApexTrackTemplate = {
  id: 'track-6mois-4filieres',
  name: 'Parcours 6 mois · 4 filières',
  durationMonths: 6,
  audience: 'Jeunes et bénéficiaires incubés',
  description:
    'Parcours long multi‑filières inspiré de la présentation « Formation_6mois_4filieres » — structure indicative à mapper sur les cours et cohortes.',
  modules: [
    {
      id: 'onboarding',
      title: 'Onboarding & socle commun',
      weeks: 2,
      focus: 'Accueil, digital, découverte filières et règles du dispositif.',
    },
    {
      id: 'filiere-1',
      title: 'Filière 1 · Tronc commun',
      weeks: 4,
      focus: 'Compétences de base et ateliers pratiques filière 1.',
    },
    {
      id: 'filiere-2',
      title: 'Filière 2 · Tronc commun',
      weeks: 4,
      focus: 'Compétences de base et ateliers pratiques filière 2.',
    },
    {
      id: 'filiere-3',
      title: 'Filière 3 · Tronc commun',
      weeks: 4,
      focus: 'Compétences de base et ateliers pratiques filière 3.',
    },
    {
      id: 'filiere-4',
      title: 'Filière 4 · Tronc commun',
      weeks: 4,
      focus: 'Compétences de base et ateliers pratiques filière 4.',
    },
    {
      id: 'projets',
      title: 'Projets terrain & mentorat',
      weeks: 6,
      focus: 'Mise en pratique sur projets réels, mentorat, coaching collectif.',
    },
    {
      id: 'evaluation',
      title: 'Évaluations finales & certification',
      weeks: 2,
      focus: 'Quiz, soutenance éventuelle, consolidation des acquis.',
    },
  ],
};

export const threeMonthsAutoEntrepreneursTrack: ApexTrackTemplate = {
  id: 'track-3mois-autoentrepreneurs',
  name: 'Parcours 3 mois · Auto‑entrepreneurs',
  durationMonths: 3,
  audience: 'Entrepreneurs individuels et très petites entreprises',
  description:
    'Variante courte inspirée de « Formation_3mois_AutoEntrepreneurs_v2 » — centrée sur le lancement et la structuration de l’activité.',
  modules: [
    {
      id: 'diagnostic',
      title: 'Diagnostic & posture entrepreneuriale',
      weeks: 2,
      focus: "Clarification du projet, diagnostic des besoins, soft skills d'entrepreneur.",
    },
    {
      id: 'business-model',
      title: 'Business model & offre',
      weeks: 3,
      focus: 'Proposition de valeur, ciblage, canaux et premiers calculs de rentabilité.',
    },
    {
      id: 'gestion',
      title: 'Gestion quotidienne & conformité',
      weeks: 3,
      focus: 'Trésorerie, obligations fiscales / sociales, outils simples de pilotage.',
    },
    {
      id: 'commercial',
      title: 'Marketing terrain & vente',
      weeks: 2,
      focus: 'Prospection, argumentaire, suivi des clients et partenariats locaux.',
    },
    {
      id: 'coaching-final',
      title: 'Coaching final & plan d’actions',
      weeks: 2,
      focus: 'Plan d’actions personnalisé, engagements et préparation post‑programme.',
    },
  ],
};

export const APEX_TRACK_TEMPLATES: ApexTrackTemplate[] = [
  sixMonthsFourFilieresTrack,
  threeMonthsAutoEntrepreneursTrack,
];

