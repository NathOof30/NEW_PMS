/**
 * Gestionnaire du LocalStorage (État persistant, logs d'audits, configuration)
 */

import { APP_CONFIG } from '../config.js';

export class LocalStorageManager {
  /**
   * Structure de données par défaut complète et conforme au Paquet Hygiène
   */
  static getDefaultState() {
    return {
      version: APP_CONFIG.VERSION,
      establishment: {
        name: 'Restaurant / Traiteur Démo',
        siret: '123 456 789 00012',
        hygieneReferent: 'Yannick'
      },
      team: ['Yannick'],
      activeUser: 'Yannick',
      pinHash: null,

      // PILIER 1 : Plan de Nettoyage et Désinfection (PND) complet
      cleaningTasks: [
        // Quotidien : Ouverture
        {
          id: 'pnd-1',
          name: 'Lavage & désinfection des mains au lave-mains dédié',
          zone: 'Postes de travail & sas',
          period: 'Ouverture',
          frequency: 'daily',
          product: 'Savon bactéricide homologué',
          dosage: 'Pur - Lavage 30s',
          method: 'Lavage jusqu\'aux coudes, séchage avec essuie-mains jetable',
          responsible: 'Tout le personnel'
        },
        {
          id: 'pnd-2',
          name: 'Désinfection des plans de travail, billots et planches',
          zone: 'Cuisine chaude / froide',
          period: 'Ouverture',
          frequency: 'daily',
          product: 'Désinfectant surface contact alimentaire (EN 1276 / EN 13697)',
          dosage: 'Spray prêt à l\'emploi ou 2%',
          method: 'Pulvériser, laisser agir 5 min, essuyer avec lavette propre ou raclette',
          responsible: 'Cuisinier'
        },
        {
          id: 'pnd-3',
          name: 'Contrôle visuel de propreté et rangement des chambres froides (FIFO)',
          zone: 'Chambres froides positives & négatives',
          period: 'Ouverture',
          frequency: 'daily',
          product: 'Contrôle visuel',
          dosage: 'N/A',
          method: 'Vérifier l\'absence de givre excessif, propreté des clayettes et rotation des dates',
          responsible: 'Second de cuisine'
        },
        {
          id: 'pnd-4',
          name: 'Vérification des tenues de travail et port de coiffe',
          zone: 'Vestiaires & cuisine',
          period: 'Ouverture',
          frequency: 'daily',
          product: 'Tenue propre obligatoire',
          dosage: 'N/A',
          method: 'Tenue propre, cheveux attachés et couverts, ongles courts sans vernis, aucun bijou',
          responsible: 'Chef de cuisine'
        },

        // Quotidien : En cours de service
        {
          id: 'pnd-5',
          name: 'Désinfection couteaux et trancheurs entre chaque préparation',
          zone: 'Préparation froide / Boucherie',
          period: 'Service',
          frequency: 'daily',
          product: 'Alcool désinfectant contact alimentaire sans rinçage',
          dosage: 'Pur en spray',
          method: 'Pulvérisation entre découpe de viandes crues et légumes (marche en avant)',
          responsible: 'Opérateur'
        },

        // Quotidien : Fermeture
        {
          id: 'pnd-6',
          name: 'Nettoyage & dégraissage des équipements de cuisson (pianos, fours, planchas)',
          zone: 'Cuisine chaude',
          period: 'Fermeture',
          frequency: 'daily',
          product: 'Décapant dégraissant cuisine professionnelle',
          dosage: 'Solution à 5%',
          method: 'Laisser agir sur surfaces tièdes (<60°C), frotter puis rincer abondamment à l\'eau claire',
          responsible: 'Plongeur / Cuisinier'
        },
        {
          id: 'pnd-7',
          name: 'Démontage, lavage et désinfection des robots, trancheuses et hachoirs',
          zone: 'Préparations',
          period: 'Fermeture',
          frequency: 'daily',
          product: 'Détergent désinfectant désincrustant',
          dosage: 'Bain à 2%',
          method: 'Démonter les pièces amovibles, trempage 15 min, brosser, rincer à l\'eau claire et sécher',
          responsible: 'Cuisinier'
        },
        {
          id: 'pnd-8',
          name: 'Vidage et désinfection des poubelles à pédale',
          zone: 'Ensemble de la cuisine',
          period: 'Fermeture',
          frequency: 'daily',
          product: 'Détergent bactéricide',
          dosage: 'Bain ou spray 3%',
          method: 'Fermer les sacs hermétiquement, transporter au local poubelle, laver et désinfecter les bacs',
          responsible: 'Plongeur'
        },
        {
          id: 'pnd-9',
          name: 'Balayage humide, lavage et raclage des sols et siphons',
          zone: 'Sols cuisine et plonge',
          period: 'Fermeture',
          frequency: 'daily',
          product: 'Nettoyant désinfectant sols homologué',
          dosage: '1% en eau chaude',
          method: 'Balayage humide (pas de balayage à sec), lavage, brossage des siphons, raclette vers évacuations',
          responsible: 'Plongeur'
        },

        // Hebdomadaire
        {
          id: 'pnd-10',
          name: 'Nettoyage complet des clayettes et joints des réfrigérateurs',
          zone: 'Toutes enceintes froides',
          period: 'Hebdo',
          frequency: 'weekly',
          product: 'Désinfectant alimentaire sans rinçage',
          dosage: 'Pur ou 2%',
          method: 'Vider le compartiment, lessiver les joints et grilles, sécher avec lavette propre',
          responsible: 'Second de cuisine'
        },
        {
          id: 'pnd-11',
          name: 'Détartrage des machines (lave-vaisselle, machines à glaçons, éviers)',
          zone: 'Plonge et bar',
          period: 'Hebdo',
          frequency: 'weekly',
          product: 'Produit détartrant acide alimentaire',
          dosage: 'Selon fiche constructeur',
          method: 'Cycle de détartrage sans vaisselle, rincer à fond',
          responsible: 'Plongeur'
        },
        {
          id: 'pnd-12',
          name: 'Dépoussiérage et lessivage des réserves sèches et étagères',
          zone: 'Économat / Réserve',
          period: 'Hebdo',
          frequency: 'weekly',
          product: 'Détergent multi-surfaces',
          dosage: '1%',
          method: 'Nettoyage des étagères et sols, contrôle des DDM des produits secs',
          responsible: 'Gestionnaire de stock'
        },

        // Mensuel
        {
          id: 'pnd-13',
          name: 'Dégraissage approfondi des filtres et hottes d\'aspiration',
          zone: 'Extraction cuisine',
          period: 'Mensuel',
          frequency: 'monthly',
          product: 'Super dégraissant alcalin',
          dosage: 'Trempage 10%',
          method: 'Dépose des filtres à chicanes, trempage eau bouillante, passage en plonge / lave-vaisselle',
          responsible: 'Chef de cuisine / Équipe'
        },
        {
          id: 'pnd-14',
          name: 'Désinfection approfondie des siphons et canalisations de sol',
          zone: 'Évacuations générales',
          period: 'Mensuel',
          frequency: 'monthly',
          product: 'Traitement biologique / enzymatique ou déboucheur désinfectant',
          dosage: 'Pur selon protocole',
          method: 'Retirer les paniers, brosser l\'intérieur des bondes, verser le produit et laisser agir la nuit',
          responsible: 'Plongeur'
        }
      ],

      // PILIER 1 : Suivi hygiène du personnel & santé quotidienne
      healthChecks: [],

      // PILIER 1 : Contrôle Nuisibles (Dératisation/Désinsectisation) & Déchets
      pestControls: [],

      // PILIER 1 : Maintenance & Étalonnage des thermomètres
      calibrations: [],

      // PILIER 2 : Équipements thermiques (Enceintes & Liaisons)
      equipments: [
        { id: 'eq-1', name: 'Chambre Froide Positive 1 (Viandes/Poissons)', type: 'frais', min: 0, max: 2, zone: 'Cuisine / Boucherie', icon: '🥩' },
        { id: 'eq-2', name: 'Chambre Froide Positive 2 (Légumes/Laitages)', type: 'frais', min: 0, max: 4, zone: 'Cuisine / Préparation', icon: '🥬' },
        { id: 'eq-3', name: 'Congélateur Négatif', type: 'surgele', min: -25, max: -18, zone: 'Réserve surgelés', icon: '❄️' },
        { id: 'eq-4', name: 'Vitrine Chaude Service', type: 'chaud', min: 63, max: 90, zone: 'Zone d\'envoi / Passe', icon: '🔥' }
      ],

      // PILIER 2 : Cycles de refroidissement rapide (CCP Majeur : ≤ 10°C en < 2h)
      coolingCycles: [],

      // PILIER 2 : Contrôles de cuisson à cœur & réchauffage (CCP Cuisson : ≥ 63°C)
      cookingCycles: [],

      // PILIER 2 : Friteuses & Huiles de friture (Seuil 24% TTCP)
      fryers: [
        { id: 'fry-1', name: 'Friteuse 1 (Frites & Pommes de terre)', oilType: 'Huile tournesol / Végétale', maxTTCP: 24 },
        { id: 'fry-2', name: 'Friteuse 2 (Poissons & Beignets)', oilType: 'Huile haute température', maxTTCP: 24 }
      ],
      fryerChecks: [],

      // Historique consolidé inaltérable de tous les enregistrements
      logs: []
    };
  }

