/**
 * Configuration globale et constantes réglementaires HACCP
 */

export const APP_CONFIG = {
  APP_NAME: 'PMS Pro Hygiène',
  VERSION: '1.0.0',
  STORAGE_KEY: 'pms_app_state_v1',
  DB_NAME: 'pms_media_vault',
  DB_VERSION: 1
};

/**
 * Liste officielle des 14 allergènes majeurs (Règlement INCO n° 1169/2011)
 */
export const ALLERGENS = [
  'Gluten',
  'Crustacés',
  'Œufs',
  'Poissons',
  'Arachides',
  'Soja',
  'Lait',
  'Fruits à coque',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
  'Lupin',
  'Mollusques'
];

/**
 * Seuils réglementaires et actions correctives types pour le Pilier 2 (HACCP)
 */
export const REGULATORY_THRESHOLDS = {
  // Froid & Enceintes
  FROID_POSITIF_VIANDES_POISSONS: { min: 0, max: 2, label: '0°C à +2°C (Viandes & Poissons ultra-frais)' },
  FROID_POSITIF_PLATS_LAITAGES: { min: 0, max: 4, label: '0°C à +4°C (Plats cuisinés, volailles, charcuteries)' },
  FROID_POSITIF_FRUITS_LEGUMES: { min: 0, max: 6, label: '0°C à +6°C (Fruits & Légumes bruts)' },
  FROID_NEGATIF_SURGELES: { min: -25, max: -18, label: '≤ -18°C (Surgelés & glaces, alerte si > -15°C)' },
  LIAISON_CHAUDE_MIN: 63,

  // Cycles thermiques sensibles (CCP)
  CUISSON_COEUR_MIN: 63,
  CUISSON_COEUR_LISTERIA_MIN: 70,
  REFROIDISSEMENT_MAX_HEURES: 2,
  REFROIDISSEMENT_MAX_MINUTES: 120,
  REFROIDISSEMENT_CIBLE_MAX: 10,
  REMISE_TEMPERATURE_MIN: 63,
  REMISE_TEMPERATURE_MAX_MINUTES: 60,

  // Huiles de friture (Décret 2008-184)
  HUILE_FRITURE_TTCP_OPTIMAL_MAX: 19,
  HUILE_FRITURE_TTCP_WARNING_MAX: 23.5,
  HUILE_FRITURE_TTCP_MAX: 24
};

export const HACCP_CORRECTIVE_ACTIONS = {
  TEMPERATURE: [
    'Thermostat réajusté & surveillance renforcée sous 1h',
    'Produits transférés immédiatement en chambre froide de réserve',
    'Produits isolés, consignés et détruits (rupture chaîne du froid)',
    'Technicien frigoriste contacté en urgence',
    'Porte refermée / cycle de dégivrage contrôlé'
  ],
  COOLING: [
    'Poursuite immédiate du refroidissement en cellule forcée',
    'Consommation immédiate le jour même après réchauffage > 63°C',
    'Produits isolés et détruits (dépassement critique du délai des 2h)',
    'Division en bacs gastronormes de faible épaisseur pour accélérer le froid',
    'Dysfonctionnement de la cellule de refroidissement signalé'
  ],
  COOKING: [
    'Prolongation immédiate de la cuisson jusqu\'à obtention de ≥ 63°C à cœur',
    'Remontée en température rapide (four / bain-marie haute puissance)',
    'Destruction immédiate de la préparation (défaut thermique non rattrapable)',
    'Étalonnage de la sonde thermométrique effectué'
  ],
  FRYERS: [
    'Vidange complète du bac & nettoyage avant nouveau bain',
    'Huile usagée transférée vers le conteneur de collecte HAU',
    'Friteuse mise immédiatement hors service',
    'Ajout d\'appoint d\'huile neuve refusé (vidange totale obligatoire si > 24%)'
  ]
};

export const CORRECTIVE_ACTIONS_PRESETS = [
  ...HACCP_CORRECTIVE_ACTIONS.TEMPERATURE,
  ...HACCP_CORRECTIVE_ACTIONS.COOLING,
  ...HACCP_CORRECTIVE_ACTIONS.COOKING,
  ...HACCP_CORRECTIVE_ACTIONS.FRYERS
];

