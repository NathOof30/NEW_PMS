/**
 * Module : Traçabilité Interne & Étiquetage (DLC Secondaire)
 * Génération de numéros de lots, sélection des 14 allergènes et impression d'étiquettes.
 */

import { ALLERGENS } from '../config.js';
import { DateUtils } from '../utils/dates.js';
import { DOMUtils } from '../utils/dom.js';

export const TraceabilityModule = {
  render(state) {
    const labels = (state.logs || []).filter(log => log.type === 'lot').slice().reverse();

    return `
      <section class="module-traceability">
        <header class="module-page-header">
          <div>
            <p class="eyebrow">Traçabilité interne</p>
            <h1>🏷️ Lots et étiquetage</h1>
            <p class="form-label">Créez une étiquette pour chaque préparation ou produit déconditionné.</p>
          </div>
        </header>

        <div class="card">
          <div class="card-title">Créer une étiquette</div>

          <div class="form-group">
            <label class="form-label" for="trace-product">Dénomination du produit *</label>
            <input id="trace-product" type="text" class="form-input" placeholder="Ex. Sauce tomate maison, rôti tranché...">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="trace-days">Durée de conservation (jours) *</label>
              <input id="trace-days" type="number" min="0" max="365" value="3" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label" for="trace-made-at">Date de fabrication</label>
              <input id="trace-made-at" type="date" value="${DateUtils.getTodayISO()}" class="form-input">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Allergènes majeurs présents</label>
            <div class="allergen-grid">
              ${ALLERGENS.map(al => `
                <label class="check-option">
                  <input type="checkbox" value="${DOMUtils.escapeHTML(al)}"> <span>${DOMUtils.escapeHTML(al)}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <p id="trace-status" class="form-help" aria-live="polite"></p>
          <button class="btn btn-primary" id="btn-generate-label" type="button">Générer l’étiquette</button>
        </div>

        <div class="card print-label" id="trace-label-preview" hidden>
          <p class="eyebrow">Étiquette PMS</p>
          <strong id="label-product"></strong><br>
          <small>Fabriqué le : <span id="label-made-at"></span></small><br>
          <strong>À consommer avant le : <span id="label-dlc"></span></strong><br>
          <small>Lot : <span id="label-lot"></span></small><br>
          <small>Allergènes : <span id="label-allergens"></span></small>
          <div class="label-preview-actions no-print">
            <button class="btn btn-primary btn-sm" id="btn-print-label" type="button">🖨️ Imprimer l’étiquette</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <span>Étiquettes récentes</span>
            <span class="badge badge-info">${labels.length}</span>
          </div>
          ${labels.length === 0 ? '<div class="empty-state">Aucune étiquette créée pour le moment.</div>' : `
            <div class="label-history-actions no-print">
              <button class="btn btn-secondary" id="btn-print-all-labels" type="button">🖨️ Imprimer toutes les étiquettes</button>
            </div>
            <div class="table-responsive">
              <table class="ccp-table">
                <thead><tr><th>Date</th><th>Produit</th><th>Lot</th><th>DLC</th><th>Action</th></tr></thead>
                <tbody>${labels.slice(0, 10).map(label => `
                  <tr>
                    <td>${DOMUtils.escapeHTML(label.date)}</td>
                    <td>${DOMUtils.escapeHTML(label.product)}</td>
                    <td>${DOMUtils.escapeHTML(label.lot)}</td>
                    <td>${DOMUtils.escapeHTML(label.dlc)}</td>
                    <td><button class="btn btn-secondary btn-sm btn-reprint-label" data-label-id="${DOMUtils.escapeHTML(label.id)}" type="button">🖨️ Réimprimer</button></td>
                  </tr>
                `).join('')}</tbody>
              </table>
            </div>
          `}
        </div>
      </section>
    `;
  },

  bindEvents(container, state, onUpdate) {
    container.querySelector('#btn-generate-label')?.addEventListener('click', () => {
      const product = container.querySelector('#trace-product')?.value.trim();
      const days = Number.parseInt(container.querySelector('#trace-days')?.value, 10);
      const madeAt = container.querySelector('#trace-made-at')?.value || DateUtils.getTodayISO();
      const allergens = [...container.querySelectorAll('.allergen-grid input:checked')].map(input => input.value);
      const status = container.querySelector('#trace-status');

      if (!product || Number.isNaN(days) || days < 0 || days > 365) {
        status.textContent = '⚠️ Indiquez un produit et une durée comprise entre 0 et 365 jours.';
        status.className = 'form-help status-warning';
        return;
      }

      const dlcDate = new Date(`${madeAt}T00:00:00`);
      dlcDate.setDate(dlcDate.getDate() + days);
      const dlc = dlcDate.toISOString().split('T')[0];
      const lot = DateUtils.generateLotNumber();
      const log = {
        id: `lot-${Date.now()}`,
        type: 'lot',
        product,
        lot,
        dlc,
        madeAt,
        daysToKeep: days,
        allergens,
        ok: true,
        date: DateUtils.getTodayISO(),
        time: DateUtils.getNowTime(),
        user: state.activeUser || 'Yannick'
      };

      state.logs.push(log);
      onUpdate();
      container.querySelector('#label-product').textContent = product;
      container.querySelector('#label-made-at').textContent = madeAt;
      container.querySelector('#label-dlc').textContent = dlc;
      container.querySelector('#label-lot').textContent = lot;
      container.querySelector('#label-allergens').textContent = allergens.length ? allergens.join(', ') : 'Aucun';
      container.querySelector('#trace-label-preview').hidden = false;
      status.textContent = '✓ Étiquette générée et registre mis à jour.';
      status.className = 'form-help status-success';
      DOMUtils.showToast('✅ Étiquette générée.');
      this.bindPrintButton(container, state, onUpdate);
    });

    container.querySelectorAll('.btn-reprint-label').forEach(button => {
      button.addEventListener('click', () => {
        const label = (state.logs || []).find(log => log.id === button.dataset.labelId);
        if (label) {
          this.printLabel(container, label, state, onUpdate);
        } else {
          DOMUtils.showToast('❌ Étiquette introuvable dans les données locales.');
        }
      });
    });

    container.querySelector('#btn-print-all-labels')?.addEventListener('click', () => {
      const labels = (state.logs || []).filter(log => log.type === 'lot');
      if (labels.length) {
        this.printAllLabels(labels);
      }
    });
  },

  bindPrintButton(container, state, onUpdate) {
    container.querySelector('#btn-print-label')?.addEventListener('click', () => {
      const label = {
        product: container.querySelector('#label-product')?.textContent,
        madeAt: container.querySelector('#label-made-at')?.textContent,
        dlc: container.querySelector('#label-dlc')?.textContent,
        lot: container.querySelector('#label-lot')?.textContent,
        allergens: (container.querySelector('#label-allergens')?.textContent || '') === 'Aucun'
          ? []
          : (container.querySelector('#label-allergens')?.textContent || '').split(', ')
      };
      this.printLabel(container, label, state, onUpdate);
    });
  },

  printLabel(container, label, state, onUpdate) {
    const preview = container.querySelector('#trace-label-preview');
    if (!preview) {
      DOMUtils.showToast('❌ Aperçu d’étiquette indisponible.');
      return;
    }

    container.querySelector('#label-product').textContent = label.product || '';
    container.querySelector('#label-made-at').textContent = label.madeAt || label.date || '';
    container.querySelector('#label-dlc').textContent = label.dlc || '';
    container.querySelector('#label-lot').textContent = label.lot || '';
    container.querySelector('#label-allergens').textContent = label.allergens?.length
      ? label.allergens.join(', ')
      : 'Aucun';
    preview.hidden = false;

    document.body.classList.add('print-label-only');
    window.setTimeout(() => {
      window.print();
      document.body.classList.remove('print-label-only');
      this.reRender(container, state, onUpdate);
    }, 50);
  },

  printAllLabels(labels) {
    const printSheet = document.createElement('div');
    printSheet.id = 'print-label-batch';
    printSheet.className = 'print-label-batch';

    labels.forEach(label => {
      const labelElement = document.createElement('article');
      labelElement.className = 'print-label print-label-batch-item';
      labelElement.innerHTML = `
        <p class="print-label-heading">Étiquette PMS</p>
        <strong class="print-label-product"></strong><br>
        <small>Fabriqué le : <span class="print-label-made-at"></span></small><br>
        <strong>À consommer avant le : <span class="print-label-dlc"></span></strong><br>
        <small>Lot : <span class="print-label-lot"></span></small><br>
        <small>Allergènes : <span class="print-label-allergens"></span></small>
      `;
      labelElement.querySelector('.print-label-product').textContent = label.product || '';
      labelElement.querySelector('.print-label-made-at').textContent = label.madeAt || label.date || '';
      labelElement.querySelector('.print-label-dlc').textContent = label.dlc || '';
      labelElement.querySelector('.print-label-lot').textContent = label.lot || '';
      labelElement.querySelector('.print-label-allergens').textContent = label.allergens?.length
        ? label.allergens.join(', ')
        : 'Aucun';
      printSheet.appendChild(labelElement);
    });

    document.body.appendChild(printSheet);
    document.body.classList.add('print-label-batch');

    const cleanup = () => {
      document.body.classList.remove('print-label-batch');
      printSheet.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => {
      window.print();
      window.setTimeout(cleanup, 1000);
    }, 50);
  }
};
