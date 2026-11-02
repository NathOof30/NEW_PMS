/**
 * Module : Tableau de bord (Accueil)
 * Vue synthétique des contrôles à réaliser et des alertes du jour.
 */

import { DateUtils } from '../utils/dates.js';
import { DOMUtils } from '../utils/dom.js';

export const DashboardModule = {
  render(state) {
    const today = DateUtils.getTodayISO();
    const activeUser = state.activeUser || 'Yannick';
    const cleaningTasks = state.cleaningTasks || [];
    const equipments = state.equipments || [];
    const logs = state.logs || [];
    const healthChecks = state.healthChecks || [];
    const coolingCycles = state.coolingCycles || [];

    const dailyTasks = cleaningTasks.filter(task => task.frequency === 'daily');
    const doneCleanToday = dailyTasks.filter(task =>
      logs.some(log => log.type === 'clean' && log.taskId === task.id && log.date === today)
    );
    const tempLogsToday = logs.filter(log => log.type === 'temp' && log.date === today);
    const requiredTempChecks = equipments.length * 2;
    const doneTempChecks = Math.min(tempLogsToday.length, requiredTempChecks);
    const totalChecks = dailyTasks.length + requiredTempChecks;
    const doneTotal = doneCleanToday.length + doneTempChecks;
    const globalPercent = totalChecks ? Math.min(100, Math.round((doneTotal / totalChecks) * 100)) : 0;
    const tempAnomaliesToday = tempLogsToday.filter(log => log.ok === false);
    const allAnomaliesToday = logs.filter(log => log.date === today && log.ok === false);
    const activeCooling = coolingCycles.find(cycle => !cycle.endTime);
    const coolingElapsed = activeCooling
      ? DateUtils.diffMinutes(activeCooling.startTime, DateUtils.getNowTime())
      : 0;
    const healthValidated = healthChecks.some(check => check.date === today && check.user === activeUser);

    return `
      <section class="module-dashboard">
        <header class="dashboard-header">
          <div>
            <p class="eyebrow">PMS · Vue du jour</p>
            <h1>Bonjour ${DOMUtils.escapeHTML(activeUser)} <span aria-hidden="true">👋</span></h1>
            <p class="form-label">${today} · Les contrôles essentiels sont regroupés ici.</p>
          </div>
          <span class="badge ${allAnomaliesToday.length ? 'badge-danger' : 'badge-success'}">
            ${allAnomaliesToday.length ? `⚠️ ${allAnomaliesToday.length} anomalie(s)` : '✓ Aucun écart aujourd’hui'}
          </span>
        </header>

        <section class="dashboard-hero card" aria-labelledby="dashboard-progress-title">
          <div class="dashboard-hero-top">
            <div>
              <p class="eyebrow">Avancement global</p>
              <h2 id="dashboard-progress-title">${globalPercent}% de la journée validée</h2>
            </div>
            <strong class="dashboard-percent">${globalPercent}%</strong>
          </div>
          <div class="progress-bar-container" role="progressbar" aria-valuenow="${globalPercent}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar-fill" style="width: ${globalPercent}%;"></div>
          </div>
          <p class="dashboard-supporting-text">${doneTotal} / ${totalChecks} contrôles obligatoires réalisés</p>
        </section>

        <section class="dashboard-section" aria-labelledby="dashboard-actions-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Actions rapides</p>
              <h2 id="dashboard-actions-title">Que voulez-vous contrôler ?</h2>
            </div>
          </div>
          <div class="dashboard-actions">
            <button class="dashboard-action dashboard-action-primary" id="dash-btn-quick-temp">
              <span class="dashboard-action-icon">🌡️</span>
              <span><strong>Températures</strong><small>Frigos et maintien chaud</small></span>
            </button>
            <button class="dashboard-action" id="dash-btn-quick-pnd">
              <span class="dashboard-action-icon">🧽</span>
              <span><strong>Nettoyage</strong><small>Plan du jour</small></span>
            </button>
            <button class="dashboard-action" id="dash-btn-quick-cooling">
              <span class="dashboard-action-icon">❄️</span>
              <span><strong>Refroidissement</strong><small>Suivi du CCP</small></span>
            </button>
            <button class="dashboard-action" id="dash-btn-quick-reception">
              <span class="dashboard-action-icon">📦</span>
              <span><strong>Réception</strong><small>Nouvelle livraison</small></span>
            </button>
          </div>
        </section>

        <section class="dashboard-grid">
          <article class="status-card card">
            <div class="status-card-heading">
              <div>
                <p class="eyebrow">Pilier 1</p>
                <h2>Hygiène & nettoyage</h2>
              </div>
              <span class="status-icon" aria-hidden="true">🧽</span>
            </div>
            <strong class="status-card-value">${doneCleanToday.length} / ${dailyTasks.length}</strong>
            <p class="dashboard-supporting-text">tâches quotidiennes validées</p>
            <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${dailyTasks.length ? Math.round(doneCleanToday.length / dailyTasks.length * 100) : 0}%;"></div></div>
            <button class="btn btn-secondary btn-sm" id="dash-btn-pnd">Ouvrir le plan de nettoyage</button>
          </article>

          <article class="status-card card">
            <div class="status-card-heading">
              <div>
                <p class="eyebrow">Pilier 2</p>
                <h2>Températures</h2>
              </div>
              <span class="status-icon" aria-hidden="true">🌡️</span>
            </div>
            <strong class="status-card-value">${doneTempChecks} / ${requiredTempChecks}</strong>
            <p class="dashboard-supporting-text">relevés du jour · matin et soir</p>
            <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${requiredTempChecks ? Math.round(doneTempChecks / requiredTempChecks * 100) : 0}%;"></div></div>
            ${tempAnomaliesToday.length ? `<p class="status-warning">⚠️ ${tempAnomaliesToday.length} relevé(s) hors seuil</p>` : '<p class="status-success">✓ Chaîne du froid sous contrôle</p>'}
            <button class="btn btn-primary btn-sm" id="dash-btn-temp">Saisir les températures</button>
          </article>

          <article class="status-card card">
            <div class="status-card-heading">
              <div>
                <p class="eyebrow">Prise de poste</p>
                <h2>Hygiène personnelle</h2>
              </div>
              <span class="status-icon" aria-hidden="true">🧑‍🍳</span>
            </div>
            <p class="dashboard-supporting-text">${healthValidated ? 'Attestation validée pour aujourd’hui.' : 'Attestation à valider avant de commencer.'}</p>
            <span class="badge ${healthValidated ? 'badge-success' : 'badge-warning'}">${healthValidated ? '✓ Validée' : 'À faire'}</span>
            <button class="btn btn-secondary btn-sm" id="dash-btn-health">${healthValidated ? 'Voir l’attestation' : 'Valider mon hygiène'}</button>
          </article>

          <article class="status-card card ${activeCooling ? 'status-card-active' : ''}">
            <div class="status-card-heading">
              <div>
                <p class="eyebrow">CCP refroidissement</p>
                <h2>Cellule de refroidissement</h2>
              </div>
              <span class="status-icon" aria-hidden="true">❄️</span>
            </div>
            ${activeCooling
              ? `<p class="status-active"><span class="cooling-pulse-dot"></span>${DOMUtils.escapeHTML(activeCooling.dishName)} · ${coolingElapsed} min</p>`
              : '<p class="dashboard-supporting-text">Aucun cycle en cours.</p>'}
            <button class="btn btn-secondary btn-sm" id="dash-btn-cooling">Ouvrir le suivi</button>
          </article>
        </section>

        <section class="dashboard-footer-actions">
          <button class="btn btn-secondary" id="dash-btn-cooking">🍳 Cuisson & remise en température</button>
          <button class="btn btn-secondary" id="dash-btn-fryers">🍟 Huiles de friture</button>
          <button class="btn btn-secondary" id="dash-btn-pest">🐀 Nuisibles & déchets</button>
          <button class="btn btn-secondary" id="dash-btn-calib">🛠️ Étalonnage</button>
          <button class="btn btn-secondary" id="dash-btn-quick-haccp">🛡️ Plan HACCP</button>
        </section>
      </section>
    `;
  },

  bindEvents(container) {
    const triggerNavigation = (route, subTab) => {
      document.dispatchEvent(new CustomEvent('pms:navigate', { detail: { route, subTab } }));
    };

    const routes = {
      'dash-btn-quick-temp': ['temp', 'temperatures'],
      'dash-btn-quick-pnd': ['hygiene', 'pnd'],
      'dash-btn-quick-cooling': ['temp', 'cooling'],
      'dash-btn-quick-reception': ['reception'],
      'dash-btn-temp': ['temp', 'temperatures'],
      'dash-btn-pnd': ['hygiene', 'pnd'],
      'dash-btn-health': ['hygiene', 'personnel'],
      'dash-btn-cooling': ['temp', 'cooling'],
      'dash-btn-cooking': ['temp', 'cooking'],
      'dash-btn-fryers': ['temp', 'fryers'],
      'dash-btn-pest': ['hygiene', 'pest'],
      'dash-btn-calib': ['hygiene', 'calibration'],
      'dash-btn-quick-haccp': ['temp', 'haccp_plan']
    };

    Object.entries(routes).forEach(([id, [route, subTab]]) => {
      container.querySelector(`#${id}`)?.addEventListener('click', () => triggerNavigation(route, subTab));
    });
  }
};
