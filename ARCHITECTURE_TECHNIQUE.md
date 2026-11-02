# 🏗️ GUIDE D'ARCHITECTURE TECHNIQUE & ARBORESCENCE DU PROJET
## APPLICATION WEB PMS (PLAN DE MAÎTRISE SANITAIRE) MODULAIRE & LOCALE

---

## 1. VISION TECHNIQUE & PRINCIPES D'INGÉNIERIE

Le projet quitte le format d'un fichier monolithique pour adopter une **architecture modulaire en Single Page Application (SPA) native**. Cette conception garantit à la fois une maintenabilité à long terme, une séparation nette des responsabilités et le respect strict des contraintes du client :

1. **Zéro Fuite de Données (Local-First)** : Aucun appel réseau vers un serveur tiers ou une base de données cloud. Les données restent strictement confinées à l'appareil de l'établissement (tablette ou PC).
2. **Offline-First Intégral** : L'application fonctionne sans connexion internet (sous-sol, chambre froide, laboratoire).
3. **Performance & Légèreté** : Aucun framework lourd (React/Angular/Vue) n'est nécessaire ; l'application repose sur des **ES Modules natifs**, garantissant un chargement instantané (< 50ms) et une empreinte mémoire minimale.
4. **Prêt pour le Terrain & PWA** : Compatible avec une installation en plein écran sur tablette de cuisine (iPad / Android / Windows tactile).

---

## 2. ARBORESCENCE COMPLÈTE DU PROJET

Voici la cartographie des répertoires et fichiers mis en place :

```
new_pms/
│
├── index.html                     # Point d'entrée unique de l'application (SPA)
├── manifest.json                  # Déclaration PWA pour installation native sur tablette
│
├── css/                           # Architecture des styles CSS modulaires
│   ├── main.css                   # Variables globales (:root), tokens de design, reset
│   ├── layout.css                 # Mise en page (header, barre basse tactile, container)
│   ├── components.css             # Composants réutilisables (cartes, boutons, badges, formulaires)
│   └── print.css                  # Feuilles de style pour impression thermique (58/80mm) et A4
│
├── js/                            # Logique applicative JavaScript ES6+
│   ├── app.js                     # Bootstrap de l'application, cycle de vie et routeur SPA
│   ├── config.js                  # Constantes réglementaires HACCP, seuils T°C et 14 allergènes
│   │
│   ├── storage/                   # Couche de persistance locale étanche
│   │   ├── local-storage.js       # Gestion de l'état JSON, paramétrages et registres horodatés
│   │   └── indexed-db.js          # Coffre binaire local pour le stockage des photos (BL, étiquettes)
│   │
│   ├── utils/                     # Fonctions d'assistance transversales
│   │   ├── dates.js               # Formattage date/heure, calcul automatique DLC secondaire J+x
│   │   ├── dom.js                 # Sécurité contre les failles XSS, gestionnaire de toasts
│   │   └── image-compressor.js    # Compression d'images via Canvas avant stockage IndexedDB
│   │
│   └── modules/                   # Contrôleurs métier découplés (Pages / Vues)
│       ├── dashboard.js           # Accueil : utilisateur actif, progression du jour, alertes
│       ├── temperatures.js        # Relevés d'enceintes frigorifiques et liaisons chaudes
│       ├── hygiene.js             # Plan de Nettoyage et Désinfection (PND) (matin/soir)
│       ├── reception.js           # Contrôle à réception des marchandises et traçabilité amont
│       ├── production.js          # Cuisson à cœur, cellule de refroidissement rapide, réchauffage
│       ├── traceability.js        # Lots internes, calcul DLC secondaires, 14 allergènes, étiquettes
│       ├── fryers.js              # Contrôle des huiles de friture (seuil 24% TTCP)
│       ├── non-conformities.js    # Registre officiel des anomalies et actions correctives
│       ├── inspection.js          # Espace contrôle DDPP : filtres par dates, export et print A4
│       └── settings.js            # Administration : établissement et configuration équipements
│
├── assets/                        # Ressources statiques
│   ├── icons/                     # Icônes de l'application et favicons PWA
│   └── docs/                      # Fiches réflexes ou guides d'hygiène téléchargeables
│
├── GUIDE_PROJET_PMS.md            # Cahier des charges fonctionnel et réglementaire officiel
└── ARCHITECTURE_TECHNIQUE.md      # Le présent guide d'architecture technique
```

