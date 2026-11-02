/**
 * Module : Réglages de l'établissement.
 * Configuration de Yannick, sauvegardes locales et préférences opérationnelles.
 */

import { APP_CONFIG } from '../config.js';
import { DOMUtils } from '../utils/dom.js';
import { LocalStorageManager } from '../storage/local-storage.js';

export const SettingsModule = {
  render(state) {
    const establishment = state.establishment || {};
    const equipments = state.equipments || [];

    return `
      <section class="module-settings">
        <header class="module-page-header">
          <p class="eyebrow">Configuration</p>
          <h1>⚙️ Réglages</h1>
          <p class="form-label">Gérez l’identité de l’établissement et vos sauvegardes locales.</p>
        </header>

        <div class="card">
          <div class="card-title">Identité de l’établissement</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="settings-name">Nom de l’établissement</label>
              <input id="settings-name" type="text" class="form-input" value="${DOMUtils.escapeHTML(establishment.name || '')}">
            </div>
            <div class="form-group">
              <label class="form-label" for="settings-siret">SIRET</label>
              <input id="settings-siret" type="text" class="form-input" value="${DOMUtils.escapeHTML(establishment.siret || '')}" inputmode="numeric">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-referent">Référent hygiène</label>
            <input id="settings-referent" type="text" class="form-input" value="Yannick" readonly>
          </div>
          <button class="btn btn-primary" id="btn-save-establishment" type="button">Enregistrer l’établissement</button>
          <p id="settings-status" class="form-help" aria-live="polite"></p>
        </div>

        <div class="card">
          <div class="card-title">Utilisateur actif</div>
          <p class="form-label">Tous les contrôles sont attribués à l’utilisateur unique de l’établissement.</p>
          <div class="settings-user-card"><span class="status-icon" aria-hidden="true">👤</span><strong>Yannick</strong><span class="badge badge-success">Actif</span></div>
        </div>

        <div class="card">
          <div class="card-title">Équipements configurés</div>
          <p class="form-label">${equipments.length} équipement(s) suivi(s) dans les relevés de température.</p>
          <div class="settings-list">
            ${equipments.map(equipment => `
              <div class="settings-list-item">
                <span>${DOMUtils.escapeHTML(equipment.icon || '🌡️')} ${DOMUtils.escapeHTML(equipment.name)}</span>
                <small>${DOMUtils.escapeHTML(String(equipment.min))}°C à ${DOMUtils.escapeHTML(String(equipment.max))}°C</small>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-open-temperatures" type="button">Gérer les équipements</button>
        </div>

        <div class="card">
          <div class="card-title">Sauvegarde locale</div>
          <p class="form-label">Exportez régulièrement vos registres. Les données restent sur cet appareil.</p>
          <div class="settings-actions">
            <button class="btn btn-secondary" id="btn-export-settings" type="button">💾 Exporter les données</button>
            <button class="btn btn-secondary" id="btn-import-settings" type="button">📥 Importer une sauvegarde</button>
            <input id="settings-import-file" type="file" accept="application/json,.json" hidden>
          </div>
          <p class="form-help">Version des données : ${DOMUtils.escapeHTML(APP_CONFIG.VERSION)}</p>
        </div>
      </section>
    `;
  },

  bindEvents(container, state, onUpdate) {
    const status = container.querySelector('#settings-status');

    container.querySelector('#btn-save-establishment')?.addEventListener('click', () => {
      const name = container.querySelector('#settings-name')?.value.trim();
      const siret = container.querySelector('#settings-siret')?.value.trim();
      if (!name) {
        status.textContent = '⚠️ Le nom de l’établissement est obligatoire.';
        status.className = 'form-help status-warning';
        return;
      }

      state.establishment = {
        ...state.establishment,
        name,
        siret,
        hygieneReferent: 'Yannick'
      };
      onUpdate();
      status.textContent = '✓ Identité de l’établissement enregistrée.';
      status.className = 'form-help status-success';
      DOMUtils.showToast('✅ Réglages enregistrés.');
    });

    container.querySelector('#btn-open-temperatures')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('pms:navigate', {
        detail: { route: 'temp', subTab: 'temperatures' }
      }));
    });

    container.querySelector('#btn-export-settings')?.addEventListener('click', () => {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `sauvegarde-pms-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      DOMUtils.showToast('💾 Sauvegarde téléchargée.');
    });

    const importInput = container.querySelector('#settings-import-file');
    container.querySelector('#btn-import-settings')?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;

      try {
        const imported = JSON.parse(await file.text());
        if (!imported || typeof imported !== 'object' || !Array.isArray(imported.logs)) {
          throw new Error('Format de sauvegarde invalide');
        }
        const confirmed = window.confirm('Importer cette sauvegarde et remplacer les données locales actuelles ?');
        if (!confirmed) return;
        const merged = {
          ...LocalStorageManager.getDefaultState(),
          ...imported,
          team: ['Yannick'],
          activeUser: 'Yannick',
          establishment: {
            ...LocalStorageManager.getDefaultState().establishment,
            ...(imported.establishment || {}),
            hygieneReferent: 'Yannick'
          }
        };
        Object.keys(state).forEach(key => delete state[key]);
        Object.assign(state, merged);
        onUpdate();
        DOMUtils.showToast('✅ Sauvegarde importée.');
        this.reRender(container, state, onUpdate);
      } catch (error) {
        console.error('Erreur import sauvegarde :', error);
        DOMUtils.showToast('❌ Sauvegarde invalide ou impossible à importer.');
      } finally {
        importInput.value = '';
      }
    });
  },

  reRender(container, state, onUpdate) {
    container.innerHTML = this.render(state);
    this.bindEvents(container, state, onUpdate);
  }
};
