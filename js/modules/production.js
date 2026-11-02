/**
 * Module : Production & Cuisson / Refroidissement Rapide (Pilier 2)
 * Intégré harmonieusement au contrôleur HACCP
 */

import { TemperaturesModule } from './temperatures.js';

export const ProductionModule = {
  render(state) {
    TemperaturesModule.activeSubTab = 'cooling';
    return TemperaturesModule.render(state);
  },

  bindEvents(container, state, onUpdate) {
    TemperaturesModule.bindEvents(container, state, onUpdate);
  }
};
