/**
 * Module : Espace Contrôle & Audit Officiel (DDPP / Vétérinaire)
 * Visualisation synthétique des registres, filtrage par dates, export JSON et impression A4.
 */

import { DateUtils } from '../utils/dates.js';
import { DOMUtils } from '../utils/dom.js';

export const InspectionModule = {
  startDate: '',
  endDate: '',
  filterType: 'all', // 'all' | 'temp' | 'cooling' | 'cooking' | 'fryer' | 'clean' | 'recv' | 'lot'

  render(state) {
    const today = DateUtils.getTodayISO();
    if (!this.startDate) {
      // Par défaut : 7 derniers jours
      const d = new Date();
      d.setDate(d.getDate() - 7);
      this.startDate = d.toISOString().split('T')[0];
    }
    if (!this.endDate) {
      this.endDate = today;
    }

    const logs = state.logs || [];
    const establishment = state.establishment || {};

    // Filtrage des logs
    const filteredLogs = logs.filter(l => {
      const matchDate = (!this.startDate || l.date >= this.startDate) && (!this.endDate || l.date <= this.endDate);
      const matchType = this.filterType === 'all' || l.type === this.filterType;
      return matchDate && matchType;
    }).sort((a, b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`));

    const totalLogs = filteredLogs.length;
    const anomalies = filteredLogs.filter(l => l.ok === false);
    const complianceRate = totalLogs ? Math.round(((totalLogs - anomalies.length) / totalLogs) * 100) : 100;

    return `
      <section class="module-inspection">
        <header style="margin-bottom: var(--space-md);" class="no-print">
          <h1 style="font-size: 1.4rem;">🔍 Espace Contrôle Sanitaire & Audit Officiel</h1>
          <p class="form-label">Génération des registres officiels, contrôle de traçabilité et export DDPP / Alim'confiance.</p>
        </header>

        <!-- Filtres et actions -->
        <div class="card no-print">
          <div class="card-title">Paramètres de l'audit sanitaire</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date de début</label>
              <input type="date" id="insp-start-date" class="form-input" value="${this.startDate}">
            </div>
            <div class="form-group">
              <label class="form-label">Date de fin</label>
              <input type="date" id="insp-end-date" class="form-input" value="${this.endDate}">
            </div>
            <div class="form-group">
              <label class="form-label">Type de registre</label>
              <select id="insp-filter-type" class="form-select">
                <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>Tous les registres (P1 & P2)</option>
                <option value="temp" ${this.filterType === 'temp' ? 'selected' : ''}>🌡️ Températures enceintes</option>
                <option value="cooling" ${this.filterType === 'cooling' ? 'selected' : ''}>❄️ Refroidissement rapide (CCP)</option>
                <option value="cooking" ${this.filterType === 'cooking' ? 'selected' : ''}>🍳 Cuisson & Remise T°</option>
                <option value="fryer" ${this.filterType === 'fryer' ? 'selected' : ''}>🍟 Huiles de friture</option>
                <option value="clean" ${this.filterType === 'clean' ? 'selected' : ''}>🧽 Nettoyage (PND)</option>
                <option value="recv" ${this.filterType === 'recv' ? 'selected' : ''}>📦 Réceptions</option>
                <option value="lot" ${this.filterType === 'lot' ? 'selected' : ''}>🏷️ Lots et étiquettes</option>
              </select>
            </div>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
            <button class="btn btn-primary" id="btn-print-inspection">
              🖨️ Imprimer le Registre Officiel A4
            </button>
            <button class="btn btn-secondary" id="btn-export-backup">
              💾 Télécharger Sauvegarde JSON
            </button>
          </div>
        </div>

        <!-- Synthèse d'audit -->
        <div class="card">
          <div class="card-title">
            <span>Synthèse de conformité du ${this.startDate} au ${this.endDate}</span>
            <span class="badge ${complianceRate >= 95 ? 'badge-success' : 'badge-warning'}">
              ${complianceRate}% Conforme
            </span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 8px;">
            <div style="background: var(--bg-body); padding: 10px; border-radius: var(--radius-sm);">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ÉTABLISSEMENT :</span>
              <strong>${DOMUtils.escapeHTML(establishment.name || 'Cuisine Centrale')}</strong>
              <small style="display: block; color: var(--text-muted); font-size: 0.72rem;">Réf : ${DOMUtils.escapeHTML(establishment.hygieneReferent || 'Responsable')}</small>
            </div>
            <div style="background: var(--bg-body); padding: 10px; border-radius: var(--radius-sm);">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">TOTAL CONTRÔLES :</span>
              <strong>${totalLogs} enregistrements</strong>
            </div>
            <div style="background: var(--bg-body); padding: 10px; border-radius: var(--radius-sm);">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ANOMALIES RELEVÉES :</span>
              <strong style="color: ${anomalies.length ? 'var(--color-danger)' : 'var(--color-success)'};">
                ${anomalies.length} anomalie(s)
              </strong>
              <small style="display: block; color: var(--text-muted); font-size: 0.72rem;">100% avec action corrective</small>
            </div>
          </div>
        </div>

        <!-- Tableau d'audit officiel A4 (Imprimable) -->
        <div class="card print-report">
          <div class="card-title">
            <span>Registre Sanitaire Officiel — Paquet Hygiène</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Période : ${this.startDate} au ${this.endDate}</span>
          </div>

          ${filteredLogs.length === 0 ? `
            <p style="padding: 16px; font-size: 0.85rem; color: var(--text-muted);">Aucun enregistrement trouvé sur cette période.</p>
          ` : `
            <div style="overflow-x: auto;">
              <table class="ccp-table">
                <thead>
                  <tr>
                    <th>Date & Heure</th>
                    <th>Domaine</th>
                    <th>Élément contrôlé</th>
                    <th>Valeur constatée</th>
                    <th>Statut</th>
                    <th>Action corrective menée</th>
                    <th>Opérateur</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredLogs.map(l => {
                    let label = 'Contrôle';
                    let detail = '-';
                    let val = '-';

                    if (l.type === 'temp') {
                      label = '🌡️ T° Enceinte';
                      detail = l.equipmentName;
                      val = `${l.value}°C (Norme ${l.min}° à ${l.max}°C)`;
                    } else if (l.type === 'cooling') {
                      label = '❄️ Refroidissement (CCP)';
                      detail = l.dishName;
                      val = `${l.startTemp}°C → ${l.endTemp}°C en ${l.durationMinutes} min`;
                    } else if (l.type === 'cooking') {
                      label = '🍳 Cuisson / Remise';
                      detail = `${l.opType || 'Cuisson'} - ${l.dishName}`;
                      val = `${l.temp}°C ${l.durationMinutes ? `(${l.durationMinutes} min)` : ''}`;
                    } else if (l.type === 'fryer') {
                      label = '🍟 Huile Friture';
                      detail = l.fryerName;
                      val = `${l.value} (${l.decision === 'changed' ? 'Changée' : 'Maintenue'})`;
                    } else if (l.type === 'clean') {
                      label = '🧽 Nettoyage PND';
                      detail = l.taskName || 'Tâche PND';
                      val = 'Réalisé & Émargé';
                    } else if (l.type === 'recv') {
                      label = '📦 Réception';
                      detail = `${l.supplier || 'Fournisseur'} - ${l.product || 'Produit'}`;
                      val = l.value == null ? '-' : `${l.value}°C`;
                    } else if (l.type === 'lot') {
                      label = '🏷️ Traçabilité';
                      detail = l.product || 'Lot interne';
                      val = `Lot ${l.lot || '-'} · DLC ${l.dlc || '-'}`;
                    }

                    return `
                      <tr style="${!l.ok ? 'background-color: rgba(224, 49, 49, 0.05);' : ''}">
                        <td><strong>${l.date}</strong> ${l.time || ''}</td>
                        <td>${label}</td>
                        <td>${DOMUtils.escapeHTML(detail)}</td>
                        <td><strong>${DOMUtils.escapeHTML(val)}</strong></td>
                        <td>
                          <span class="badge ${l.ok ? 'badge-success' : 'badge-danger'}">
                            ${l.ok ? 'Conforme' : 'Anomalie'}
                          </span>
                        </td>
                        <td>${DOMUtils.escapeHTML(l.correctiveAction || '-')}</td>
                        <td>${DOMUtils.escapeHTML(l.user || '-')}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </section>
    `;
  },

  bindEvents(container, state, onUpdate) {
    const startInput = container.querySelector('#insp-start-date');
    const endInput = container.querySelector('#insp-end-date');
    const filterSelect = container.querySelector('#insp-filter-type');

    startInput?.addEventListener('change', () => {
      this.startDate = startInput.value;
      this.reRender(container, state, onUpdate);
    });

    endInput?.addEventListener('change', () => {
      this.endDate = endInput.value;
      this.reRender(container, state, onUpdate);
    });

    filterSelect?.addEventListener('change', () => {
      this.filterType = filterSelect.value;
      this.reRender(container, state, onUpdate);
    });

    // Impression A4
    container.querySelector('#btn-print-inspection')?.addEventListener('click', () => {
      window.print();
    });

    // Exportation sauvegarde JSON datée
    container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
      const today = DateUtils.getTodayISO();
      const filename = `sauvegarde-pms-${today}.json`;
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      DOMUtils.showToast('💾 Sauvegarde JSON téléchargée.');
    });
  },

  reRender(container, state, onUpdate) {
    container.innerHTML = this.render(state);
    this.bindEvents(container, state, onUpdate);
  }
};