---

## 3. DESCRIPTION DÉTAILLÉE DES COMPOSANTS TECHNIQUES

### 3.1 Point d'Entrée & Structure HTML (`index.html`)
- Déclare les métadonnées pour le viewport tactile (`viewport-fit=cover`) et le thème de couleur du navigateur.
- Lie les feuilles de style de manière ordonnée (variables → mise en page → composants → impression).
- Intègre un conteneur racine `#view-container` dans lequel le contrôleur principal injecte dynamiquement la vue demandée sans rechargement de page.
- Propose une barre de navigation basse ergonomique (optimisée pour les pouces sur mobile et tablettes).

---

### 3.2 Design System Modulaire (`/css`)

1. **`main.css`** :
   - Définit le catalogue de variables CSS : couleurs d'alertes sanitaires (vert conforme, rouge hors-norme, ambre avertissement), espacements standardisés et typographie adaptée aux environnements de travail.
   - Gère le support natif du mode sombre (`prefers-color-scheme: dark`) pour un confort visuel en cuisine sombre.
2. **`layout.css`** :
   - Structure la zone de travail en `display: flex` et `display: grid`.
   - Garantit que la barre de navigation reste accessible en bas de l'écran avec une marge de sécurité (`env(safe-area-inset-bottom)`).
3. **`components.css`** :
   - Fournit les briques graphiques réutilisables : cartes avec bordures contrastées, boutons larges facilement actionnables avec des gants, badges de conformité visuels et barres de progression de routine journalière.
4. **`print.css`** :
   - Isole les règles `@media print`.
   - Masque l'ensemble de l'interface logicielle lors de l'impression.
   - Formate spécifiquement les **étiquettes de traçabilité** au gabarit thermique (largeur standard 62mm) et le **registre de contrôle officiel** sur format de page A4 standard avec bordures de tableau renforcées.

---

### 3.3 Couche de Persistance Hybride (`/js/storage`)

Pour répondre à l'exigence de **confidentialité absolue** et éviter le plafond de 5 Mo du `localStorage`, une stratégie de stockage hybride à double niveau est mise en place :

```
┌────────────────────────────────────────────────────────────────────────┐
│                      NAVIGATEUR LOCAL (CLIENT)                         │
├───────────────────────────────────┬────────────────────────────────────┤
│           LOCALSTORAGE            │             INDEXEDDB              │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Paramètres de l'établissement   │ • Photos des bons de livraison     │
│ • Liste des équipements (frigos)  │ • Photos des étiquettes sanitaires │
│ • Fiches de nettoyage             │ • Clichés des non-conformités      │
│ • Configuration de l'établissement│ • Documents justificatifs          │
│ • Historique des contrôles (JSON) │ • Stockage jusqu'à plusieurs Go    │
└───────────────────────────────────┴────────────────────────────────────┘
```

1. **`local-storage.js`** :
   - Manipule un objet d'état sérialisé en JSON sous la clé unique `pms_app_state_v1`.
   - Intègre un état initial complet avec valeurs par défaut réglementaires dès le premier lancement.
   - Comporte les mécanismes d'exportation (téléchargement d'un fichier `.json` daté) et d'importation (restauration d'urgence).
2. **`indexed-db.js`** :
   - Base de données locale asynchrone dédiée aux médias (`pms_media_vault`).
   - Stocke les images sous forme de données binaires indexées par l'identifiant du contrôle, libérant ainsi le `localStorage` de tout risque de saturation.

---

### 3.4 Les Utilitaires Partagés (`/js/utils`)

- **`dates.js`** :
  - Fournit la date courante en ISO (`AAAA-MM-JJ`) et l'heure (`HH:MM`).
  - Calcule automatiquement les **DLC secondaires** (ex : date du jour + 3 jours pour les préparations froides entamées).
  - Génère des numéros de lot normalisés (`L-AAMMJJ-XXX`).
