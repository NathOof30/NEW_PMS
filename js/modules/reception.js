/**
 * Module : Réception Marchandises (Traçabilité Amont)
 * Contrôle des températures de livraison, DLC fournisseur et intégrité des emballages.
 */

import { DateUtils } from '../utils/dates.js';
import { DOMUtils } from '../utils/dom.js';
import { ImageCompressor } from '../utils/image-compressor.js';
import { IndexedDBManager } from '../storage/indexed-db.js';

export const ReceptionModule = {
  render(state) {
    const logs = (state.logs || []).filter(log => log.type === 'recv').slice().reverse();

    return `
      <section class="module-reception">
        <header class="module-page-header">
          <div>
            <p class="eyebrow">Traçabilité amont</p>
            <h1>📦 Contrôle à réception</h1>
            <p class="form-label">Vérifiez chaque livraison avant son entrée en stock.</p>
          </div>
        </header>

        <div class="card">
          <div class="card-title">Nouvelle réception</div>

          <div class="form-group">
            <label class="form-label" for="reception-supplier">Fournisseur *</label>
            <input id="reception-supplier" type="text" class="form-input" placeholder="Ex. Transgourmet, Métro, boucher...">
          </div>

          <div class="form-group">
            <label class="form-label" for="reception-product">Produit ou catégorie *</label>
            <input id="reception-product" type="text" class="form-input" placeholder="Ex. Viande bovine, produits laitiers...">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reception-category">Catégorie thermique *</label>
              <select id="reception-category" class="form-select">
                <option value="frais">Froid positif (≤ 4°C)</option>
                <option value="ultra-frais">Ultra-frais (≤ 2°C)</option>
                <option value="surgele">Surgelé (≤ -18°C)</option>
                <option value="chaud">Liaison chaude (≥ 63°C)</option>
                <option value="sec">Épicerie sèche / sans contrôle T°</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="reception-temperature">Température constatée (°C)</label>
              <input id="reception-temperature" type="number" step="0.1" class="form-input" placeholder="Ex. 2.8">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reception-dlc">DLC / DDM fournisseur</label>
            <input id="reception-dlc" type="date" class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label" for="reception-photo">Photo du bon de livraison / étiquette</label>
            <input id="reception-photo" type="file" accept="image/*" class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label" for="reception-action">Action corrective si non conforme</label>
            <textarea id="reception-action" class="form-textarea" placeholder="Ex. Livraison refusée, produits isolés, fournisseur contacté..."></textarea>
          </div>

          <p id="reception-status" class="form-help" aria-live="polite"></p>
          <button class="btn btn-primary" id="btn-save-reception" type="button">Enregistrer la réception</button>
        </div>

        <div class="card">
          <div class="card-title">
            <span>Dernières réceptions</span>
            <span class="badge badge-info">${logs.length}</span>
          </div>
          ${logs.length === 0 ? `
            <div class="empty-state">Aucune réception enregistrée pour le moment.</div>
          ` : `
            <div class="table-responsive">
              <table class="ccp-table">
                <thead><tr><th>Date</th><th>Produit</th><th>Fournisseur</th><th>Température</th><th>Statut</th></tr></thead>
                <tbody>
                  ${logs.slice(0, 10).map(log => `
                    <tr>
                      <td>${DOMUtils.escapeHTML(log.date)} ${DOMUtils.escapeHTML(log.time || '')}</td>
                      <td>${DOMUtils.escapeHTML(log.product)}</td>
                      <td>${DOMUtils.escapeHTML(log.supplier)}</td>
                      <td>${log.value == null ? '—' : `${DOMUtils.escapeHTML(log.value)}°C`}</td>
                      <td><span class="badge ${log.ok ? 'badge-success' : 'badge-danger'}">${log.ok ? '✓ Conforme' : '⚠️ Non conforme'}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </section>
    `;
  },

  bindEvents(container, state, onUpdate) {
    const categoryRules = {
      frais: { min: -Infinity, max: 4 },
      'ultra-frais': { min: -Infinity, max: 2 },
      surgele: { min: -Infinity, max: -18 },
      chaud: { min: 63, max: Infinity },
      sec: null
    };
    const status = container.querySelector('#reception-status');
    const category = container.querySelector('#reception-category');
    const temperature = container.querySelector('#reception-temperature');
    const updateStatus = () => {
      const rule = categoryRules[category.value];
      const value = Number.parseFloat(temperature.value);
      if (!rule || Number.isNaN(value)) {
        status.textContent = rule ? 'Température facultative pour cette réception.' : '';
        status.className = 'form-help';
        return;
      }
      const ok = value >= rule.min && value <= rule.max;
      status.textContent = ok ? '✓ Température dans la plage attendue.' : '⚠️ Température hors seuil : une action corrective sera obligatoire.';
      status.className = ok ? 'form-help status-success' : 'form-help status-warning';
    };
    category?.addEventListener('change', updateStatus);
    temperature?.addEventListener('input', updateStatus);

    container.querySelector('#btn-save-reception')?.addEventListener('click', async () => {
      const supplier = container.querySelector('#reception-supplier')?.value.trim();
      const product = container.querySelector('#reception-product')?.value.trim();
      const categoryValue = category?.value;
      const valueText = temperature?.value.trim();
      const value = valueText ? Number.parseFloat(valueText) : null;
      const action = container.querySelector('#reception-action')?.value.trim();
      const photo = container.querySelector('#reception-photo')?.files?.[0];
      const rule = categoryRules[categoryValue];

      if (!supplier || !product) {
        DOMUtils.showToast('⚠️ Fournisseur et produit sont obligatoires.');
        return;
      }
      if (valueText && Number.isNaN(value)) {
        DOMUtils.showToast('⚠️ La température saisie est invalide.');
        return;
      }
      const ok = !rule || value === null || (value >= rule.min && value <= rule.max);
      if (!ok && !action) {
        DOMUtils.showToast('⚠️ Ajoutez une action corrective pour cette température.');
        return;
      }

      const logId = `reception-${Date.now()}`;
      state.logs.push({
        id: logId,
        type: 'recv',
        supplier,
        product,
        category: categoryValue,
        value,
        dlc: container.querySelector('#reception-dlc')?.value || '',
        correctiveAction: action,
        ok,
        date: DateUtils.getTodayISO(),
        time: DateUtils.getNowTime(),
        user: state.activeUser || 'Yannick',
        photoId: photo ? logId : null
      });

      try {
        if (photo) {
          const compressed = await ImageCompressor.compress(photo);
          await IndexedDBManager.savePhoto(logId, compressed);
        }
        onUpdate();
        DOMUtils.showToast(ok ? '✅ Réception enregistrée.' : '⚠️ Réception enregistrée avec action corrective.');
        this.reRender(container, state, onUpdate);
      } catch (error) {
        state.logs.pop();
        console.error('Erreur archivage réception :', error);
        DOMUtils.showToast('❌ Réception non enregistrée : impossible d’archiver la photo.');
      }
    });
  },

  reRender(container, state, onUpdate) {
    container.innerHTML = this.render(state);
    this.bindEvents(container, state, onUpdate);
  }
};