  /**
   * Chargement de l'état avec fusion automatique des clés manquantes
   */
  static load() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
      if (!raw) {
        const initialState = this.getDefaultState();
        this.save(initialState);
        return initialState;
      }
      
      const parsed = JSON.parse(raw);
      const defaults = this.getDefaultState();

      // Fusion protectrice : si de nouvelles sections ou tâches sont ajoutées au modèle, on les préserve
      const merged = {
        ...defaults,
        ...parsed,
        establishment: {
          ...defaults.establishment,
          ...(parsed.establishment || {}),
          hygieneReferent: 'Yannick'
        },
        // Le PMS est utilisé par Yannick seul. Les historiques conservent leurs
        // signataires d'origine, mais la configuration active est normalisée.
        team: ['Yannick'],
        activeUser: 'Yannick',
        cleaningTasks: Array.isArray(parsed.cleaningTasks) && parsed.cleaningTasks.length ? parsed.cleaningTasks : defaults.cleaningTasks,
        equipments: Array.isArray(parsed.equipments) && parsed.equipments.length ? parsed.equipments : defaults.equipments,
        coolingCycles: Array.isArray(parsed.coolingCycles) ? parsed.coolingCycles : [],
        cookingCycles: Array.isArray(parsed.cookingCycles) ? parsed.cookingCycles : [],
        fryers: Array.isArray(parsed.fryers) && parsed.fryers.length ? parsed.fryers : defaults.fryers,
        fryerChecks: Array.isArray(parsed.fryerChecks) ? parsed.fryerChecks : [],
        logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        healthChecks: Array.isArray(parsed.healthChecks) ? parsed.healthChecks : [],
        pestControls: Array.isArray(parsed.pestControls) ? parsed.pestControls : [],
        calibrations: Array.isArray(parsed.calibrations) ? parsed.calibrations : []
      };

      return merged;
    } catch (err) {
      console.error('Erreur lecture localStorage:', err);
      return this.getDefaultState();
    }
  }

  /**
   * Sauvegarde atomique de l'état
   */
  static save(state) {
    try {
      localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error('Erreur écriture localStorage:', err);
      return false;
    }
  }
}
