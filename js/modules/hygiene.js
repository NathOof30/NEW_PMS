/**
 * Module : Pilier 1 — Bonnes Pratiques d'Hygiène (BPH) & Plan de Nettoyage (PND)
 * 100% Fonctionnel, autonome et conforme au Paquet Hygiène européen
 */

import { DateUtils } from '../utils/dates.js';
import { DOMUtils } from '../utils/dom.js';

export const HygieneModule = {
  activeSubTab: 'pnd', // 'pnd' | 'personnel' | 'pest' | 'calibration'
  pndFilter: 'all',    // 'all' | 'Ouverture' | 'Service' | 'Fermeture' | 'Hebdo' | 'Mensuel'
  expandedProtocols: new Set(),
  showAddTaskModal: false,

  render(state) {
    const today = DateUtils.getTodayISO();
    const activeUser = state.activeUser || state.team[0] || 'Opérateur';

    return `
      <section class="module-hygiene">
        <header style="margin-bottom: var(--space-md);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <h1 style="font-size: 1.4rem;">🧽 Pilier 1 : Bonnes Pratiques d'Hygiène</h1>
              <p class="form-label">Plan de nettoyage, hygiène du personnel, lutte nuisibles et maintenance.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-info">👤 ${DOMUtils.escapeHTML(activeUser)}</span>
            </div>
          </div>
        </header>

        <!-- Navigation secondaire du Pilier 1 -->
        <nav class="subnav-tabs">
          <button class="subnav-btn ${this.activeSubTab === 'pnd' ? 'active' : ''}" data-subtab="pnd">
            🧽 Plan Nettoyage (PND)
          </button>
          <button class="subnav-btn ${this.activeSubTab === 'personnel' ? 'active' : ''}" data-subtab="personnel">
            🧑‍🍳 Hygiène & Santé
          </button>
          <button class="subnav-btn ${this.activeSubTab === 'pest' ? 'active' : ''}" data-subtab="pest">
            🐀 Nuisibles & Déchets
          </button>
          <button class="subnav-btn ${this.activeSubTab === 'calibration' ? 'active' : ''}" data-subtab="calibration">
            🛠️ Étalonnage & Matériel
          </button>
        </nav>

        <!-- Contenu de la sous-vue active -->
        <div id="hygiene-subcontent">
          ${this.renderSubTabContent(state, today)}
        </div>
      </section>
    `;
  },

  renderSubTabContent(state, today) {
    switch (this.activeSubTab) {
      case 'pnd':
        return this.renderPNDSection(state, today);
      case 'personnel':
        return this.renderPersonnelSection(state, today);
      case 'pest':
        return this.renderPestSection(state, today);
      case 'calibration':
        return this.renderCalibrationSection(state, today);
      default:
        return this.renderPNDSection(state, today);
    }
  },

  /* ==========================================================================
     SOUS-ONGLET 1 : PLAN DE NETTOYAGE ET DÉSINFECTION (PND)
     ========================================================================== */
  renderPNDSection(state, today) {
    const tasks = state.cleaningTasks || [];
    const logs = state.logs || [];

    // Tâches filtrées
    const filteredTasks = this.pndFilter === 'all' 
      ? tasks 
      : tasks.filter(t => t.period === this.pndFilter);

    // Comptage journalier
    const dailyTasks = tasks.filter(t => t.frequency === 'daily');
    const completedDaily = dailyTasks.filter(task => {
      return logs.some(l => l.type === 'clean' && l.taskId === task.id && l.date === today);
    });
    const percentDone = dailyTasks.length ? Math.round((completedDaily.length / dailyTasks.length) * 100) : 0;

    return `
      <!-- Synthèse d'avancement PND -->
      <div class="card" style="border-left: 4px solid var(--color-primary);">
        <div class="card-title">
          <span>Progression du nettoyage aujourd'hui (${DateUtils.getTodayISO()})</span>
          <span class="badge ${percentDone === 100 ? 'badge-success' : 'badge-warning'}">${percentDone}% validé</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${percentDone}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          <span>${completedDaily.length} / ${dailyTasks.length} tâches quotidiennes émargées</span>
          <button class="btn btn-secondary btn-sm" id="btn-toggle-add-task">
            + Ajouter une tâche PND
          </button>
        </div>
      </div>

      <!-- Filtres par période / fréquence -->
      <div class="filter-chips">
        <button class="chip-btn ${this.pndFilter === 'all' ? 'active' : ''}" data-filter="all">Tous (${tasks.length})</button>
        <button class="chip-btn ${this.pndFilter === 'Ouverture' ? 'active' : ''}" data-filter="Ouverture">☀️ Ouverture</button>
        <button class="chip-btn ${this.pndFilter === 'Service' ? 'active' : ''}" data-filter="Service">⚡ En Service</button>
        <button class="chip-btn ${this.pndFilter === 'Fermeture' ? 'active' : ''}" data-filter="Fermeture">🌙 Fermeture</button>
        <button class="chip-btn ${this.pndFilter === 'Hebdo' ? 'active' : ''}" data-filter="Hebdo">📅 Hebdo</button>
        <button class="chip-btn ${this.pndFilter === 'Mensuel' ? 'active' : ''}" data-filter="Mensuel">🗓️ Mensuel</button>
      </div>

      <!-- Formulaire d'ajout d'une tâche PND personnalisée (100% Éditable) -->
      ${this.showAddTaskModal ? `
        <div class="card" style="border: 2px dashed var(--color-primary); background: var(--bg-surface);">
          <div class="card-title">➕ Nouvelle tâche au Plan de Nettoyage</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Intitulé de la tâche *</label>
              <input type="text" id="new-task-name" class="form-input" placeholder="Ex: Détartrage machine à glaçons">
            </div>
            <div class="form-group">
              <label class="form-label">Zone / Équipement *</label>
              <input type="text" id="new-task-zone" class="form-input" placeholder="Ex: Plonge, Pianos...">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fréquence / Moment *</label>
              <select id="new-task-period" class="form-select">
                <option value="Ouverture">☀️ Ouverture (Quotidien)</option>
                <option value="Service">⚡ En cours de service (Quotidien)</option>
                <option value="Fermeture">🌙 Fermeture (Quotidien)</option>
                <option value="Hebdo">📅 Hebdomadaire</option>
                <option value="Mensuel">🗓️ Mensuel</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Produit préconisé</label>
              <input type="text" id="new-task-product" class="form-input" placeholder="Ex: Détergent désinfectant contact alimentaire">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Dosage & Temps d'action</label>
              <input type="text" id="new-task-dosage" class="form-input" placeholder="Ex: Solution à 2%, laisser agir 5 min">
            </div>
            <div class="form-group">
              <label class="form-label">Mode opératoire</label>
              <input type="text" id="new-task-method" class="form-input" placeholder="Ex: Pulvériser, brosser, rincer à l'eau claire">
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <button class="btn btn-primary" id="btn-save-new-task">Enregistrer la tâche</button>
            <button class="btn btn-secondary" id="btn-cancel-new-task">Annuler</button>
          </div>
        </div>
      ` : ''}

      <!-- Liste interactive des tâches PND -->
      <div class="pnd-tasks-list">
        ${filteredTasks.map(task => {
          // Vérification si émargé aujourd'hui
          const logEntry = logs.find(l => l.type === 'clean' && l.taskId === task.id && l.date === today);
          const isDone = Boolean(logEntry);
          const isExpanded = this.expandedProtocols.has(task.id);

          return `
            <div class="pnd-item-card ${isDone ? 'is-done' : ''}" data-task-id="${task.id}">
              <div class="pnd-item-header">
                <input 
                  type="checkbox" 
                  class="pnd-checkbox" 
                  data-task-id="${task.id}" 
                  ${isDone ? 'checked' : ''}
                >
                <div class="pnd-content">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div>
                      <span class="pnd-title">${DOMUtils.escapeHTML(task.name)}</span>
                      <div class="pnd-meta">
                        <span class="badge ${task.period === 'Ouverture' ? 'badge-warning' : (task.period === 'Fermeture' ? 'badge-info' : 'badge-secondary')}">
                          ${DOMUtils.escapeHTML(task.period)}
                        </span>
                        <span>📍 ${DOMUtils.escapeHTML(task.zone || 'Général')}</span>
                        ${isDone ? `
                          <span style="color: var(--color-success); font-weight: 600;">
                            ✓ Fait à ${logEntry.time} par <strong>${DOMUtils.escapeHTML(logEntry.user)}</strong>
                          </span>
                        ` : '<span style="color: var(--text-muted);">En attente de réalisation</span>'}
                      </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm btn-protocol-toggle" data-task-id="${task.id}">
                        ${isExpanded ? '▲ Fiche' : 'ℹ️ Fiche réflexe'}
                      </button>
                      <button class="btn btn-secondary btn-sm btn-delete-task" data-task-id="${task.id}" title="Supprimer cette tâche" style="color: var(--color-danger);">
                        ✕
                      </button>
                    </div>
                  </div>

                  <!-- Fiche réflexe dépliable du protocole -->
                  ${isExpanded ? `
                    <div class="pnd-protocol-drawer">
                      <div class="protocol-grid">
                        <div class="protocol-col">
                          <strong>PRODUIT HOMOLOGUÉ :</strong>
                          ${DOMUtils.escapeHTML(task.product || 'Produit homologué contact alimentaire')}
                        </div>
                        <div class="protocol-col">
                          <strong>DOSAGE & DILUTION :</strong>
                          ${DOMUtils.escapeHTML(task.dosage || 'Conforme étiquette fabricant')}
                        </div>
                        <div class="protocol-col">
                          <strong>MODE OPÉRATOIRE :</strong>
                          ${DOMUtils.escapeHTML(task.method || 'Appliquer, temps de contact, rincer abondamment')}
                        </div>
                        <div class="protocol-col">
                          <strong>RESPONSABLE :</strong>
                          ${DOMUtils.escapeHTML(task.responsible || 'Tout le personnel')}
                        </div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /* ==========================================================================
     SOUS-ONGLET 2 : HYGIÈNE DU PERSONNEL & SANTÉ QUOTIDIENNE
     ========================================================================== */
  renderPersonnelSection(state, today) {
    const activeUser = state.activeUser || state.team[0] || 'Opérateur';
    const healthChecks = state.healthChecks || [];
    const myCheckToday = healthChecks.find(h => h.date === today && h.user === activeUser);

    return `
      <div class="card">
        <div class="card-title">
          <span>🧑‍🍳 Déclaration d'Aptitude & Hygiène Prise de Poste</span>
          <span class="badge ${myCheckToday ? 'badge-success' : 'badge-warning'}">
            ${myCheckToday ? 'Signé aujourd\'hui' : 'À valider'}
          </span>
        </div>
        <p class="form-label">
          Réglementation CE n° 852/2004 : Chaque équipier manipulant des denrées doit attester de son bon état de santé et de sa tenue avant d'entrer en zone de production.
        </p>

        <div style="background: var(--bg-body); padding: 12px; border-radius: var(--radius-sm); margin: 12px 0;">
          <strong style="display: block; margin-bottom: 8px;">Engagements obligatoires à la prise de poste :</strong>
          <ul style="padding-left: 20px; font-size: 0.85rem; line-height: 1.6;">
            <li>✅ Tenue de travail propre et distincte de la tenue de ville (vestiaire à double compartiment).</li>
            <li>✅ Cheveux attachés et couverts (charlotte ou coiffe).</li>
            <li>✅ Mains soignées, ongles courts, sans vernis, ni faux-ongles, aucun bijou ni montre.</li>
            <li>✅ Lavage et désinfection rigoureuse des mains au lave-mains à commande non manuelle.</li>
            <li>⚠️ <strong>Déclaration de santé :</strong> Absence de gastro-entérite, vomissements, fièvre ou lésions cutanées infectées non protégées par un pansement étanche.</li>
          </ul>
        </div>

        ${myCheckToday ? `
          <div style="background: var(--color-success-bg); color: var(--color-success); padding: 12px; border-radius: var(--radius-sm); font-size: 0.9rem;">
            ✓ <strong>Attestation validée pour aujourd'hui</strong> par <strong>${DOMUtils.escapeHTML(myCheckToday.user)}</strong> à ${myCheckToday.time}.
          </div>
        ` : `
          <button class="btn btn-primary" id="btn-sign-health" style="width: 100%; padding: 12px;">
            ✍️ Je signe mon attestation de prise de poste (${DOMUtils.escapeHTML(activeUser)})
          </button>
        `}
      </div>

      <!-- Historique des déclarations du jour -->
      <div class="card">
        <div class="card-title">Registre d'émargement du personnel (Aujourd'hui)</div>
        ${healthChecks.filter(h => h.date === today).length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted);">Aucune déclaration signée pour le moment aujourd'hui.</p>
        ` : `
          <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                <th style="padding: 6px;">Heure</th>
                <th style="padding: 6px;">Équipier</th>
                <th style="padding: 6px;">Statut</th>
                <th style="padding: 6px;">Conformité</th>
              </tr>
            </thead>
            <tbody>
              ${healthChecks.filter(h => h.date === today).map(h => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 6px;">${h.time}</td>
                  <td style="padding: 6px;"><strong>${DOMUtils.escapeHTML(h.user)}</strong></td>
                  <td style="padding: 6px;">Tenue & Santé validées</td>
                  <td style="padding: 6px;"><span class="badge badge-success">Conforme</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },

  /* ==========================================================================
     SOUS-ONGLET 3 : LUTTE CONTRE LES NUISIBLES & DÉCHETS
     ========================================================================== */
  renderPestSection(state, today) {
    const pestControls = state.pestControls || [];

    return `
      <div class="card">
        <div class="card-title">🐀 Contrôle Périodique Anti-Nuisibles & Déchets</div>
        <p class="form-label">
          Vérification d'absence de bioagresseurs (rongeurs, insectes rampants/volants) et respect des protocoles d'évacuation des déchets.
        </p>

        <div class="form-row" style="margin-top: 12px;">
          <div class="form-group">
            <label class="form-label">Type d'événement</label>
            <select id="pest-type" class="form-select">
              <option value="internal">Inspection interne (Pièges & Locaux)</option>
              <option value="provider">Passage Entreprise 3D Spécialisée</option>
              <option value="waste">Nettoyage & Désinfection Local Poubelles</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Constat / État des lieux</label>
            <select id="pest-result" class="form-select">
              <option value="ok">Conforme — Aucune trace ni présence de nuisibles</option>
              <option value="ko">Anomalie — Trace détectée (Action immédiate requise)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observations / Détails (Postes d'appâtage, Société intervenante...)</label>
          <input type="text" id="pest-notes" class="form-input" placeholder="Ex: Tous les pièges intacts, sacs déchets évacués, conteneurs lavés">
        </div>

        <button class="btn btn-primary" id="btn-save-pest">Enregistrer le contrôle</button>
      </div>

      <!-- Historique des contrôles nuisibles -->
      <div class="card">
        <div class="card-title">Registre des contrôles Nuisibles & Déchets</div>
        ${pestControls.length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted);">Aucun enregistrement enregistré pour l'instant.</p>
        ` : `
          <div style="overflow-x: auto;">
            <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
              <thead>
                <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                  <th style="padding: 6px;">Date</th>
                  <th style="padding: 6px;">Type</th>
                  <th style="padding: 6px;">Constat</th>
                  <th style="padding: 6px;">Observations</th>
                  <th style="padding: 6px;">Opérateur</th>
                </tr>
              </thead>
              <tbody>
                ${pestControls.slice(-8).reverse().map(p => `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 6px;">${p.date}</td>
                    <td style="padding: 6px;"><strong>${p.type === 'provider' ? '🏢 Prestataire 3D' : (p.type === 'waste' ? '🗑️ Poubelles' : '🔍 Interne')}</strong></td>
                    <td style="padding: 6px;">
                      <span class="badge ${p.result === 'ok' ? 'badge-success' : 'badge-danger'}">
                        ${p.result === 'ok' ? 'Conforme' : 'Anomalie'}
                      </span>
                    </td>
                    <td style="padding: 6px;">${DOMUtils.escapeHTML(p.notes || '-')}</td>
                    <td style="padding: 6px;">${DOMUtils.escapeHTML(p.user)}</td>
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
     SOUS-ONGLET 4 : ÉTALONNAGE DES THERMOMÈTRES & MAINTENANCE
     ========================================================================== */
  renderCalibrationSection(state, today) {
    const calibrations = state.calibrations || [];

    return `
      <div class="card">
        <div class="card-title">🛠️ Étalonnage des Thermomètres & Sondes</div>
        <p class="form-label">
          Arrêté ministériel du 21 décembre 2009 : Pour garantir la fiabilité des relevés CCP, les thermomètres doivent être étalonnés régulièrement (test à 0°C dans de la glace fondante).
        </p>

        <div class="form-row" style="margin-top: 12px;">
          <div class="form-group">
            <label class="form-label">Thermomètre / Sonde testée</label>
            <input type="text" id="calib-device" class="form-input" placeholder="Ex: Sonde Testo Cuisson N°1">
          </div>
          <div class="form-group">
            <label class="form-label">Méthode de test</label>
            <select id="calib-method" class="form-select">
              <option value="ice">Glace fondante (Norme 0°C ± 1°C)</option>
              <option value="boil">Eau à ébullition (Norme 100°C ± 1°C)</option>
              <option value="standard">Comparaison avec thermomètre étalon</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Température mesurée (°C)</label>
            <input type="number" step="0.1" id="calib-val" class="form-input" placeholder="Ex: 0.3">
          </div>
          <div class="form-group">
            <label class="form-label">Écart constaté</label>
            <input type="text" id="calib-delta" class="form-input" placeholder="Ex: +0.3°C (Conforme)">
          </div>
        </div>

        <button class="btn btn-primary" id="btn-save-calib">Valider le contrôle d'étalonnage</button>
      </div>

      <!-- Historique des étalonnages -->
      <div class="card">
        <div class="card-title">Historique des étalonnages enregistrés</div>
        ${calibrations.length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted);">Aucun étalonnage récent consigné.</p>
        ` : `
          <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                <th style="padding: 6px;">Date</th>
                <th style="padding: 6px;">Appareil</th>
                <th style="padding: 6px;">Valeur</th>
                <th style="padding: 6px;">Statut</th>
                <th style="padding: 6px;">Opérateur</th>
              </tr>
            </thead>
            <tbody>
              ${calibrations.slice(-5).reverse().map(c => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 6px;">${c.date}</td>
                  <td style="padding: 6px;"><strong>${DOMUtils.escapeHTML(c.device)}</strong></td>
                  <td style="padding: 6px;">${c.val}°C</td>
                  <td style="padding: 6px;"><span class="badge badge-success">Validé</span></td>
                  <td style="padding: 6px;">${DOMUtils.escapeHTML(c.user)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },

  /* ==========================================================================
     BRANCHEMENT ÉVÉNEMENTIEL (BIND EVENTS)
     ========================================================================== */
  bindEvents(container, state, onUpdate) {
    const today = DateUtils.getTodayISO();
    const nowTime = DateUtils.getNowTime();
    const activeUser = state.activeUser || state.team[0] || 'Opérateur';

    // 1. Navigation entre les sous-onglets du Pilier 1
    container.querySelectorAll('.subnav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeSubTab = btn.dataset.subtab;
        this.refresh(container, state, onUpdate);
      });
    });

    // 2. Filtres PND (chips)
    container.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.pndFilter = btn.dataset.filter;
        this.refresh(container, state, onUpdate);
      });
    });

    // 3. Dépliage des fiches réflexes protocoles
    container.querySelectorAll('.btn-protocol-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        if (this.expandedProtocols.has(taskId)) {
          this.expandedProtocols.delete(taskId);
        } else {
          this.expandedProtocols.add(taskId);
        }
        this.refresh(container, state, onUpdate);
      });
    });

    // 4. Coche / Décoche d'une tâche PND avec émargement
    container.querySelectorAll('.pnd-checkbox').forEach(chk => {
      chk.addEventListener('change', () => {
        const taskId = chk.dataset.taskId;
        const task = (state.cleaningTasks || []).find(t => t.id === taskId);
        if (!task) return;

        const existingIndex = (state.logs || []).findIndex(
          l => l.type === 'clean' && l.taskId === taskId && l.date === today
        );

        if (chk.checked) {
          // Émargement numérique
          const newEntry = {
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            type: 'clean',
            taskId: task.id,
            taskName: task.name,
            period: task.period,
            date: today,
            time: nowTime,
            user: activeUser,
            status: 'ok'
          };
          state.logs.push(newEntry);
          DOMUtils.showToast(`✅ ${task.name} émargé par ${activeUser}`);
        } else {
          // Annulation
          if (existingIndex >= 0) {
            state.logs.splice(existingIndex, 1);
            DOMUtils.showToast(`Émargement annulé pour ${task.name}`);
          }
        }

        onUpdate();
        this.refresh(container, state, onUpdate);
      });
    });

    // 5. Bouton d'affichage du formulaire d'ajout de tâche
    const btnToggleAdd = container.querySelector('#btn-toggle-add-task');
    if (btnToggleAdd) {
      btnToggleAdd.addEventListener('click', () => {
        this.showAddTaskModal = !this.showAddTaskModal;
        this.refresh(container, state, onUpdate);
      });
    }

    // 6. Sauvegarde d'une nouvelle tâche PND (100% Éditable)
    const btnSaveNewTask = container.querySelector('#btn-save-new-task');
    if (btnSaveNewTask) {
      btnSaveNewTask.addEventListener('click', () => {
        const name = (container.querySelector('#new-task-name')?.value || '').trim();
        const zone = (container.querySelector('#new-task-zone')?.value || '').trim();
        const period = container.querySelector('#new-task-period')?.value || 'Ouverture';
        const product = (container.querySelector('#new-task-product')?.value || '').trim();
        const dosage = (container.querySelector('#new-task-dosage')?.value || '').trim();
        const method = (container.querySelector('#new-task-method')?.value || '').trim();

        if (!name) {
          DOMUtils.showToast('Veuillez saisir au minimum l\'intitulé de la tâche');
          return;
        }

        const newTask = {
          id: 'pnd-custom-' + Date.now(),
          name,
          zone: zone || 'Cuisine',
          period,
          frequency: (period === 'Hebdo' ? 'weekly' : (period === 'Mensuel' ? 'monthly' : 'daily')),
          product: product || 'Désinfectant contact alimentaire homologué',
          dosage: dosage || 'Conforme fiche constructeur',
          method: method || 'Pulvériser, temps de pause et rinçage',
          responsible: activeUser
        };

        if (!Array.isArray(state.cleaningTasks)) state.cleaningTasks = [];
        state.cleaningTasks.push(newTask);
        this.showAddTaskModal = false;

        DOMUtils.showToast(`✅ Tâche "${name}" ajoutée au Plan de Nettoyage`);
        onUpdate();
        this.refresh(container, state, onUpdate);
      });
    }

    const btnCancelNewTask = container.querySelector('#btn-cancel-new-task');
    if (btnCancelNewTask) {
      btnCancelNewTask.addEventListener('click', () => {
        this.showAddTaskModal = false;
        this.refresh(container, state, onUpdate);
      });
    }

    // 7. Suppression d'une tâche PND
    container.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const taskIdx = (state.cleaningTasks || []).findIndex(t => t.id === taskId);
        if (taskIdx >= 0) {
          const removed = state.cleaningTasks.splice(taskIdx, 1)[0];
          DOMUtils.showToast(`Tâche "${removed.name}" supprimée`);
          onUpdate();
          this.refresh(container, state, onUpdate);
        }
      });
    });

    // 8. Signature de l'attestation Hygiène & Santé quotidienne
    const btnSignHealth = container.querySelector('#btn-sign-health');
    if (btnSignHealth) {
      btnSignHealth.addEventListener('click', () => {
        if (!Array.isArray(state.healthChecks)) state.healthChecks = [];
        
        state.healthChecks.push({
          id: 'health-' + Date.now(),
          date: today,
          time: nowTime,
          user: activeUser,
          hygieneChecked: true,
          healthClean: true
        });

        // Enregistrement au journal officiel d'audit
        state.logs.push({
          id: 'log-' + Date.now(),
          type: 'health_declaration',
          date: today,
          time: nowTime,
          user: activeUser,
          status: 'ok',
          details: 'Attestation de santé et tenue conforme signée à la prise de poste'
        });

        DOMUtils.showToast(`✍️ Attestation validée avec succès pour ${activeUser}`);
        onUpdate();
        this.refresh(container, state, onUpdate);
      });
    }

    // 9. Enregistrement Nuisibles & Déchets
    const btnSavePest = container.querySelector('#btn-save-pest');
    if (btnSavePest) {
      btnSavePest.addEventListener('click', () => {
        const type = container.querySelector('#pest-type')?.value || 'internal';
        const result = container.querySelector('#pest-result')?.value || 'ok';
        const notes = (container.querySelector('#pest-notes')?.value || '').trim();

        if (!Array.isArray(state.pestControls)) state.pestControls = [];

        state.pestControls.push({
          id: 'pest-' + Date.now(),
          date: today,
          time: nowTime,
          type,
          result,
          notes,
          user: activeUser
        });

        state.logs.push({
          id: 'log-' + Date.now(),
          type: 'pest_control',
          date: today,
          time: nowTime,
          user: activeUser,
          status: result,
          details: `Contrôle nuisibles (${type}) : ${result === 'ok' ? 'Conforme' : 'Anomalie'} - ${notes}`
        });

        DOMUtils.showToast('✅ Contrôle nuisibles consigné dans le registre');
        onUpdate();
        this.refresh(container, state, onUpdate);
      });
    }

    // 10. Enregistrement Étalonnage thermomètre
    const btnSaveCalib = container.querySelector('#btn-save-calib');
    if (btnSaveCalib) {
      btnSaveCalib.addEventListener('click', () => {
        const device = (container.querySelector('#calib-device')?.value || '').trim();
        const method = container.querySelector('#calib-method')?.value || 'ice';
        const val = parseFloat(container.querySelector('#calib-val')?.value || '0');
        const delta = (container.querySelector('#calib-delta')?.value || '').trim();

        if (!device) {
          DOMUtils.showToast('Veuillez préciser le nom du thermomètre ou sonde');
          return;
        }

        if (!Array.isArray(state.calibrations)) state.calibrations = [];

        state.calibrations.push({
          id: 'calib-' + Date.now(),
          date: today,
          time: nowTime,
          device,
          method,
          val,
          delta,
          user: activeUser
        });

        state.logs.push({
          id: 'log-' + Date.now(),
          type: 'calibration',
          date: today,
          time: nowTime,
          user: activeUser,
          status: 'ok',
          details: `Étalonnage ${device} : ${val}°C (${delta})`
        });

        DOMUtils.showToast(`✅ Étalonnage de ${device} validé`);
        onUpdate();
        this.refresh(container, state, onUpdate);
      });
    }
  },

  refresh(container, state, onUpdate) {
    container.innerHTML = this.render(state);
    this.bindEvents(container, state, onUpdate);
  }
};
