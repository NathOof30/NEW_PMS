/**
 * Module : Registre des Non-Conformités & Actions Correctives
 * Centralise tous les écarts constatés, actions menées et validations responsables.
 */

import { DateUtils } from '../utils/dates.js';
import { DOMUtils } from '../utils/dom.js';

export const NonConformitiesModule = {
  render(state) {
    const logs = state.logs || [];
    const anomalies = logs.filter(l => l.ok === false).reverse();
    const activeUser = state.activeUser || (state.team && state.team[0]) || 'Opérateur';

    return `
      <section class="module-non-conformities">
        <header style="margin-bottom: var(--space-md);">
          <h1 style="font-size: 1.4rem;">⚠️ Registre des Non-Conformités & Actions Correctives</h1>
          <p class="form-label">Toute anomalie sanitaire (T° hors seuil, déviation CCP, incident) est centralisée ici avec sa preuve de correction.</p>
        </header>

        <!-- Synthèse -->
        <div class="card" style="border-left: 4px solid var(--color-danger);">
          <div class="card-title">
            <span>État des anomalies recensées</span>
            <span class="badge ${anomalies.length > 0 ? 'badge-danger' : 'badge-success'}">
              ${anomalies.length} anomalie(s) tracée(s)
            </span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
            Pour un inspecteur officiel, un registre qui trace les anomalies et prouve l'application immédiate d'actions correctives démontre la réalité et l'efficacité de votre démarche HACCP.
          </p>
        </div>

        <!-- Formulaire de déclaration d'une anomalie ponctuelle -->
        <div class="card">
          <div class="card-title">🚨 Déclarer un incident ou une non-conformité terrain</div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type d'incident / Poste *</label>
              <select id="nc-type" class="form-select">
                <option value="temp">🌡️ Température / Rupture chaîne du froid</option>
                <option value="cooling">❄️ Refroidissement rapide dépassé</option>
                <option value="cooking">🍳 Cuisson / Remise en température insuffisante</option>
                <option value="recv">📦 Réception marchandises détériorées</option>
                <option value="hygiene">🧽 Hygiène / Équipement défectueux</option>
                <option value="other">Autre incident sanitaire</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Intitulé / Denrée concernée *</label>
              <input type="text" id="nc-title" class="form-input" placeholder="Ex: Chambre froide positive 8°C au matin (10 kg viande)">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Action corrective immédiate appliquée *</label>
            <textarea id="nc-action" class="form-textarea" placeholder="Ex: Produits immédiatement isolés et détruits, appel frigoriste d'urgence..."></textarea>
          </div>

          <button class="btn btn-danger" id="btn-save-nc" style="width: 100%; padding: 12px;">
            Consigner la non-conformité dans le registre
          </button>
        </div>

        <!-- Journal consolidé des non-conformités -->
        <div class="card">
          <div class="card-title">
            <span>Historique inaltérable des non-conformités</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${anomalies.length} incident(s)</span>
          </div>

          ${anomalies.length === 0 ? `
            <p style="font-size: 0.85rem; color: var(--text-muted); padding: 12px 0;">
              ✓ Aucune anomalie ni dépassement critique enregistré. L'ensemble des contrôles est conforme.
            </p>
          ` : `
            <div style="overflow-x: auto;">
              <table class="ccp-table">
                <thead>
                  <tr>
                    <th>Date & Heure</th>
                    <th>Source / Domaine</th>
                    <th>Description de l'anomalie</th>
                    <th>Mesure corrective appliquée</th>
                    <th>Opérateur</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${anomalies.map(a => {
                    let domain = 'Incident';
                    let desc = a.equipmentName || a.dishName || a.taskName || a.title || 'Anomalie';
                    if (a.type === 'temp') domain = '🌡️ Température';
                    else if (a.type === 'cooling') domain = '❄️ Refroidissement';
                    else if (a.type === 'cooking') domain = '🍳 Cuisson';
                    else if (a.type === 'fryer') domain = '🍟 Huile Friture';
                    else if (a.type === 'pest') domain = '🐀 Nuisibles';

                    return `
                      <tr style="background-color: rgba(224, 49, 49, 0.04);">
                        <td><strong>${a.date}</strong> ${a.time || ''}</td>
                        <td>${domain}</td>
                        <td><strong>${DOMUtils.escapeHTML(desc)}</strong> ${a.value ? `(${a.value})` : ''}</td>
                        <td>${DOMUtils.escapeHTML(a.correctiveAction || a.action || 'Mesure conservatoire')}</td>
                        <td>${DOMUtils.escapeHTML(a.user || activeUser)}</td>
                        <td><span class="badge badge-success">✓ Corrigé</span></td>
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
    const activeUser = state.activeUser || (state.team && state.team[0]) || 'Opérateur';
    const today = DateUtils.getTodayISO();

    container.querySelector('#btn-save-nc')?.addEventListener('click', () => {
      const type = container.querySelector('#nc-type')?.value;
      const title = container.querySelector('#nc-title')?.value.trim();
      const action = container.querySelector('#nc-action')?.value.trim();

      if (!title || !action) {
        DOMUtils.showToast('⚠️ Veuillez renseigner l\'intitulé et l\'action corrective.');
        return;
      }

      state.logs.push({
        id: Date.now(),
        type,
        title,
        correctiveAction: action,
        ok: false,
        date: today,
        time: DateUtils.getNowTime(),
        user: activeUser
      });

      onUpdate();
      DOMUtils.showToast('⚠️ Non-conformité et action corrective enregistrées.');
      this.reRender(container, state, onUpdate);
    });
  },

  reRender(container, state, onUpdate) {
    container.innerHTML = this.render(state);
    this.bindEvents(container, state, onUpdate);
  }
};