- **`dom.js`** :
  - Prévient les failles XSS grâce à un utilitaire d'échappement HTML strict (`escapeHTML`).
  - Gère l'affichage non intrusif des messages d'information et d'alerte (`Toast`).
- **`image-compressor.js`** :
  - Intercepte toute prise de photo depuis la caméra de la tablette.
  - Redimensionne dynamiquement l'image à une résolution maximale de 1200px et applique une compression JPEG à 75% via un `HTMLCanvasElement`, réduisant le poids moyen d'une photo de 8 Mo à moins de 300 Ko sans perte de lisibilité sur les étiquettes.

---

### 3.5 Architecture des Modules Métier (`/js/modules`)

Chaque écran de l'application est encapsulé dans son propre module autonome qui respecte un contrat d'interface standardisé :

```javascript
export const MonModule = {
  // 1. Génère la structure HTML du module à partir de l'état actuel
  render(state) {
    return `<section>...</section>`;
  },

  // 2. Attache les écouteurs d'événements et notifie les mises à jour d'état
  bindEvents(container, state, onUpdate) {
    // Événements tactiles, boutons, formulaires
  }
};
```

#### Rôle des différents modules :
1. **`dashboard.js`** : Aiguillage quotidien, statut de l'opérateur en cours, suivi de la complétion journalière des contrôles.
2. **`temperatures.js`** : Suivi des enceintes froides positives, négatives et vitrines chaudes avec déclenchement automatique d'action corrective si la valeur sort des seuils paramétrés.
3. **`hygiene.js`** : Émargement numérique du Plan de Nettoyage et Désinfection (PND) par créneau (Ouverture / Fermeture).
4. **`reception.js`** : Enregistrement des entrées de matières premières avec photo d'étiquette ou BL et validation de la température de livraison.
5. **`production.js`** : Validation des cycles thermiques sensibles : cuisson à cœur ($\ge 63^\circ\text{C}$), refroidissement rapide ($\le 10^\circ\text{C}$ en moins de 2h) et remise en température.
6. **`traceability.js`** : Création d'étiquettes de traçabilité interne pour produits déconditionnés avec sélection tactile des 14 allergènes majeurs.
7. **`fryers.js`** : Suivi de la qualité des bains d'huile de friture (seuil réglementaire de 24% de composés polaires TTCP).
8. **`non-conformities.js`** : Journal centralisé des anomalies et consignation des mesures correctives immédiates.
9. **`inspection.js`** : Espace dédié aux contrôles officiels (DDPP / Alim'confiance) avec filtre de période, affichage du registre complet et bouton d'impression A4.
10. **`settings.js`** : Espace sécurisé par code PIN permettant au responsable d'ajuster l'établissement, les frigos/seuils et les sauvegardes.

---

### 3.6 Contrôleur Principal & Routage (`js/app.js`)

Le fichier `app.js` est le chef d'orchestre de l'application :
1. Il initialise la persistance en lisant le `localStorage`.
2. Il écoute les interactions sur la barre de navigation.
3. Lors d'un changement d'onglet, il invoque la méthode `render()` du module correspondant, injecte le code dans le DOM, puis appelle `bindEvents()`.
4. À chaque modification d'état transmise par un module via le callback `onUpdate`, il persiste automatiquement les modifications dans le `localStorage`.

---

## 4. GUIDE D'ÉVOLUTION POUR LE DÉVELOPPEUR

### Comment ajouter une nouvelle vue ou un nouveau module ?
1. Créer le fichier `js/modules/mon-nouveau-module.js` en respectant le contrat `{ render(state), bindEvents(container, state, onUpdate) }`.
2. L'importer dans `js/app.js` et l'enregistrer dans l'objet `this.modules`.
3. Ajouter un bouton de navigation correspondant avec l'attribut `data-route="mon-nouveau-module"`.
4. Définir si nécessaire les nouveaux paramètres par défaut dans `js/storage/local-storage.js`.

### Comment étendre les fonctionnalités d'impression ?
- Les gabarits d'étiquettes s'enrichissent simplement dans `css/print.css` sous la classe `.print-label`.
- Les rapports officiels d'audit s'enrichissent sous la classe `.print-report`.
