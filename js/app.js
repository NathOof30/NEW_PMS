/**
 * Point d'entrée applicatif (SPA Modulaire)
 * Initialise le cycle de vie, charge l'état local et gère le routage entre modules.
 */

import { LocalStorageManager } from './storage/local-storage.js';

// Import des modules
import { DashboardModule } from './modules/dashboard.js';
import { TemperaturesModule } from './modules/temperatures.js';
import { HygieneModule } from './modules/hygiene.js';
import { ReceptionModule } from './modules/reception.js';
import { ProductionModule } from './modules/production.js';
import { TraceabilityModule } from './modules/traceability.js';
import { FryersModule } from './modules/fryers.js';
import { NonConformitiesModule } from './modules/non-conformities.js';
import { InspectionModule } from './modules/inspection.js';
import { SettingsModule } from './modules/settings.js';

export class App {
  constructor() {
    this.state = LocalStorageManager.load();
    this.currentRoute = 'home';
    this.modules = {
      home: DashboardModule,
      temp: TemperaturesModule,
      hygiene: HygieneModule,
      reception: ReceptionModule,
      production: ProductionModule,
      traceability: TraceabilityModule,
      fryers: FryersModule,
      anomalies: NonConformitiesModule,
      inspection: InspectionModule,
      settings: SettingsModule
    };

    this.container = document.getElementById('view-container');
    this.navButtons = document.querySelectorAll('.nav-item');
    this.headerUserName = document.getElementById('header-user-name');
  }

  init() {
    this.initHeaderUser();
    this.bindNavigation();
    this.bindGlobalEvents();
    this.navigateTo(this.currentRoute);
    window.pmsApp = this;
  }

  initHeaderUser() {
    if (!this.headerUserName) return;
    this.headerUserName.textContent = this.state.activeUser || 'Yannick';
  }

  bindNavigation() {
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        if (route) {
          this.navigateTo(route);
        }
      });
    });

    document.getElementById('header-settings-button')?.addEventListener('click', () => {
      this.navigateTo('settings');
    });
  }

  bindGlobalEvents() {
    // Écoute des événements de navigation déclenchés depuis l'intérieur des modules
    document.addEventListener('pms:navigate', (e) => {
      const { route, subTab } = e.detail || {};
      if (route) {
        if (route === 'hygiene' && subTab) {
          HygieneModule.activeSubTab = subTab;
        } else if ((route === 'temp' || route === 'temperatures') && subTab) {
          TemperaturesModule.activeSubTab = subTab;
        }
        this.navigateTo(route);
      }
    });
  }

  navigateTo(route) {
    if (!this.modules[route]) return;
    this.currentRoute = route;

    // Mise à jour visuelle des boutons de la barre basse
    this.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === route);
    });

    // Rendu du module sélectionné
    const activeModule = this.modules[route];
    this.container.innerHTML = activeModule.render(this.state);
    activeModule.bindEvents(this.container, this.state, () => {
      LocalStorageManager.save(this.state);
    });

    window.scrollTo(0, 0);
  }
}

// Démarrage dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
