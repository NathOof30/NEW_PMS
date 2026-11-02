/**
 * Module : Pilier 2 — Démarche HACCP & Surveillance des CCP
 * 100% Fonctionnel, autonome et conforme à la réglementation européenne et française
 */

import { DateUtils } from '../utils/dates.js';
import { DOMUtils } from '../utils/dom.js';
import { REGULATORY_THRESHOLDS, HACCP_CORRECTIVE_ACTIONS } from '../config.js';

export const TemperaturesModule = {
  activeSubTab: 'temperatures', // 'temperatures' | 'cooling' | 'cooking' | 'fryers' | 'haccp_plan'
  selectedPeriod: 'morning',    // 'morning' (☀️ Matin) | 'evening' (🌙 Soir)
  showAddEquipmentModal: false,
  showAddFryerModal: false,
  showManualCoolingModal: false,
  timerInterval: null,

  render(state) {
    const today = DateUtils.getTodayISO();
    const activeUser = state.activeUser || (state.team && state.team[0]) || 'Opérateur';

    return `
      <section class="module-temperatures">
        <header style="margin-bottom: var(--space-md);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <h1 style="font-size: 1.4rem;">🌡️ Pilier 2 : Démarche HACCP & Surveillance CCP</h1>
              <p class="form-label">Contrôles thermiques des enceintes, refroidissement rapide, cuisson et huiles de friture.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-info">👤 ${DOMUtils.escapeHTML(activeUser)}</span>
            </div>
          </div>
        </header>

        <!-- Navigation secondaire du Pilier 2 -->
        <nav class="subnav-tabs">
          <button class="subnav-btn ${this.activeSubTab === 'temperatures' ? 'active' : ''}" data-subtab="temperatures">
            🌡️ Enceintes & Frigos
          </button>
          <button class="subnav-btn ${this.activeSubTab === 'cooling' ? 'active' : ''}" data-subtab="cooling">
            ❄️ Refroidissement Rapide
          </button>
          <button class="subnav-btn ${this.activeSubTab === 'cooking' ? 'active' : ''}" data-subtab="cooking">
            🍳 Cuisson & Remise T°
          </button>
          <button class="subnav-btn ${this.activeSubTab === 'fryers' ? 'active' : ''}" data-subtab="fryers">
            🍟 Huiles de Friture
          </button>
          <button class="subnav-btn ${this.activeSubTab === 'haccp_plan' ? 'active' : ''}" data-subtab="haccp_plan">
            🛡️ Matrice 5M & CCP
          </button>
        </nav>

        <!-- Contenu de la sous-vue active -->
        <div id="haccp-subcontent">
          ${this.renderSubTabContent(state, today)}
        </div>
      </section>
    `;
  },

  renderSubTabContent(state, today) {
    switch (this.activeSubTab) {
      case 'temperatures':
        return this.renderEnclosuresSection(state, today);
      case 'cooling':
        return this.renderCoolingSection(state, today);
      case 'cooking':
        return this.renderCookingSection(state, today);
      case 'fryers':
        return this.renderFryersSection(state, today);
      case 'haccp_plan':
        return this.renderHACCPPlanSection(state, today);
      default:
        return this.renderEnclosuresSection(state, today);
    }
  },

  /* ==========================================================================
     SOUS-ONGLET 1 : ENCEINTES FRIGORIFIQUES ET CHAUDES (CCP FRIGO)
     ========================================================================== */
  renderEnclosuresSection(state, today) {
    const equipments = state.equipments || [];
    const logs = state.logs || [];

    // Relevés du jour pour la période sélectionnée
    const currentPeriodLogs = logs.filter(l => 
      l.type === 'temp' && 
      l.date === today && 
      (l.period === this.selectedPeriod || (!l.period && this.selectedPeriod === 'morning'))
    );

    // Calcul de complétion du jour
    const doneCount = equipments.filter(eq => 
      currentPeriodLogs.some(l => l.equipmentId === eq.id)
    ).length;
    const totalCount = equipments.length;
    const percentDone = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

    // Anomalies thermiques du jour
    const anomaliesToday = logs.filter(l => l.type === 'temp' && l.date === today && l.ok === false);

    return `
      <!-- Synthèse des relevés d'enceintes -->
      <div class="card" style="border-left: 4px solid var(--color-primary);">
        <div class="card-title">
          <span>Relevés de température du jour (${today})</span>
          <span class="badge ${percentDone === 100 ? 'badge-success' : 'badge-warning'}">
            ${doneCount} / ${totalCount} contrôlés (${percentDone}%)
          </span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${percentDone}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-top: 6px;">
          <span>Obligation réglementaire : 2 relevés quotidiens (Matin et Soir)</span>
          <button class="btn btn-secondary btn-sm" id="btn-toggle-add-equipment">
            + Ajouter une enceinte
          </button>
        </div>
      </div>

      <!-- Filtre de créneau : Matin / Soir -->
      <div class="filter-chips">
        <button class="chip-btn ${this.selectedPeriod === 'morning' ? 'active' : ''}" data-period="morning">
          ☀️ Service Matin / Prise de poste
        </button>
        <button class="chip-btn ${this.selectedPeriod === 'evening' ? 'active' : ''}" data-period="evening">
          🌙 Service Soir / Fermeture
        </button>
      </div>

      <!-- Alerte si anomalies aujourd'hui -->
      ${anomaliesToday.length > 0 ? `
        <div class="card" style="background-color: var(--color-danger-bg); border-color: var(--color-danger); padding: 10px 14px;">
          <div style="display: flex; align-items: center; gap: 8px; color: var(--color-danger); font-weight: 700; font-size: 0.9rem;">
            <span>⚠️</span>
            <span>${anomaliesToday.length} anomalie(s) thermique(s) enregistrée(s) aujourd'hui — Actions correctives appliquées.</span>
          </div>
        </div>
      ` : ''}

      <!-- Modale / Formulaire d'ajout d'équipement -->
      ${this.showAddEquipmentModal ? `
        <div class="card" style="border: 2px dashed var(--color-primary); background: var(--bg-surface);">
          <div class="card-title">➕ Nouvelle enceinte thermique</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nom de l'équipement *</label>
              <input type="text" id="new-eq-name" class="form-input" placeholder="Ex: Chambre Froide Positif 3">
            </div>
            <div class="form-group">
              <label class="form-label">Type & Catégorie réglementaire *</label>
              <select id="new-eq-type" class="form-select">
                <option value="frais-ultra">Froid positif ultra-frais (Viandes / Poissons : 0°C à 2°C)</option>
                <option value="frais-standard" selected>Froid positif standard (Plats cuisinés / Laitages : 0°C à 4°C)</option>
                <option value="frais-legumes">Froid positif fruits & légumes (0°C à 6°C)</option>
                <option value="surgele">Froid négatif surgelés (≤ -18°C)</option>
                <option value="chaud">Maintien chaud / Liaison chaude (≥ 63°C)</option>
                <option value="custom">Plage personnalisée</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">T° Minimale tolérée (°C)</label>
              <input type="number" step="0.1" id="new-eq-min" class="form-input" value="0">
            </div>
            <div class="form-group">
              <label class="form-label">T° Maximale tolérée (°C)</label>
              <input type="number" step="0.1" id="new-eq-max" class="form-input" value="4">
            </div>
            <div class="form-group">
              <label class="form-label">Emplacement / Zone</label>
              <input type="text" id="new-eq-zone" class="form-input" placeholder="Ex: Laboratoire cuisine">
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <button class="btn btn-primary" id="btn-save-new-equipment">Créer l'enceinte</button>
            <button class="btn btn-secondary" id="btn-cancel-new-equipment">Annuler</button>
          </div>
        </div>
      ` : ''}

      <!-- Grille tactile des enceintes frigorifiques et chaudes -->
      <div class="temp-grid">
        ${equipments.map(eq => {
          // Dernier relevé de cette enceinte pour le créneau courant
          const currentLog = currentPeriodLogs.filter(l => l.equipmentId === eq.id).pop();
          // Dernier relevé absolu
          const lastAnyLog = logs.filter(l => l.type === 'temp' && l.equipmentId === eq.id).pop();
          const isDoneInPeriod = Boolean(currentLog);

          let icon = eq.icon || '🌡️';
          if (!eq.icon) {
            if (eq.min < 0) icon = '❄️';
            else if (eq.min >= 60) icon = '🔥';
            else icon = '🥩';
          }

          return `
            <div class="temp-card ${currentLog && !currentLog.ok ? 'anomaly' : ''}" data-eq-id="${eq.id}">
              <div>
                <div class="temp-card-header">
                  <div>
                    <strong style="font-size: 1rem; color: var(--text-main);">
                      ${icon} ${DOMUtils.escapeHTML(eq.name)}
                    </strong>
                    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                      📍 ${DOMUtils.escapeHTML(eq.zone || 'Cuisine')}
                    </div>
                  </div>
                  <div>
                    ${isDoneInPeriod ? `
                      <span class="badge ${currentLog.ok ? 'badge-success' : 'badge-danger'}">
                        ${currentLog.ok ? '✓ Conforme' : '⚠️ Anomalie'}
                      </span>
                    ` : `
                      <span class="badge badge-warning">À relever</span>
                    `}
                  </div>
                </div>

                <div class="temp-badge-norm">
                  Norme : ${eq.min}°C à ${eq.max}°C
                </div>

                <!-- Info dernier relevé -->
                <div style="font-size: 0.82rem; margin: 8px 0; color: var(--text-muted);">
                  ${currentLog ? `
                    <span>Relevé ${this.selectedPeriod === 'morning' ? 'Matin' : 'Soir'} : </span>
                    <strong style="color: ${currentLog.ok ? 'var(--color-success)' : 'var(--color-danger)'}; font-size: 1rem;">
                      ${currentLog.value}°C
                    </strong>
                    <span style="font-size: 0.75rem;">(${currentLog.time} par ${DOMUtils.escapeHTML(currentLog.user)})</span>
                  ` : (lastAnyLog ? `
                    <span style="font-size: 0.75rem;">Dernier relevé : ${lastAnyLog.value}°C le ${lastAnyLog.date} (${lastAnyLog.time})</span>
                  ` : '<span style="font-size: 0.75rem;">Aucun relevé enregistré</span>')}
                </div>
              </div>

              <!-- Formulaire de saisie tactile -->
              <div style="margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                <div class="temp-input-row">
                  <input 
                    type="number" 
                    step="0.1" 
                    class="form-input temp-input-lg input-temp-val" 
                    id="input-temp-${eq.id}" 
                    data-eq-id="${eq.id}" 
                    data-min="${eq.min}" 
                    data-max="${eq.max}"
                    placeholder="°C"
                    value="${currentLog ? currentLog.value : ''}"
                  >
                  <button 
                    class="btn btn-primary btn-save-temp" 
                    data-eq-id="${eq.id}" 
                    style="flex: 1; padding: 11px;"
                  >
                    Valider (${this.selectedPeriod === 'morning' ? 'Matin' : 'Soir'})
                  </button>
                  <button 
                    class="btn btn-secondary btn-sm btn-delete-eq" 
                    data-eq-id="${eq.id}" 
                    title="Supprimer cet équipement" 
                    style="color: var(--color-danger); padding: 9px 8px;"
                  >
                    ✕
                  </button>
                </div>

                <!-- Tiroir d'action corrective conditionnel (visible si hors norme) -->
                <div 
                  id="corrective-drawer-${eq.id}" 
                  class="corrective-drawer" 
                  style="${currentLog && !currentLog.ok ? 'display: block;' : 'display: none;'}"
                >
                  <div style="font-weight: 700; color: var(--color-danger); margin-bottom: 4px;">
                    ⚠️ Température hors norme réglementaire !
                  </div>
                  <label class="form-label" style="color: var(--color-danger);">
                    Action corrective immédiate (Obligatoire) * :
                  </label>
                  <select class="form-select corrective-select" id="corrective-select-${eq.id}">
                    <option value="">-- Choisir l'action corrective menée --</option>
                    ${HACCP_CORRECTIVE_ACTIONS.TEMPERATURE.map(act => `
                      <option value="${DOMUtils.escapeHTML(act)}" ${currentLog && currentLog.correctiveAction === act ? 'selected' : ''}>
                        ${DOMUtils.escapeHTML(act)}
                      </option>
                    `).join('')}
                    <option value="autre">Autre action corrective spécifique...</option>
                  </select>
                  <input 
                    type="text" 
                    class="form-input corrective-custom-text" 
                    id="corrective-custom-${eq.id}" 
                    placeholder="Préciser la mesure corrective prise..." 
                    style="margin-top: 6px; display: none;"
                  >
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Historique des relevés d'enceintes du jour -->
      <div class="card" style="margin-top: var(--space-md);">
        <div class="card-title">
          <span>Journal des relevés de température (Aujourd'hui)</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${currentPeriodLogs.length} relevé(s)</span>
        </div>
        ${logs.filter(l => l.type === 'temp' && l.date === today).length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted);">Aucun relevé de température enregistré aujourd'hui.</p>
        ` : `
          <div style="overflow-x: auto;">
            <table class="ccp-table">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Créneau</th>
                  <th>Enceinte</th>
                  <th>Valeur</th>
                  <th>Norme</th>
                  <th>Statut</th>
                  <th>Action corrective</th>
                  <th>Opérateur</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${logs.filter(l => l.type === 'temp' && l.date === today).reverse().map(l => `
                  <tr style="${!l.ok ? 'background-color: rgba(224, 49, 49, 0.04);' : ''}">
                    <td>${l.time}</td>
                    <td><span class="badge ${l.period === 'evening' ? 'badge-info' : 'badge-warning'}">${l.period === 'evening' ? '🌙 Soir' : '☀️ Matin'}</span></td>
                    <td><strong>${DOMUtils.escapeHTML(l.equipmentName)}</strong></td>
                    <td><strong>${l.value}°C</strong></td>
                    <td>${l.min}°C à ${l.max}°C</td>
                    <td>
                      <span class="badge ${l.ok ? 'badge-success' : 'badge-danger'}">
                        ${l.ok ? 'Conforme' : 'Anomalie'}
                      </span>
                    </td>
                    <td>${DOMUtils.escapeHTML(l.correctiveAction || '-')}</td>
                    <td>${DOMUtils.escapeHTML(l.user)}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm btn-delete-log" data-log-id="${l.id}" title="Annuler ce relevé" style="color: var(--color-danger); padding: 2px 6px;">
                        ✕
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  /* ==========================================================================
     SOUS-ONGLET 2 : CELLULE DE REFROIDISSEMENT RAPIDE (CCP CRITIQUE)
     ========================================================================== */
  renderCoolingSection(state, today) {
    const coolingCycles = state.coolingCycles || [];
    const activeCycle = coolingCycles.find(c => !c.endTime);

    // Calcul de durée pour le cycle actif
    let elapsedMinutes = 0;
    let remainingMinutes = 120;
    let isAlert100 = false;
    let isAlert120 = false;

    if (activeCycle) {
      elapsedMinutes = DateUtils.diffMinutes(activeCycle.startTime, DateUtils.getNowTime());
      remainingMinutes = Math.max(0, 120 - elapsedMinutes);
      isAlert100 = elapsedMinutes >= 100;
      isAlert120 = elapsedMinutes > 120;
    }

    return `
      <!-- Rappel de la règle d'or réglementaire du refroidissement -->
      <div class="card" style="border-left: 4px solid #1c7ed6; background: rgba(28, 126, 214, 0.04);">
        <div class="card-title" style="color: #1c7ed6;">
          <span>❄️ Réglementation CCP Majeur : Règle des 2 Heures</span>
          <span class="badge badge-info">CE n° 852/2004</span>
        </div>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-main);">
          Toute denrée cuite destinée à être conservée au froid doit être refroidie rapidement de <strong>+63°C à +10°C ou moins en moins de 2 heures (120 minutes)</strong> pour franchir sans délai la zone de prolifération bactérienne (10°C - 63°C).
        </p>
      </div>

      <!-- CAS 1 : CYCLE EN COURS ACTIF -->
      ${activeCycle ? `
        <div class="cooling-active-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="display: flex; align-items: center;">
                <span class="cooling-pulse-dot"></span>
                <strong style="font-size: 1.1rem; color: #1864ab;">
                  Cycle en cours : ${DOMUtils.escapeHTML(activeCycle.dishName)}
                </strong>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                Démarré à <strong>${activeCycle.startTime}</strong> à <strong>${activeCycle.startTemp}°C</strong> par <strong>${DOMUtils.escapeHTML(activeCycle.user)}</strong>
                ${activeCycle.quantity ? ` · Bac(s) : ${DOMUtils.escapeHTML(activeCycle.quantity)}` : ''}
              </div>
            </div>
            <div>
              <span class="cooling-timer-display ${isAlert120 ? 'style="border-color: var(--color-danger); color: var(--color-danger);"' : ''}">
                ⏱️ ${elapsedMinutes} min écoulées
              </span>
            </div>
          </div>

          <div style="margin: 14px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
              <span>Limite réglementaire : 120 minutes max</span>
              <strong style="color: ${isAlert120 ? 'var(--color-danger)' : (isAlert100 ? 'var(--color-warning)' : 'var(--color-success)')};">
                ${isAlert120 ? '⚠️ DÉPASSEMENT DES 2 HEURES (+ ' + (elapsedMinutes - 120) + ' min) !' : `Il reste ${remainingMinutes} min avant seuil`}
              </strong>
            </div>
            <div class="progress-bar-container">
              <div 
                class="progress-bar-fill" 
                style="width: ${Math.min(100, Math.round((elapsedMinutes / 120) * 100))}%; background-color: ${isAlert120 ? 'var(--color-danger)' : (isAlert100 ? 'var(--color-warning)' : '#339af0')};"
              ></div>
            </div>
          </div>

          <!-- Formulaire de fin de cycle -->
          <div style="background: var(--bg-surface); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 8px;">
              🏁 Sortie de cellule & Contrôle de fin de refroidissement
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">T° finale à cœur à la sortie de cellule (°C) *</label>
                <input 
                  type="number" 
                  step="0.1" 
                  id="cooling-finish-temp" 
                  class="form-input temp-input-lg" 
                  placeholder="Ex: 8.5"
                  style="width: 100%; max-width: 100%;"
                >
                <small style="color: var(--text-muted);">Doit être ≤ 10.0°C</small>
              </div>
              <div class="form-group">
                <label class="form-label">Heure de sortie effective</label>
                <input 
                  type="time" 
                  id="cooling-finish-time" 
                  class="form-input" 
                  value="${DateUtils.getNowTime()}"
                >
              </div>
            </div>

            <!-- Tiroir d'action corrective si fin > 10°C ou temps > 120min -->
            <div id="cooling-corrective-drawer" class="corrective-drawer" style="display: none; margin-bottom: 10px;">
              <strong style="color: var(--color-danger); display: block; margin-bottom: 4px;">
                ⚠️ Seuil CCP non conforme (T° finale > 10°C ou Durée > 120 min) !
              </strong>
              <label class="form-label" style="color: var(--color-danger);">
                Action corrective obligatoire * :
              </label>
              <select id="cooling-corrective-select" class="form-select">
                <option value="">-- Sélectionner l'action corrective --</option>
                ${HACCP_CORRECTIVE_ACTIONS.COOLING.map(act => `
                  <option value="${DOMUtils.escapeHTML(act)}">${DOMUtils.escapeHTML(act)}</option>
                `).join('')}
              </select>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 10px;">
              <button class="btn btn-primary" id="btn-finish-cooling-cycle" style="flex: 1;">
                Valider et archiver le cycle
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-cancel-cooling-cycle" style="color: var(--color-danger);">
                Annuler ce cycle
              </button>
            </div>
          </div>
        </div>
      ` : `
        <!-- NOUVEAU CYCLE : FORMULAIRE DE DÉMARRAGE -->
        <div class="card" style="border: 2px solid #339af0; background: var(--bg-surface);">
          <div class="card-title" style="color: #1864ab;">
            <span>🚀 Démarrer un cycle de refroidissement rapide</span>
            <button class="btn btn-secondary btn-sm" id="btn-toggle-manual-cooling">
              ${this.showManualCoolingModal ? 'Fermer saisie manuelle' : '+ Saisie a posteriori (terminé)'}
            </button>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nom de la préparation cuite *</label>
              <input type="text" id="cooling-new-dish" class="form-input" placeholder="Ex: Bœuf bourguignon, Fond de veau, Gratin...">
            </div>
            <div class="form-group">
              <label class="form-label">Température en sortie de cuisson (°C) *</label>
              <input type="number" step="0.1" id="cooling-new-temp" class="form-input" placeholder="Ex: 75" value="70">
              <small style="color: var(--text-muted);">Recommandé : ≥ 63°C</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Heure d'enfournement en cellule</label>
              <input type="time" id="cooling-new-time" class="form-input" value="${DateUtils.getNowTime()}">
            </div>
            <div class="form-group">
              <label class="form-label">Conditionnement / Quantité</label>
              <input type="text" id="cooling-new-qty" class="form-input" placeholder="Ex: 2 bacs GN 1/1 (8 kg)">
            </div>
          </div>

          <button class="btn btn-primary" id="btn-start-cooling-cycle" style="width: 100%; margin-top: 8px; padding: 12px; font-size: 1rem;">
            ❄️ Lancer le chronomètre de refroidissement (Cellule)
          </button>
        </div>
      `}

      <!-- MODALE : SAISIE MANUELLE A POSTERIORI -->
      ${this.showManualCoolingModal ? `
        <div class="card" style="border: 2px dashed #1c7ed6; background: var(--bg-surface);">
          <div class="card-title">📝 Consigner un cycle de refroidissement déjà réalisé</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nom du plat *</label>
              <input type="text" id="manual-cooling-dish" class="form-input" placeholder="Ex: Blanquette de veau">
            </div>
            <div class="form-group">
              <label class="form-label">Quantité / Bacs</label>
              <input type="text" id="manual-cooling-qty" class="form-input" placeholder="Ex: 10 portions">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">T° initiale (°C) *</label>
              <input type="number" step="0.1" id="manual-cooling-start-temp" class="form-input" value="72">
            </div>
            <div class="form-group">
              <label class="form-label">Heure de début *</label>
              <input type="time" id="manual-cooling-start-time" class="form-input" value="10:00">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">T° finale atteinte (°C) *</label>
              <input type="number" step="0.1" id="manual-cooling-end-temp" class="form-input" value="8.0">
            </div>
            <div class="form-group">
              <label class="form-label">Heure de fin *</label>
              <input type="time" id="manual-cooling-end-time" class="form-input" value="11:30">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Si déviation (>10°C ou >120 min), action corrective :</label>
            <select id="manual-cooling-action" class="form-select">
              <option value="">Aucune (conforme)</option>
              ${HACCP_CORRECTIVE_ACTIONS.COOLING.map(act => `
                <option value="${DOMUtils.escapeHTML(act)}">${DOMUtils.escapeHTML(act)}</option>
              `).join('')}
            </select>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <button class="btn btn-primary" id="btn-save-manual-cooling">Enregistrer le cycle</button>
            <button class="btn btn-secondary" id="btn-cancel-manual-cooling">Annuler</button>
          </div>
        </div>
      ` : ''}

      <!-- Registre des cycles de refroidissement -->
      <div class="card" style="margin-top: var(--space-md);">
        <div class="card-title">
          <span>Registre officiel des cycles de refroidissement rapide</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${coolingCycles.filter(c => c.endTime).length} cycle(s) validé(s)</span>
        </div>
        ${coolingCycles.filter(c => c.endTime).length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted);">Aucun cycle de refroidissement archivé pour l'instant.</p>
        ` : `
          <div style="overflow-x: auto;">
            <table class="ccp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Préparation</th>
                  <th>Début (T° / H)</th>
                  <th>Fin (T° / H)</th>
                  <th>Durée totale</th>
                  <th>Statut CCP</th>
                  <th>Action corrective</th>
                  <th>Opérateur</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${coolingCycles.filter(c => c.endTime).slice(-10).reverse().map(c => `
                  <tr style="${!c.ok ? 'background-color: rgba(224, 49, 49, 0.04);' : ''}">
                    <td>${c.date}</td>
                    <td><strong>${DOMUtils.escapeHTML(c.dishName)}</strong></td>
                    <td>${c.startTemp}°C · ${c.startTime}</td>
                    <td><strong>${c.endTemp}°C</strong> · ${c.endTime}</td>
                    <td>
                      <span class="badge ${c.durationMinutes <= 120 ? 'badge-info' : 'badge-danger'}">
                        ⏱️ ${c.durationMinutes} min
                      </span>
                    </td>
                    <td>
                      <span class="badge ${c.ok ? 'badge-success' : 'badge-danger'}">
                        ${c.ok ? '✓ Conforme (≤10°C / <2h)' : '⚠️ Hors seuil'}
                      </span>
                    </td>
                    <td>${DOMUtils.escapeHTML(c.correctiveAction || '-')}</td>
                    <td>${DOMUtils.escapeHTML(c.user)}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm btn-delete-cooling" data-cycle-id="${c.id}" style="color: var(--color-danger); padding: 2px 6px;">
                        ✕
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  /* ==========================================================================
     SOUS-ONGLET 3 : CUISSON À CŒUR ET REMISE EN TEMPÉRATURE (CCP PRODUCTION)
     ========================================================================== */
  renderCookingSection(state, today) {
    const cookingCycles = state.cookingCycles || [];

    return `
      <!-- Rappel réglementaire -->
      <div class="card" style="border-left: 4px solid var(--color-primary); background: var(--color-primary-light);">
        <div class="card-title" style="color: var(--color-primary-dark);">
          <span>🍳 Barèmes thermiques obligatoires de production</span>
          <span class="badge badge-warning">HACCP</span>
        </div>
        <div style="font-size: 0.83rem; line-height: 1.5; color: var(--text-main);">
          • <strong>Cuisson à cœur</strong> : Température minimale de <strong>≥ 63°C</strong> à cœur (recommandé <strong>≥ 70°C</strong> pour volailles, abats et viandes hachées pour destruction Listeria).<br>
          • <strong>Remise en température</strong> : Montée de ≤ 10°C à <strong>≥ 63°C en moins de 60 minutes</strong>.<br>
          • <strong>Maintien au chaud (Liaison chaude)</strong> : Température continue de <strong>≥ 63°C</strong> jusqu'au service.
        </div>
      </div>

      <!-- Formulaire d'enregistrement d'un contrôle de cuisson / remise -->
      <div class="card">
        <div class="card-title">Enregistrer un contrôle thermique de production</div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Type d'opération thermique *</label>
            <select id="cook-op-type" class="form-select">
              <option value="cuisson">Cuisson à cœur (Norme ≥ 63°C / 70°C)</option>
              <option value="remise">Remise en température (Norme ≥ 63°C en < 60 min)</option>
              <option value="chaud">Maintien au chaud / Liaison chaude (Norme ≥ 63°C)</option>
              <option value="decongel">Décongélation contrôlée (Froid positif 0°C à 4°C)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nom du plat ou de la préparation *</label>
            <input type="text" id="cook-dish-name" class="form-input" placeholder="Ex: Rôti de veau, Filet de saumon, Sauce béchamel">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Température constatée à la sonde (°C) *</label>
            <input type="number" step="0.1" id="cook-temp" class="form-input temp-input-lg" placeholder="°C" style="width: 100%; max-width: 100%;">
          </div>
          <div class="form-group" id="cook-duration-group">
            <label class="form-label">Durée de montée (min, pour remise en T°)</label>
            <input type="number" step="1" id="cook-duration" class="form-input" placeholder="Ex: 35">
            <small style="color: var(--text-muted);">Max 60 min pour remise en température</small>
          </div>
          <div class="form-group">
            <label class="form-label">Heure du contrôle</label>
            <input type="time" id="cook-time" class="form-input" value="${DateUtils.getNowTime()}">
          </div>
        </div>

        <!-- Tiroir d'action corrective si T° insuffisante -->
        <div id="cook-corrective-drawer" class="corrective-drawer" style="display: none; margin-bottom: 12px;">
          <strong style="color: var(--color-danger); display: block; margin-bottom: 4px;">
            ⚠️ Température insuffisante au barème réglementaire !
          </strong>
          <label class="form-label" style="color: var(--color-danger);">Action corrective obligatoire * :</label>
          <select id="cook-corrective-select" class="form-select">
            <option value="">-- Choisir une action corrective --</option>
            ${HACCP_CORRECTIVE_ACTIONS.COOKING.map(act => `
              <option value="${DOMUtils.escapeHTML(act)}">${DOMUtils.escapeHTML(act)}</option>
            `).join('')}
          </select>
        </div>

        <button class="btn btn-primary" id="btn-save-cooking-check" style="width: 100%; padding: 12px;">
          Enregistrer le contrôle de production
        </button>
      </div>

      <!-- Registre des contrôles de production du jour -->
      <div class="card">
        <div class="card-title">
          <span>Registre des contrôles de cuisson & réchauffage</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${cookingCycles.length} enregistrement(s)</span>
        </div>
        ${cookingCycles.length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted);">Aucun contrôle de cuisson consigné pour l'instant.</p>
        ` : `
          <div style="overflow-x: auto;">
            <table class="ccp-table">
              <thead>
                <tr>
                  <th>Date / Heure</th>
                  <th>Opération</th>
                  <th>Plat / Préparation</th>
                  <th>T° Sonde</th>
                  <th>Durée</th>
                  <th>Conformité</th>
                  <th>Action corrective</th>
                  <th>Opérateur</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${cookingCycles.slice(-10).reverse().map(c => `
                  <tr style="${!c.ok ? 'background-color: rgba(224, 49, 49, 0.04);' : ''}">
                    <td>${c.date} ${c.time}</td>
                    <td>
                      <span class="badge ${c.type === 'cuisson' ? 'badge-warning' : (c.type === 'remise' ? 'badge-info' : 'badge-secondary')}">
                        ${c.type === 'cuisson' ? '🍳 Cuisson' : (c.type === 'remise' ? '🔄 Remise T°' : (c.type === 'chaud' ? '🔥 Liaison chaude' : '❄️ Décongélation'))}
                      </span>
                    </td>
                    <td><strong>${DOMUtils.escapeHTML(c.dishName)}</strong></td>
                    <td><strong style="color: ${c.ok ? 'var(--color-success)' : 'var(--color-danger)'};">${c.temp}°C</strong></td>
                    <td>${c.durationMinutes ? c.durationMinutes + ' min' : '-'}</td>
                    <td>
                      <span class="badge ${c.ok ? 'badge-success' : 'badge-danger'}">
                        ${c.ok ? '✓ Conforme' : '⚠️ Anomalie'}
                      </span>
                    </td>
                    <td>${DOMUtils.escapeHTML(c.correctiveAction || '-')}</td>
                    <td>${DOMUtils.escapeHTML(c.user)}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm btn-delete-cooking" data-cook-id="${c.id}" style="color: var(--color-danger); padding: 2px 6px;">
                        ✕
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  /* ==========================================================================
     SOUS-ONGLET 4 : CONTRÔLE DES HUILES DE FRITURE (TTCP MAX 24%)
     ========================================================================== */
  renderFryersSection(state, today) {
    const fryers = state.fryers || [];
    const fryerChecks = state.fryerChecks || [];

    return `
      <!-- Rappel réglementaire Décret 2008-184 -->
      <div class="card" style="border-left: 4px solid var(--color-warning); background: var(--color-warning-bg);">
        <div class="card-title" style="color: #d9480f;">
          <span>🍟 Contrôle réglementaire des Huiles de Friture (HAU)</span>
          <span class="badge badge-warning">Décret n° 2008-184</span>
        </div>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-main);">
          La teneur en composés polaires (TTCP) ne doit <strong>jamais dépasser 24%</strong>. Une huile supérieure à 24% est impropre à la consommation, toxique et passible de fermeture administrative. Elle doit être immédiatement vidangée et stockée en fût étanche pour la filière Huiles Alimentaires Usagées (HAU).
        </p>
      </div>

      <!-- Modale d'ajout d'une nouvelle friteuse -->
      ${this.showAddFryerModal ? `
        <div class="card" style="border: 2px dashed var(--color-warning); background: var(--bg-surface);">
          <div class="card-title">➕ Ajouter un poste de friture</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nom du bac / Friteuse *</label>
              <input type="text" id="new-fryer-name" class="form-input" placeholder="Ex: Friteuse 3 (Snack)">
            </div>
            <div class="form-group">
              <label class="form-label">Type d'huile utilisé</label>
              <input type="text" id="new-fryer-oil" class="form-input" placeholder="Ex: Huile de tournesol oléique">
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <button class="btn btn-primary" id="btn-save-new-fryer">Créer la friteuse</button>
            <button class="btn btn-secondary" id="btn-cancel-new-fryer">Annuler</button>
          </div>
        </div>
      ` : ''}

      <!-- Formulaire de contrôle d'huile -->
      <div class="card">
        <div class="card-title">
          <span>Test périodique des composés polaires (% TTCP)</span>
          <button class="btn btn-secondary btn-sm" id="btn-toggle-add-fryer">+ Ajouter une friteuse</button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Poste de friture contrôlé *</label>
            <select id="fryer-select" class="form-select">
              ${fryers.map(f => `
                <option value="${f.id}">${DOMUtils.escapeHTML(f.name)} (${DOMUtils.escapeHTML(f.oilType || 'Huile pro')})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Résultat du testeur / Languette (% TTCP) *</label>
            <input type="number" step="0.5" id="fryer-ttcp-input" class="form-input temp-input-lg" placeholder="Ex: 16" style="width: 100%; max-width: 100%;">
          </div>
        </div>

        <!-- Jauge dynamique visuelle du taux polaire -->
        <div style="margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
            <span style="color: var(--color-success);">0-19% : Huile optimale</span>
            <span style="color: var(--color-warning);">19-23.5% : Surveiller</span>
            <span style="color: var(--color-danger); font-weight: 700;">≥ 24% : CHANGEMENT OBLIGATOIRE</span>
          </div>
          <div class="ttcp-gauge">
            <div class="ttcp-limit-marker" title="Limite légale 24%"></div>
            <div id="fryer-gauge-fill" class="ttcp-gauge-fill" style="width: 10%; background-color: var(--color-success);"></div>
          </div>
          <div id="fryer-status-text" style="font-size: 0.85rem; font-weight: 600; text-align: center; margin-top: 4px;">
            Saisissez le résultat du testeur électronique ou de la bandelette
          </div>
        </div>

        <!-- Décision & Mesures -->
        <div class="form-row" style="margin-top: 10px;">
          <div class="form-group">
            <label class="form-label">Décision / Statut *</label>
            <select id="fryer-decision" class="form-select">
              <option value="ok">Huile conforme (Maintien en service)</option>
              <option value="changed">Huile usagée changée (Vidange complète effectuée)</option>
            </select>
          </div>
          <div class="form-group" id="fryer-waste-group" style="display: none;">
            <label class="form-label">Volume d'huile usagée vidangé (Litres)</label>
            <input type="number" step="1" id="fryer-waste-liters" class="form-input" placeholder="Ex: 15 L pour collecte HAU">
          </div>
        </div>

        <button class="btn btn-primary" id="btn-save-fryer-check" style="width: 100%; padding: 12px; margin-top: 8px;">
          Enregistrer le contrôle d'huile
        </button>
      </div>

      <!-- Registre officiel des contrôles d'huiles -->
      <div class="card">
        <div class="card-title">
          <span>Registre de suivi des bains de friture</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${fryerChecks.length} contrôle(s)</span>
        </div>
        ${fryerChecks.length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted);">Aucun contrôle d'huile enregistré.</p>
        ` : `
          <div style="overflow-x: auto;">
            <table class="ccp-table">
              <thead>
                <tr>
                  <th>Date / Heure</th>
                  <th>Friteuse</th>
                  <th>Taux TTCP</th>
                  <th>Décision</th>
                  <th>Filière HAU</th>
                  <th>Statut</th>
                  <th>Opérateur</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${fryerChecks.slice(-10).reverse().map(f => `
                  <tr style="${f.ttcpValue >= 24 ? 'background-color: rgba(224, 49, 49, 0.04);' : ''}">
                    <td>${f.date} ${f.time}</td>
                    <td><strong>${DOMUtils.escapeHTML(f.fryerName)}</strong></td>
                    <td><strong style="color: ${f.ttcpValue >= 24 ? 'var(--color-danger)' : (f.ttcpValue >= 19 ? 'var(--color-warning)' : 'var(--color-success)')};">${f.ttcpValue}%</strong></td>
                    <td>${f.decision === 'changed' ? '🔄 Huile changée & bac nettoyé' : '✓ Maintenue'}</td>
                    <td>${f.wasteLiters ? f.wasteLiters + ' L recyclés' : '-'}</td>
                    <td>
                      <span class="badge ${f.ttcpValue < 24 ? 'badge-success' : 'badge-danger'}">
                        ${f.ttcpValue < 24 ? 'Conforme' : '⚠️ Alerte >24%'}
                      </span>
                    </td>
                    <td>${DOMUtils.escapeHTML(f.user)}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm btn-delete-fryer-check" data-check-id="${f.id}" style="color: var(--color-danger); padding: 2px 6px;">
                        ✕
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  /* ==========================================================================
     SOUS-ONGLET 5 : PLAN HACCP, ANALYSE DES 5M & SYNTHÈSE DES CCP
     ========================================================================== */
  renderHACCPPlanSection(state, today) {
    return `
      <div class="card" style="border-left: 4px solid var(--color-primary);">
        <div class="card-title">
          <span>🛡️ Plan de Maîtrise HACCP de l'Établissement</span>
          <span class="badge badge-success">Conforme Paquet Hygiène</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
          Le Plan HACCP structure l'analyse des dangers biologiques, chimiques, physiques et allergènes selon la méthode des 5M et établit la surveillance ininterrompue des Points Critiques pour la Maîtrise (CCP).
        </p>
      </div>

      <!-- Les 5M en action -->
      <h2 style="font-size: 1.15rem; margin: var(--space-md) 0 var(--space-xs);">
        📋 Analyse des Dangers selon la Méthode des 5M
      </h2>
      <div class="haccp-5m-grid">
        <div class="haccp-5m-card">
          <h3>🥩 Matières</h3>
          <ul>
            <li>Agrément sanitaire obligatoire des fournisseurs.</li>
            <li>Contrôle strict des températures à réception (≤ 4°C frais / ≤ -18°C surgelés).</li>
            <li>Archivage des numéros de lot et bons de livraison (BL).</li>
            <li>Gestion des 14 allergènes à déclaration obligatoire (INCO).</li>
          </ul>
        </div>

        <div class="haccp-5m-card">
          <h3>🔪 Matériel</h3>
          <ul>
            <li>Surveillance des enceintes de stockage froid (0-2°C / 0-4°C / -18°C).</li>
            <li>Planches de découpe et couteaux à codes couleur par filière.</li>
            <li>Étalonnage périodique des thermomètres et sondes de cuisson.</li>
            <li>Contrôle de l'absence de casse de verre ou corps étrangers.</li>
          </ul>
        </div>

        <div class="haccp-5m-card">
          <h3>📋 Méthode</h3>
          <ul>
            <li>Respect absolu de la <strong>Marche en avant</strong> (séparation propre / sale).</li>
            <li>Cuisson à cœur à <strong>≥ 63°C</strong> (ou ≥ 70°C volailles/viandes hachées).</li>
            <li>Refroidissement rapide de <strong>+63°C à ≤ +10°C en moins de 2 heures</strong>.</li>
            <li>Étiquetage systématique des DLC secondaires (J+3).</li>
          </ul>
        </div>

        <div class="haccp-5m-card">
          <h3>🏢 Milieu</h3>
          <ul>
            <li>Application rigoureuse du Plan de Nettoyage et Désinfection (PND).</li>
            <li>Évacuation étanche et régulière des déchets en poubelles à commande au pied.</li>
            <li>Plan de lutte anti-nuisibles (3D) sans produit toxique au contact alimentaire.</li>
            <li>Aération et dégraissage régulier des hottes d'aspiration.</li>
          </ul>
        </div>

        <div class="haccp-5m-card">
          <h3>🧑‍🍳 Main-d’œuvre</h3>
          <ul>
            <li>Tenue vestimentaire complète réservée à la cuisine (charlotte, veste propre).</li>
            <li>Lavage et désinfection des mains au lave-mains à commande non manuelle.</li>
            <li>Déclaration d'aptitude médicale quotidienne (éviction en cas de gastro-entérite).</li>
            <li>Formation continue des collaborateurs aux principes du PMS.</li>
          </ul>
        </div>
      </div>

      <!-- Tableau Synoptique Officiel des CCP (Prêt pour Inspection Vétérinaire) -->
      <div class="card" style="margin-top: var(--space-md);">
        <div class="card-title">
          <span>🎯 Tableau Officiel des Points Critiques (CCP) & Seuils d'Alerte</span>
          <span class="badge badge-info">Document d'audit DDPP</span>
        </div>

        <div class="ccp-table-wrapper">
          <table class="ccp-table">
            <thead>
              <tr>
                <th>Étape / CCP</th>
                <th>Dangers Maîtrisés</th>
                <th>Limite Critique Réglementaire</th>
                <th>Surveillance & Fréquence</th>
                <th>Action Corrective en cas d'écart</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>CCP 1 : Stockage Froid Positif</strong></td>
                <td>Prolifération de Listeria monocytogenes, Salmonella</td>
                <td><span class="badge badge-warning">0°C à +2°C</span> (Viandes/Poissons)<br><span class="badge badge-warning">0°C à +4°C</span> (Standard)</td>
                <td>Relevé bi-quotidien (Matin / Soir) de chaque enceinte</td>
                <td>Réglage thermostat, transfert vers réserve, destruction si rupture prolongée.</td>
              </tr>
              <tr>
                <td><strong>CCP 2 : Stockage Froid Négatif</strong></td>
                <td>Décongélation partielle, altération biologique</td>
                <td><span class="badge badge-info">≤ -18°C</span> (Alerte si > -15°C)</td>
                <td>Relevé bi-quotidien</td>
                <td>Interdiction absolue de recongélation, dégivrage, appel frigoriste.</td>
              </tr>
              <tr>
                <td><strong>CCP 3 : Cuisson à cœur</strong></td>
                <td>Survie de pathogènes sporulés ou végétatifs</td>
                <td><span class="badge badge-success">≥ +63°C</span> (ou +70°C volailles)</td>
                <td>Contrôle à la sonde au centre thermique par lot sensible</td>
                <td>Prolongation immédiate de cuisson jusqu'au franchissement du barème.</td>
              </tr>
              <tr>
                <td><strong>CCP 4 : Refroidissement Rapide</strong></td>
                <td>Germination de Clostridium perfringens, Bacillus cereus</td>
                <td><span class="badge badge-danger">De +63°C à ≤ +10°C en < 2h</span></td>
                <td>Chronomètre & relevé T° début / fin par cycle en cellule</td>
                <td>Prolongation forcée, consommation le jour même ou destruction du lot.</td>
              </tr>
              <tr>
                <td><strong>CCP 5 : Remise en Température</strong></td>
                <td>Multiplication bactérienne en phase tiède</td>
                <td><span class="badge badge-warning">De ≤ +10°C à ≥ +63°C en < 1h</span></td>
                <td>Sonde thermométrique lors du réchauffage avant service</td>
                <td>Accélération thermique four puissant, interdiction de servir tiède.</td>
              </tr>
              <tr>
                <td><strong>CCP 6 : Huiles de Friture</strong></td>
                <td>Composés polaires toxiques cancérigènes</td>
                <td><span class="badge badge-danger">≤ 24% TTCP</span></td>
                <td>Mesure électronique hebdomadaire ou bimensuelle</td>
                <td>Vidange immédiate du bain d'huile, recyclage HAU, huile neuve.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* ==========================================================================
     GESTION ÉVÉNEMENTIELLE COMPLETE (100% SANS BUG)
     ========================================================================== */
  bindEvents(container, state, onUpdate) {
    const activeUser = state.activeUser || (state.team && state.team[0]) || 'Opérateur';
    const today = DateUtils.getTodayISO();

    // 1. Navigation entre les sous-onglets du Pilier 2
    container.querySelectorAll('.subnav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const subtab = btn.dataset.subtab;
        if (subtab) {
          this.activeSubTab = subtab;
          this.reRender(container, state, onUpdate);
        }
      });
    });

    // 2. Événements Sous-onglet 1 : Enceintes
    if (this.activeSubTab === 'temperatures') {
      this.bindEnclosureEvents(container, state, onUpdate, today, activeUser);
    }

    // 3. Événements Sous-onglet 2 : Refroidissement rapide
    if (this.activeSubTab === 'cooling') {
      this.bindCoolingEvents(container, state, onUpdate, today, activeUser);
    }

    // 4. Événements Sous-onglet 3 : Cuisson
    if (this.activeSubTab === 'cooking') {
      this.bindCookingEvents(container, state, onUpdate, today, activeUser);
    }

    // 5. Événements Sous-onglet 4 : Huiles de friture
    if (this.activeSubTab === 'fryers') {
      this.bindFryerEvents(container, state, onUpdate, today, activeUser);
    }
  },

  bindEnclosureEvents(container, state, onUpdate, today, activeUser) {
    // Filtres créneaux Matin / Soir
    container.querySelectorAll('[data-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedPeriod = btn.dataset.period;
        this.reRender(container, state, onUpdate);
      });
    });

    // Toggle formulaire ajout enceinte
    container.querySelector('#btn-toggle-add-equipment')?.addEventListener('click', () => {
      this.showAddEquipmentModal = !this.showAddEquipmentModal;
      this.reRender(container, state, onUpdate);
    });

    container.querySelector('#btn-cancel-new-equipment')?.addEventListener('click', () => {
      this.showAddEquipmentModal = false;
      this.reRender(container, state, onUpdate);
    });

    // Sauvegarde nouvelle enceinte
    container.querySelector('#btn-save-new-equipment')?.addEventListener('click', () => {
      const name = container.querySelector('#new-eq-name')?.value.trim();
      const type = container.querySelector('#new-eq-type')?.value;
      const min = parseFloat(container.querySelector('#new-eq-min')?.value);
      const max = parseFloat(container.querySelector('#new-eq-max')?.value);
      const zone = container.querySelector('#new-eq-zone')?.value.trim() || 'Cuisine';

      if (!name || isNaN(min) || isNaN(max)) {
        DOMUtils.showToast('⚠️ Veuillez renseigner le nom et les seuils de température.');
        return;
      }

      let icon = '🥩';
      if (min < 0) icon = '❄️';
      else if (min >= 60) icon = '🔥';
      else if (type === 'frais-legumes') icon = '🥬';

      const newEq = {
        id: `eq-${Date.now()}`,
        name,
        type: min < 0 ? 'surgele' : (min >= 60 ? 'chaud' : 'frais'),
        min,
        max,
        zone,
        icon
      };

      state.equipments.push(newEq);
      this.showAddEquipmentModal = false;
      onUpdate();
      DOMUtils.showToast(`✅ Enceinte "${name}" ajoutée.`);
      this.reRender(container, state, onUpdate);
    });

    // Suppression d'une enceinte
    container.querySelectorAll('.btn-delete-eq').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eqId = btn.dataset.eqId;
        const eq = state.equipments.find(x => x.id === eqId);
        if (confirm(`Confirmer la suppression de l'équipement "${eq ? eq.name : ''}" ?`)) {
          state.equipments = state.equipments.filter(x => x.id !== eqId);
          onUpdate();
          DOMUtils.showToast('🗑️ Équipement retiré.');
          this.reRender(container, state, onUpdate);
        }
      });
    });

    // Gestion interactive des inputs de température
    container.querySelectorAll('.input-temp-val').forEach(input => {
      const eqId = input.dataset.eqId;
      const min = parseFloat(input.dataset.min);
      const max = parseFloat(input.dataset.max);
      const drawer = container.querySelector(`#corrective-drawer-${eqId}`);
      const customSelect = container.querySelector(`#corrective-select-${eqId}`);
      const customText = container.querySelector(`#corrective-custom-${eqId}`);

      customSelect?.addEventListener('change', () => {
        if (customSelect.value === 'autre') {
          customText.style.display = 'block';
          customText.focus();
        } else {
          customText.style.display = 'none';
        }
      });

      input.addEventListener('input', () => {
        const val = parseFloat(input.value.replace(',', '.'));
        if (isNaN(val)) {
          input.classList.remove('is-invalid');
          if (drawer) drawer.style.display = 'none';
          return;
        }

        const isOk = val >= min && val <= max;
        if (!isOk) {
          input.classList.add('is-invalid');
          if (drawer) drawer.style.display = 'block';
        } else {
          input.classList.remove('is-invalid');
          if (drawer) drawer.style.display = 'none';
        }
      });
    });

    // Validation d'un relevé thermique
    container.querySelectorAll('.btn-save-temp').forEach(btn => {
      btn.addEventListener('click', () => {
        const eqId = btn.dataset.eqId;
        const eq = state.equipments.find(x => x.id === eqId);
        if (!eq) return;

        const input = container.querySelector(`#input-temp-${eqId}`);
        const val = parseFloat(input.value.replace(',', '.'));

        if (isNaN(val)) {
          DOMUtils.showToast('⚠️ Saisissez une température valide.');
          input.focus();
          return;
        }

        const isOk = val >= eq.min && val <= eq.max;
        const sel = container.querySelector(`#corrective-select-${eqId}`);
        const customTxt = container.querySelector(`#corrective-custom-${eqId}`);
        let correctiveAction = '';

        if (!isOk) {
          correctiveAction = sel?.value;
          if (correctiveAction === 'autre') {
            correctiveAction = customTxt?.value.trim();
          }
          if (!correctiveAction) {
            DOMUtils.showToast('⚠️ Action corrective OBLIGATOIRE en cas de dépassement !');
            sel?.focus();
            return;
          }
        }

        // Création du log
        const logEntry = {
          id: Date.now(),
          type: 'temp',
          equipmentId: eq.id,
          equipmentName: eq.name,
          value: val,
          period: this.selectedPeriod,
          min: eq.min,
          max: eq.max,
          ok: isOk,
          correctiveAction: isOk ? '' : correctiveAction,
          user: activeUser,
          date: today,
          time: DateUtils.getNowTime()
        };

        state.logs.push(logEntry);
        onUpdate();

        if (isOk) {
          DOMUtils.showToast(`✅ Relevé conforme : ${eq.name} (${val}°C)`);
        } else {
          DOMUtils.showToast(`⚠️ Anomalie enregistrée avec action corrective : ${correctiveAction}`);
        }

        this.reRender(container, state, onUpdate);
      });
    });

    // Suppression d'un relevé d'historique
    container.querySelectorAll('.btn-delete-log').forEach(btn => {
      btn.addEventListener('click', () => {
        const logId = Number(btn.dataset.logId);
        if (confirm('Voulez-vous annuler ce relevé ?')) {
          state.logs = state.logs.filter(l => l.id !== logId);
          onUpdate();
          DOMUtils.showToast('Relevé annulé.');
          this.reRender(container, state, onUpdate);
        }
      });
    });
  },

  bindCoolingEvents(container, state, onUpdate, today, activeUser) {
    // Toggle saisie manuelle a posteriori
    container.querySelector('#btn-toggle-manual-cooling')?.addEventListener('click', () => {
      this.showManualCoolingModal = !this.showManualCoolingModal;
      this.reRender(container, state, onUpdate);
    });

    container.querySelector('#btn-cancel-manual-cooling')?.addEventListener('click', () => {
      this.showManualCoolingModal = false;
      this.reRender(container, state, onUpdate);
    });

    // Démarrer un cycle interactif en direct
    container.querySelector('#btn-start-cooling-cycle')?.addEventListener('click', () => {
      const dishName = container.querySelector('#cooling-new-dish')?.value.trim();
      const startTemp = parseFloat(container.querySelector('#cooling-new-temp')?.value);
      const startTime = container.querySelector('#cooling-new-time')?.value || DateUtils.getNowTime();
      const quantity = container.querySelector('#cooling-new-qty')?.value.trim() || '';

      if (!dishName || isNaN(startTemp)) {
        DOMUtils.showToast('⚠️ Renseignez le nom du plat et sa température de début.');
        return;
      }

      if (startTemp < 60) {
        if (!confirm('Attention : la température initiale est inférieure à 60°C. Confirmer le lancement ?')) {
          return;
        }
      }

      const newCycle = {
        id: `cool-${Date.now()}`,
        dishName,
        startTemp,
        startTime,
        quantity,
        date: today,
        user: activeUser,
        endTime: null,
        endTemp: null,
        durationMinutes: null,
        ok: null,
        correctiveAction: ''
      };

      if (!state.coolingCycles) state.coolingCycles = [];
      state.coolingCycles.push(newCycle);
      onUpdate();
      DOMUtils.showToast(`❄️ Refroidissement lancé pour "${dishName}". Chronomètre actif !`);
      this.reRender(container, state, onUpdate);
    });

    // Surveillance interactive du formulaire de fin de cycle
    const finishTempInput = container.querySelector('#cooling-finish-temp');
    const finishDrawer = container.querySelector('#cooling-corrective-drawer');
    const finishActionSel = container.querySelector('#cooling-corrective-select');

    finishTempInput?.addEventListener('input', () => {
      const endVal = parseFloat(finishTempInput.value.replace(',', '.'));
      const activeCycle = (state.coolingCycles || []).find(c => !c.endTime);
      if (!activeCycle || isNaN(endVal)) {
        if (finishDrawer) finishDrawer.style.display = 'none';
        return;
      }
      const dur = DateUtils.diffMinutes(activeCycle.startTime, DateUtils.getNowTime());
      const isConform = endVal <= 10 && dur <= 120;
      if (!isConform) {
        if (finishDrawer) finishDrawer.style.display = 'block';
      } else {
        if (finishDrawer) finishDrawer.style.display = 'none';
      }
    });

    // Terminer et valider le cycle actif
    container.querySelector('#btn-finish-cooling-cycle')?.addEventListener('click', () => {
      const activeCycle = (state.coolingCycles || []).find(c => !c.endTime);
      if (!activeCycle) return;

      const endTemp = parseFloat(finishTempInput?.value.replace(',', '.'));
      const endTime = container.querySelector('#cooling-finish-time')?.value || DateUtils.getNowTime();

      if (isNaN(endTemp)) {
        DOMUtils.showToast('⚠️ Saisissez la température finale constatée en sortie de cellule.');
        finishTempInput?.focus();
        return;
      }

      const durationMinutes = DateUtils.diffMinutes(activeCycle.startTime, endTime);
      const isOk = endTemp <= 10 && durationMinutes <= 120;
      let correctiveAction = '';

      if (!isOk) {
        correctiveAction = finishActionSel?.value;
        if (!correctiveAction) {
          DOMUtils.showToast('⚠️ Action corrective OBLIGATOIRE (Durée > 2h ou T° > 10°C) !');
          if (finishDrawer) finishDrawer.style.display = 'block';
          finishActionSel?.focus();
          return;
        }
      }

      // Mise à jour de l'objet cycle
      activeCycle.endTime = endTime;
      activeCycle.endTemp = endTemp;
      activeCycle.durationMinutes = durationMinutes;
      activeCycle.ok = isOk;
      activeCycle.correctiveAction = correctiveAction;

      // Ajout au journal global inaltérable
      state.logs.push({
        id: Date.now(),
        type: 'cooling',
        dishName: activeCycle.dishName,
        startTemp: activeCycle.startTemp,
        startTime: activeCycle.startTime,
        endTemp,
        endTime,
        durationMinutes,
        ok: isOk,
        correctiveAction,
        date: today,
        time: endTime,
        user: activeUser
      });

      onUpdate();

      if (isOk) {
        DOMUtils.showToast(`✅ Cycle validé : ${activeCycle.dishName} refroidi en ${durationMinutes} min (≤ 10°C).`);
      } else {
        DOMUtils.showToast(`⚠️ Cycle non-conforme consigné avec action : ${correctiveAction}`);
      }

      this.reRender(container, state, onUpdate);
    });

    // Annuler le cycle en cours
    container.querySelector('#btn-cancel-cooling-cycle')?.addEventListener('click', () => {
      if (confirm('Voulez-vous vraiment annuler et supprimer ce cycle en cours ?')) {
        state.coolingCycles = (state.coolingCycles || []).filter(c => c.endTime);
        onUpdate();
        DOMUtils.showToast('Cycle en cours annulé.');
        this.reRender(container, state, onUpdate);
      }
    });

    // Enregistrement manuel a posteriori
    container.querySelector('#btn-save-manual-cooling')?.addEventListener('click', () => {
      const dishName = container.querySelector('#manual-cooling-dish')?.value.trim();
      const qty = container.querySelector('#manual-cooling-qty')?.value.trim();
      const startTemp = parseFloat(container.querySelector('#manual-cooling-start-temp')?.value);
      const startTime = container.querySelector('#manual-cooling-start-time')?.value;
      const endTemp = parseFloat(container.querySelector('#manual-cooling-end-temp')?.value);
      const endTime = container.querySelector('#manual-cooling-end-time')?.value;
      const correctiveAction = container.querySelector('#manual-cooling-action')?.value;

      if (!dishName || isNaN(startTemp) || isNaN(endTemp) || !startTime || !endTime) {
        DOMUtils.showToast('⚠️ Veuillez renseigner tous les champs obligatoires.');
        return;
      }

      const durationMinutes = DateUtils.diffMinutes(startTime, endTime);
      const isOk = endTemp <= 10 && durationMinutes <= 120;

      if (!isOk && !correctiveAction) {
        DOMUtils.showToast('⚠️ Ce cycle dépasse les seuils : action corrective obligatoire !');
        return;
      }

      const cycle = {
        id: `cool-${Date.now()}`,
        dishName,
        quantity: qty,
        startTemp,
        startTime,
        endTemp,
        endTime,
        durationMinutes,
        ok: isOk,
        correctiveAction: isOk ? '' : correctiveAction,
        date: today,
        user: activeUser
      };

      if (!state.coolingCycles) state.coolingCycles = [];
      state.coolingCycles.push(cycle);

      state.logs.push({
        id: Date.now(),
        type: 'cooling',
        dishName,
        startTemp,
        startTime,
        endTemp,
        endTime,
        durationMinutes,
        ok: isOk,
        correctiveAction: isOk ? '' : correctiveAction,
        date: today,
        time: endTime,
        user: activeUser
      });

      this.showManualCoolingModal = false;
      onUpdate();
      DOMUtils.showToast(`✅ Cycle de refroidissement consigné (${durationMinutes} min).`);
      this.reRender(container, state, onUpdate);
    });

    // Suppression d'un cycle archivé
    container.querySelectorAll('.btn-delete-cooling').forEach(btn => {
      btn.addEventListener('click', () => {
        const cycleId = btn.dataset.cycleId;
        if (confirm('Supprimer ce cycle de l\'historique ?')) {
          state.coolingCycles = (state.coolingCycles || []).filter(c => c.id !== cycleId);
          onUpdate();
          DOMUtils.showToast('Cycle supprimé.');
          this.reRender(container, state, onUpdate);
        }
      });
    });
  },

  bindCookingEvents(container, state, onUpdate, today, activeUser) {
    const typeSelect = container.querySelector('#cook-op-type');
    const tempInput = container.querySelector('#cook-temp');
    const durationGroup = container.querySelector('#cook-duration-group');
    const correctiveDrawer = container.querySelector('#cook-corrective-drawer');
    const correctiveSelect = container.querySelector('#cook-corrective-select');

    typeSelect?.addEventListener('change', () => {
      if (typeSelect.value === 'remise') {
        durationGroup.style.display = 'block';
      } else {
        durationGroup.style.display = 'none';
      }
      checkCookingCompliance();
    });

    const checkCookingCompliance = () => {
      const op = typeSelect?.value;
      const t = parseFloat(tempInput?.value.replace(',', '.'));
      if (isNaN(t)) {
        if (correctiveDrawer) correctiveDrawer.style.display = 'none';
        return;
      }

      let isOk = true;
      if (op === 'cuisson' || op === 'chaud') {
        isOk = t >= 63;
      } else if (op === 'remise') {
        const dur = parseFloat(container.querySelector('#cook-duration')?.value) || 0;
        isOk = t >= 63 && dur <= 60;
      } else if (op === 'decongel') {
        isOk = t <= 4;
      }

      if (!isOk) {
        if (correctiveDrawer) correctiveDrawer.style.display = 'block';
      } else {
        if (correctiveDrawer) correctiveDrawer.style.display = 'none';
      }
    };

    tempInput?.addEventListener('input', checkCookingCompliance);
    container.querySelector('#cook-duration')?.addEventListener('input', checkCookingCompliance);

    // Enregistrement du contrôle de production
    container.querySelector('#btn-save-cooking-check')?.addEventListener('click', () => {
      const type = typeSelect?.value;
      const dishName = container.querySelector('#cook-dish-name')?.value.trim();
      const temp = parseFloat(tempInput?.value.replace(',', '.'));
      const duration = parseFloat(container.querySelector('#cook-duration')?.value) || null;
      const time = container.querySelector('#cook-time')?.value || DateUtils.getNowTime();

      if (!dishName || isNaN(temp)) {
        DOMUtils.showToast('⚠️ Indiquez le nom du plat et la température mesurée.');
        return;
      }

      let isOk = true;
      if (type === 'cuisson' || type === 'chaud') {
        isOk = temp >= 63;
      } else if (type === 'remise') {
        isOk = temp >= 63 && (!duration || duration <= 60);
      } else if (type === 'decongel') {
        isOk = temp <= 4;
      }

      let correctiveAction = '';
      if (!isOk) {
        correctiveAction = correctiveSelect?.value;
        if (!correctiveAction) {
          DOMUtils.showToast('⚠️ Température non conforme : action corrective obligatoire !');
          correctiveSelect?.focus();
          return;
        }
      }

      const checkEntry = {
        id: `cook-${Date.now()}`,
        type,
        dishName,
        temp,
        durationMinutes: duration,
        time,
        date: today,
        ok: isOk,
        correctiveAction: isOk ? '' : correctiveAction,
        user: activeUser
      };

      if (!state.cookingCycles) state.cookingCycles = [];
      state.cookingCycles.push(checkEntry);

      state.logs.push({
        id: Date.now(),
        type: 'cooking',
        opType: type,
        dishName,
        temp,
        durationMinutes: duration,
        ok: isOk,
        correctiveAction: isOk ? '' : correctiveAction,
        date: today,
        time,
        user: activeUser
      });

      onUpdate();
      DOMUtils.showToast(`✅ Contrôle consigné pour "${dishName}" (${temp}°C).`);
      this.reRender(container, state, onUpdate);
    });

    // Suppression d'un contrôle de cuisson
    container.querySelectorAll('.btn-delete-cooking').forEach(btn => {
      btn.addEventListener('click', () => {
        const cookId = btn.dataset.cookId;
        if (confirm('Supprimer ce contrôle de l\'historique ?')) {
          state.cookingCycles = (state.cookingCycles || []).filter(c => c.id !== cookId);
          onUpdate();
          DOMUtils.showToast('Enregistrement supprimé.');
          this.reRender(container, state, onUpdate);
        }
      });
    });
  },

  bindFryerEvents(container, state, onUpdate, today, activeUser) {
    const ttcpInput = container.querySelector('#fryer-ttcp-input');
    const gaugeFill = container.querySelector('#fryer-gauge-fill');
    const statusText = container.querySelector('#fryer-status-text');
    const decisionSelect = container.querySelector('#fryer-decision');
    const wasteGroup = container.querySelector('#fryer-waste-group');

    decisionSelect?.addEventListener('change', () => {
      if (decisionSelect.value === 'changed') {
        wasteGroup.style.display = 'block';
      } else {
        wasteGroup.style.display = 'none';
      }
    });

    ttcpInput?.addEventListener('input', () => {
      const val = parseFloat(ttcpInput.value.replace(',', '.'));
      if (isNaN(val)) {
        gaugeFill.style.width = '0%';
        statusText.textContent = 'Saisissez le résultat du testeur';
        statusText.style.color = 'var(--text-main)';
        return;
      }

      const percent = Math.min(100, (val / 30) * 100);
      gaugeFill.style.width = `${percent}%`;

      if (val < 19) {
        gaugeFill.style.backgroundColor = 'var(--color-success)';
        statusText.textContent = `🟢 ${val}% TTCP : Huile neuve et optimale`;
        statusText.style.color = 'var(--color-success)';
      } else if (val < 24) {
        gaugeFill.style.backgroundColor = 'var(--color-warning)';
        statusText.textContent = `🟠 ${val}% TTCP : Huile usagée, seuil proche (surveillance renforcée)`;
        statusText.style.color = 'var(--color-warning)';
      } else {
        gaugeFill.style.backgroundColor = 'var(--color-danger)';
        statusText.textContent = `🔴 ${val}% TTCP : SEUIL CRITIQUE DÉPASSÉ (≥ 24%) ! VIDANGE IMMÉDIATE OBLIGATOIRE`;
        statusText.style.color = 'var(--color-danger)';
        if (decisionSelect) {
          decisionSelect.value = 'changed';
          wasteGroup.style.display = 'block';
        }
      }
    });

    // Toggle ajout friteuse
    container.querySelector('#btn-toggle-add-fryer')?.addEventListener('click', () => {
      this.showAddFryerModal = !this.showAddFryerModal;
      this.reRender(container, state, onUpdate);
    });

    container.querySelector('#btn-cancel-new-fryer')?.addEventListener('click', () => {
      this.showAddFryerModal = false;
      this.reRender(container, state, onUpdate);
    });

    // Enregistrement nouvelle friteuse
    container.querySelector('#btn-save-new-fryer')?.addEventListener('click', () => {
      const name = container.querySelector('#new-fryer-name')?.value.trim();
      const oil = container.querySelector('#new-fryer-oil')?.value.trim() || 'Huile de friture';

      if (!name) {
        DOMUtils.showToast('⚠️ Précisez le nom de la friteuse.');
        return;
      }

      if (!state.fryers) state.fryers = [];
      state.fryers.push({
        id: `fry-${Date.now()}`,
        name,
        oilType: oil,
        maxTTCP: 24
      });

      this.showAddFryerModal = false;
      onUpdate();
      DOMUtils.showToast(`✅ Friteuse "${name}" ajoutée.`);
      this.reRender(container, state, onUpdate);
    });

    // Enregistrer un test d'huile
    container.querySelector('#btn-save-fryer-check')?.addEventListener('click', () => {
      const fryerId = container.querySelector('#fryer-select')?.value;
      const fryer = (state.fryers || []).find(f => f.id === fryerId);
      const ttcp = parseFloat(ttcpInput?.value.replace(',', '.'));
      const decision = decisionSelect?.value;
      const wasteLiters = parseFloat(container.querySelector('#fryer-waste-liters')?.value) || 0;

      if (!fryer || isNaN(ttcp)) {
        DOMUtils.showToast('⚠️ Saisissez le résultat de la mesure TTCP.');
        ttcpInput?.focus();
        return;
      }

      if (ttcp >= 24 && decision !== 'changed') {
        DOMUtils.showToast('⚠️ Teneur ≥ 24% : interdiction de maintenir l\'huile en service !');
        decisionSelect.value = 'changed';
        wasteGroup.style.display = 'block';
        return;
      }

      const checkEntry = {
        id: `frycheck-${Date.now()}`,
        fryerId: fryer.id,
        fryerName: fryer.name,
        ttcpValue: ttcp,
        decision,
        wasteLiters,
        date: today,
        time: DateUtils.getNowTime(),
        user: activeUser
      };

      if (!state.fryerChecks) state.fryerChecks = [];
      state.fryerChecks.push(checkEntry);

      state.logs.push({
        id: Date.now(),
        type: 'fryer',
        fryerName: fryer.name,
        value: `${ttcp}% TTCP`,
        ok: ttcp < 24,
        decision,
        wasteLiters,
        date: today,
        time: DateUtils.getNowTime(),
        user: activeUser
      });

      onUpdate();
      DOMUtils.showToast(`✅ Contrôle d'huile enregistré : ${fryer.name} (${ttcp}% TTCP).`);
      this.reRender(container, state, onUpdate);
    });

    // Suppression d'un test d'huile
    container.querySelectorAll('.btn-delete-fryer-check').forEach(btn => {
      btn.addEventListener('click', () => {
        const checkId = btn.dataset.checkId;
        if (confirm('Supprimer ce test de l\'historique ?')) {
          state.fryerChecks = (state.fryerChecks || []).filter(c => c.id !== checkId);
          onUpdate();
          DOMUtils.showToast('Test supprimé.');
          this.reRender(container, state, onUpdate);
        }
      });
    });
  },

  reRender(container, state, onUpdate) {
    container.innerHTML = this.render(state);
    this.bindEvents(container, state, onUpdate);
  }
};
