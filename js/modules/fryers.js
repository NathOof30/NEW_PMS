/**
 * Module : Huiles de Friture (Pilier 2)
 * Intégré harmonieusement au contrôleur HACCP
 */

import { TemperaturesModule } from './temperatures.js';

export const FryersModule = {
  render(state) {
    TemperaturesModule.activeSubTab = 'fryers';
    return TemperaturesModule.render(state);
  },

  bindEvents(container, state, onUpdate) {
    TemperaturesModule.bindEvents(container, state, onUpdate);
  }
};
