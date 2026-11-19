(() => {
  const D = window.CB_DATA;
  const S = window.CB_STORAGE;
  const E = window.CB_ENGINE;

  const state = {
    user: null,
    userData: null,
    mode: 'radial', // 'radial' | 'comerbien'
    cbRoute: 'inicio',
    recipeFilters: { query: '', moment: 'all', maxCost: 'all', onlyFav: false, respectProfile: true },
    pantry: ['huevo', 'papa', 'cebolla'],
  };

  const els = {
    authBtn: document.getElementById('cb-auth-btn'),
    guestBanner: document.getElementById('cb-guest-banner'),
    guestLoginLink: document.getElementById('cb-guest-login-link'),
    modeBar: document.getElementById('cb-mode-bar'),
    userStatusLabel: document.getElementById('cb-user-status-label'),
    logoutBtn: document.getElementById('cb-logout-btn'),
    wheelSection: document.querySelector('.wheel-section'),
    cbStage: document.getElementById('comer-bien-stage'),
    modalBackdrop: document.getElementById('cb-modal-backdrop'),
    modalBox: document.getElementById('cb-modal-box'),
  };

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openModal(html) {
    els.modalBox.innerHTML = html;
    els.modalBackdrop.classList.remove('cb-hidden');
  }

  function closeModal() {
    els.modalBackdrop.classList.add('cb-hidden');
    els.modalBox.innerHTML = '';
  }

  els.modalBackdrop.addEventListener('click', (e) => {
    if (e.target === els.modalBackdrop) closeModal();
  });

  function persist() {
    if (state.user && state.userData) {
      S.saveUserData(state.user.username, state.userData);
    }
  }

  function syncTopbarAndMode() {
    if (state.user) {
      els.authBtn.innerHTML = `<span>👤 @${esc(state.user.username)}</span>`;
      els.authBtn.classList.add('is-logged');
      els.guestBanner?.classList.add('cb-hidden');
      els.modeBar.classList.remove('cb-hidden');
      els.userStatusLabel.textContent = `Sesión: ${state.user.fullName || state.user.username}`;
    } else {
      els.authBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span>Ingresar</span>`;
      els.authBtn.classList.remove('is-logged');
      els.guestBanner?.classList.remove('cb-hidden');
      els.modeBar.classList.add('cb-hidden');
      state.mode = 'radial';
    }

    const showCB = Boolean(state.user && state.mode === 'comerbien');
    els.wheelSection.classList.toggle('cb-hidden', showCB);
    els.cbStage.classList.toggle('cb-hidden', !showCB);

    document.querySelectorAll('[data-cb-mode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.cbMode === state.mode);
    });

    if (showCB) renderCBStage();
  }

  // ===========================================================================
  // MODAL DE LOGIN / REGISTRO / RECUPERACIÓN
  // ===========================================================================

  function openAuthModal(initialTab = 'login') {
    let tab = initialTab;

    function renderAuth() {
      openModal(`
        <div class="cb-modal-body" style="max-width:440px;margin:0 auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <strong style="font-size:18px;color:var(--cb-forest);">🌿 COMER BIEN</strong>
              <div style="font-size:12px;color:var(--cb-muted);">Tu espacio personal de alimentación</div>
            </div>
            <button type="button" class="cb-btn cb-btn-ghost cb-btn-sm" id="cb-auth-close">✕</button>
          </div>

          <div class="cb-mode-pills" style="width:100%;display:flex;">
            <button type="button" class="cb-mode-pill ${tab === 'login' ? 'active' : ''}" style="flex:1;" data-atab="login">Ingresar</button>
            <button type="button" class="cb-mode-pill ${tab === 'register' ? 'active' : ''}" style="flex:1;" data-atab="register">Crear cuenta</button>
          </div>

          <div id="cb-auth-msg" class="cb-alert cb-hidden"></div>

          ${
            tab === 'login'
              ? `
            <form id="cb-form-login" style="display:flex;flex-direction:column;gap:12px;">
              <div class="cb-field"><label>Nombre de usuario</label><input id="cb-l-user" required placeholder="Ej: sofia" /></div>
              <div class="cb-field"><label>Contraseña</label><input id="cb-l-pass" type="password" required placeholder="Tu contraseña" /></div>
              <div style="text-align:right;"><button type="button" id="cb-go-rec" class="cb-btn cb-btn-ghost cb-btn-sm">¿Olvidaste tu contraseña?</button></div>
              <button type="submit" class="cb-btn cb-btn-primary">Entrar a mi espacio →</button>
            </form>`
              : tab === 'register'
              ? `
            <form id="cb-form-reg" style="display:flex;flex-direction:column;gap:10px;">
              <div class="cb-field"><label>Nombre de usuario</label><input id="cb-r-user" required minlength="3" placeholder="Ej: lucia_uy" /></div>
              <div class="cb-field"><label>Tu nombre</label><input id="cb-r-name" required placeholder="Ej: Lucía Fernández" /></div>
              <div class="cb-field"><label>Correo electrónico</label><input id="cb-r-mail" type="email" required placeholder="lucia@correo.com" /></div>
              <div class="cb-field"><label>Contraseña (mín. 6 caracteres)</label><input id="cb-r-pass" type="password" required minlength="6" /></div>
              <button type="submit" class="cb-btn cb-btn-primary">Registrarme →</button>
            </form>`
              : `
            <form id="cb-form-rec" style="display:flex;flex-direction:column;gap:10px;">
              <div class="cb-field"><label>Nombre de usuario</label><input id="cb-rec-user" required placeholder="Ej: sofia" /></div>
              <div class="cb-field"><label>Correo registrado</label><input id="cb-rec-mail" type="email" required placeholder="sofia@comerbien.uy" /></div>
              <div class="cb-field"><label>Nueva contraseña</label><input id="cb-rec-pass" type="password" required minlength="6" /></div>
              <button type="submit" class="cb-btn cb-btn-primary">Restablecer contraseña</button>
              <button type="button" id="cb-back-login" class="cb-btn cb-btn-ghost">Volver</button>
            </form>`
          }

          <div style="border-top:1px solid var(--cb-cream-dark);padding-top:12px;">
            <div style="font-size:11px;font-weight:700;color:var(--cb-muted);margin-bottom:8px;">✨ USUARIOS DE DEMOSTRACIÓN</div>
            <div class="cb-grid-2" style="gap:8px;">
              <button type="button" class="cb-card" style="text-align:left;padding:10px;cursor:pointer;" data-demo="sofia:comer1234">
                <strong style="font-size:13px;">sofia</strong>
                <div style="font-size:11px;color:var(--cb-muted);">Clave: comer1234</div>
              </button>
              <button type="button" class="cb-card" style="text-align:left;padding:10px;cursor:pointer;" data-demo="mateo:comer1234">
                <strong style="font-size:13px;">mateo</strong>
                <div style="font-size:11px;color:var(--cb-muted);">Sin lactosa · comer1234</div>
              </button>
            </div>
          </div>
        </div>
      `);

      const msgEl = document.getElementById('cb-auth-msg');
      const showMsg = (txt, ok = false) => {
        msgEl.textContent = txt;
        msgEl.className = `cb-alert ${ok ? 'cb-alert-success' : 'cb-alert-error'}`;
        msgEl.classList.remove('cb-hidden');
      };

      document.getElementById('cb-auth-close').addEventListener('click', closeModal);
      els.modalBox.querySelectorAll('[data-atab]').forEach((b) =>
        b.addEventListener('click', () => {
          tab = b.dataset.atab;
          renderAuth();
        })
      );
      document.getElementById('cb-go-rec')?.addEventListener('click', () => {
        tab = 'recover';
        renderAuth();
      });
      document.getElementById('cb-back-login')?.addEventListener('click', () => {
        tab = 'login';
        renderAuth();
      });

      els.modalBox.querySelectorAll('[data-demo]').forEach((b) =>
        b.addEventListener('click', () => {
          const [u, p] = b.dataset.demo.split(':');
          tab = 'login';
          renderAuth();
          document.getElementById('cb-l-user').value = u;
          document.getElementById('cb-l-pass').value = p;
        })
      );

      document.getElementById('cb-form-login')?.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          state.user = S.login(
            document.getElementById('cb-l-user').value,
            document.getElementById('cb-l-pass').value
          );
          state.userData = S.getUserData(state.user.username);
          state.mode = 'comerbien';
          closeModal();
          syncTopbarAndMode();
        } catch (err) {
          showMsg(err.message);
        }
      });

      document.getElementById('cb-form-reg')?.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          state.user = S.register({
            username: document.getElementById('cb-r-user').value,
            fullName: document.getElementById('cb-r-name').value,
            email: document.getElementById('cb-r-mail').value,
            password: document.getElementById('cb-r-pass').value,
          });
          state.userData = S.getUserData(state.user.username);
          state.mode = 'comerbien';
          closeModal();
          syncTopbarAndMode();
        } catch (err) {
          showMsg(err.message);
        }
      });

      document.getElementById('cb-form-rec')?.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          S.recoverPassword(
            document.getElementById('cb-rec-user').value,
            document.getElementById('cb-rec-mail').value,
            document.getElementById('cb-rec-pass').value
          );
          tab = 'login';
          renderAuth();
          showMsg('Contraseña restablecida. Ya podés ingresar.', true);
        } catch (err) {
          showMsg(err.message);
        }
      });
    }

    renderAuth();
  }

  // ===========================================================================
  // STAGE DE COMER BIEN (7 MÓDULOS)
  // ===========================================================================

  function renderCBStage() {
    const routes = [
      { id: 'inicio', label: '🏠 Inicio y Sugerencias' },
      { id: 'planificador', label: '📅 Planificador Semanal' },
      { id: 'recetas', label: '📖 Recetas Económicas' },
      { id: 'que-cocino', label: '🍳 ¿Qué cocino hoy?' },
      { id: 'compras', label: '🛒 Lista de Compras' },
      { id: 'educacion', label: '🎓 Guía MSP / OMS' },
      { id: 'perfil', label: '👤 Mi Perfil' },
    ];

    const subnavHtml = `
      <nav class="cb-subnav">
        ${routes
          .map(
            (r) =>
              `<button type="button" class="cb-subnav-btn ${
                state.cbRoute === r.id ? 'active' : ''
              }" data-cb-route="${r.id}">${r.label}</button>`
          )
          .join('')}
      </nav>
      <div id="cb-view"></div>
    `;
    els.cbStage.innerHTML = subnavHtml;

    els.cbStage.querySelectorAll('[data-cb-route]').forEach((b) =>
      b.addEventListener('click', () => {
        state.cbRoute = b.dataset.cbRoute;
        renderCBStage();
      })
    );

    const view = document.getElementById('cb-view');
    if (state.cbRoute === 'inicio') renderInicio(view);
    else if (state.cbRoute === 'planificador') renderPlanificador(view);
    else if (state.cbRoute === 'recetas') renderRecetas(view);
    else if (state.cbRoute === 'que-cocino') renderQueCocino(view);
    else if (state.cbRoute === 'compras') renderCompras(view);
    else if (state.cbRoute === 'educacion') renderEducacion(view);
    else if (state.cbRoute === 'perfil') renderPerfil(view);
  }

  // 1. INICIO Y SUGERENCIAS
  function renderInicio(view) {
    const today = S.getTodayIso();
    const todayIdx = E.getTodayDayIndex();
    const todayLogs = state.userData.dailyLogs.filter((l) => l.logDate === today);
    const todaySlots = state.userData.menuSlots.filter((s) => s.dayIndex === todayIdx);
    const summary = E.analyzeDayAndSuggest(todayLogs, todaySlots, state.user);
    const firstName = (state.user.fullName || state.user.username).split(' ')[0];

    const momentsHtml = D.MOMENTS_ORDER.map((m) => {
      const meta = D.MOMENT_LABELS[m];
      const logs = todayLogs.filter((l) => l.moment === m);
      const slot = todaySlots.find((s) => s.moment === m);
      const plannedRec = slot?.recipeId ? D.RECIPES.find((r) => r.id === slot.recipeId) : null;
      const covered = logs.length > 0 || Boolean(plannedRec || slot?.customTitle);

      let body = `<p style="font-size:12px;color:var(--cb-muted);font-style:italic;margin:6px 0;">Sin registro todavía.</p>`;
      if (logs.length > 0) {
        body = logs
          .map(
            (l) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;background:var(--cb-cream);padding:9px 11px;border-radius:11px;margin-top:6px;">
            <div>
              <span class="cb-badge ${l.status === 'eaten' ? 'cb-badge-green' : 'cb-badge-amber'}">${
              l.status === 'eaten' ? 'Cumplido' : 'Planificado'
            }</span>
              <div style="font-weight:700;font-size:13px;margin-top:3px;">${esc(l.title)}</div>
            </div>
            <div style="display:flex;gap:4px;">
              <button type="button" class="cb-btn cb-btn-sm cb-btn-outline" data-tlog="${l.id}">${
              l.status === 'eaten' ? '↩' : '✓'
            }</button>
              <button type="button" class="cb-btn cb-btn-sm cb-btn-ghost" data-dlog="${l.id}">✕</button>
            </div>
          </div>`
          )
          .join('');
      } else if (plannedRec) {
        body = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;background:var(--cb-cream);padding:9px 11px;border-radius:11px;margin-top:6px;">
            <div>
              <span class="cb-badge cb-badge-amber">En tu menú de hoy</span>
              <div style="font-weight:700;font-size:13px;margin-top:3px;cursor:pointer;" data-cb-open="${plannedRec.id}">${esc(
          plannedRec.title
        )}</div>
            </div>
            <button type="button" class="cb-btn cb-btn-sm cb-btn-primary" data-slot-eat="${m}">¡Ya lo comí!</button>
          </div>`;
      }

      return `
        <div class="cb-card ${covered ? '' : 'cb-card-dashed'}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><strong>${meta.emoji} ${meta.label}</strong> <small style="color:var(--cb-muted);">(${meta.timeHint})</small></div>
            <button type="button" class="cb-btn cb-btn-sm cb-btn-secondary" data-qlog="${m}">+ Registrar</button>
          </div>
          ${body}
        </div>`;
    }).join('');

    const sugHtml =
      summary.suggestions.length > 0
        ? `
      <div style="margin-top:22px;">
        <div class="cb-section-head"><h3>✨ Sugerencias para lo que falta hoy</h3></div>
        <div class="cb-grid-3">
          ${summary.suggestions
            .filter((s) => s.recipe)
            .map(
              (s) => `
            <article class="cb-recipe-card">
              <div class="cb-recipe-thumb" data-cb-open="${s.recipe.id}">
                <img src="${s.recipe.imageUrl}" alt="${esc(s.recipe.title)}" />
              </div>
              <div class="cb-recipe-body">
                <div data-cb-open="${s.recipe.id}">
                  <span class="cb-badge cb-badge-sage" style="margin-bottom:6px;">Para tu ${D.MOMENT_LABELS[s.moment].label}</span>
                  <div style="font-weight:700;font-size:15px;">${esc(s.recipe.title)}</div>
                  <p style="font-size:12px;color:var(--cb-muted);margin-top:4px;">${esc(s.reason)}</p>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--cb-cream-dark);padding-top:8px;">
                  <span style="font-size:12px;color:var(--cb-muted);">⏱ ${s.recipe.prepMinutes}m · ~$U ${s.recipe.estimatedCostUyu}</span>
                  <button type="button" class="cb-btn cb-btn-sm cb-btn-secondary" data-acsug="${s.moment}:${s.recipe.id}">Planificar hoy</button>
                </div>
              </div>
            </article>`
            )
            .join('')}
        </div>
      </div>`
        : '';

    view.innerHTML = `
      <div class="cb-hero">
        <div style="max-width:620px;">
          <div style="font-size:12px;font-weight:700;color:#c8e6c9;">RESUMEN DE HOY</div>
          <h2>¡Hola, ${esc(firstName)}! ${esc(summary.headline)}</h2>
          <p style="font-size:14px;color:#e6f0ea;margin:0;">${esc(summary.encouragement)}</p>
        </div>
        <div class="cb-hero-stats">
          <div class="cb-stat"><small>Momentos hoy</small><strong>${summary.coveredMoments.length} / 4</strong></div>
          <div class="cb-stat"><small>Meta de agua</small><strong>💧 ${state.user.habits.waterGlassesGoal}</strong></div>
        </div>
      </div>

      <div class="cb-section-head">
        <h3>Tus 4 momentos de hoy</h3>
        <button type="button" class="cb-btn cb-btn-sm cb-btn-outline" id="cb-go-radial">🎡 Buscar más en Menú Radial</button>
      </div>
      <div class="cb-grid-2">${momentsHtml}</div>
      ${sugHtml}
    `;

    document.getElementById('cb-go-radial').addEventListener('click', () => {
      state.mode = 'radial';
      syncTopbarAndMode();
    });
    view.querySelectorAll('[data-qlog]').forEach((b) =>
      b.addEventListener('click', () => openQuickLogModal(b.dataset.qlog))
    );
    view.querySelectorAll('[data-tlog]').forEach((b) =>
      b.addEventListener('click', () => {
        state.userData.dailyLogs = state.userData.dailyLogs.map((l) =>
          l.id === b.dataset.tlog ? { ...l, status: l.status === 'eaten' ? 'planned' : 'eaten' } : l
        );
        persist();
        renderCBStage();
      })
    );
    view.querySelectorAll('[data-dlog]').forEach((b) =>
      b.addEventListener('click', () => {
        state.userData.dailyLogs = state.userData.dailyLogs.filter((l) => l.id !== b.dataset.dlog);
        persist();
        renderCBStage();
      })
    );
    view.querySelectorAll('[data-slot-eat]').forEach((b) =>
      b.addEventListener('click', () => {
        const m = b.dataset.slotEat;
        const slot = todaySlots.find((s) => s.moment === m);
        const rec = slot?.recipeId ? D.RECIPES.find((r) => r.id === slot.recipeId) : null;
        if (!rec) return;
        state.userData.dailyLogs.unshift({
          id: 'log-' + Date.now(),
          logDate: today,
          moment: m,
          recipeId: rec.id,
          title: rec.title,
          status: 'eaten',
          foodGroups: rec.foodGroups,
        });
        state.userData.menuSlots = state.userData.menuSlots.map((s) =>
          s.dayIndex === todayIdx && s.moment === m ? { ...s, status: 'eaten' } : s
        );
        persist();
        renderCBStage();
      })
    );
    view.querySelectorAll('[data-acsug]').forEach((b) =>
      b.addEventListener('click', () => {
        const [m, rid] = b.dataset.acsug.split(':');
        const rec = D.RECIPES.find((r) => r.id === rid);
        if (!rec) return;
        state.userData.dailyLogs.unshift({
          id: 'log-' + Date.now(),
          logDate: today,
          moment: m,
          recipeId: rec.id,
          title: rec.title,
          status: 'planned',
          foodGroups: rec.foodGroups,
        });
        persist();
        renderCBStage();
      })
    );
    bindCBRecipes(view);
  }

  function openQuickLogModal(moment) {
    const compatible = D.RECIPES.filter((r) => E.isRecipeCompatible(r, state.user));
    openModal(`
      <form id="cb-ql-form" class="cb-modal-body">
        <h3 style="margin:0;">Registrar ${D.MOMENT_LABELS[moment].label}</h3>
        <div class="cb-field">
          <label>Estado</label>
          <select id="cb-ql-status">
            <option value="eaten">Ya lo comí</option>
            <option value="planned">Pienso comer esto hoy</option>
          </select>
        </div>
        <div class="cb-field">
          <label>Elegir receta de COMER BIEN (opcional)</label>
          <select id="cb-ql-rec">
            <option value="">-- O escribí abajo lo que comiste --</option>
            ${compatible.map((r) => `<option value="${r.id}">${esc(r.title)} (~$U ${r.estimatedCostUyu})</option>`).join('')}
          </select>
        </div>
        <div class="cb-field" id="cb-ql-cwrap">
          <label>¿Qué comiste o pensás comer?</label>
          <input id="cb-ql-custom" placeholder="Ej: Milanesa al horno con ensalada" />
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="cb-btn cb-btn-ghost" id="cb-ql-cancel">Cancelar</button>
          <button type="submit" class="cb-btn cb-btn-primary">Guardar</button>
        </div>
      </form>
    `);
    const sel = document.getElementById('cb-ql-rec');
    const cw = document.getElementById('cb-ql-cwrap');
    sel.addEventListener('change', () => cw.classList.toggle('cb-hidden', Boolean(sel.value)));
    document.getElementById('cb-ql-cancel').addEventListener('click', closeModal);
    document.getElementById('cb-ql-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.getElementById('cb-ql-status').value;
      const rid = sel.value;
      const custom = document.getElementById('cb-ql-custom').value.trim();
      if (rid) {
        const rec = D.RECIPES.find((r) => r.id === rid);
        state.userData.dailyLogs.unshift({
          id: 'log-' + Date.now(),
          logDate: S.getTodayIso(),
          moment,
          recipeId: rec.id,
          title: rec.title,
          status,
          foodGroups: rec.foodGroups,
        });
      } else if (custom) {
        state.userData.dailyLogs.unshift({
          id: 'log-' + Date.now(),
          logDate: S.getTodayIso(),
          moment,
          recipeId: null,
          title: custom,
          status,
          foodGroups: ['cereales_tuberculos', 'verduras'],
        });
      } else return;
      persist();
      closeModal();
      renderCBStage();
    });
  }

  // 2. PLANIFICADOR SEMANAL
  function renderPlanificador(view) {
    const slots = state.userData.menuSlots;
    const weeklyCost = slots.reduce((acc, s) => {
      if (s.status === 'skipped' || !s.recipeId) return acc;
      const rec = D.RECIPES.find((r) => r.id === s.recipeId);
      return rec ? acc + Math.round((rec.estimatedCostUyu * (s.servings || 2)) / rec.servings) : acc;
    }, 0);

    view.innerHTML = `
      <div class="cb-section-head">
        <div>
          <h3>Planificador Semanal</h3>
          <small style="color:var(--cb-muted);">Costo estimado: $U ${weeklyCost.toLocaleString('es-UY')} · Presupuesto meta: $U ${state.user.weeklyBudgetUyu.toLocaleString('es-UY')}</small>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="cb-btn cb-btn-primary" id="cb-gen-menu">✨ ${slots.length ? 'Regenerar propuesta' : 'Generar menú semanal'}</button>
          <button type="button" class="cb-btn cb-btn-accent" id="cb-to-shop" ${slots.length ? '' : 'disabled'}>🛒 Pasar a compras</button>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        ${D.DAYS_OF_WEEK.map(
          (day, dIdx) => `
          <div class="cb-day-card">
            <div class="cb-day-head"><strong>${day}</strong></div>
            <div class="cb-grid-4">
              ${D.MOMENTS_ORDER.map((m) => {
                const slot = slots.find((s) => s.dayIndex === dIdx && s.moment === m);
                const rec = slot?.recipeId ? D.RECIPES.find((r) => r.id === slot.recipeId) : null;
                const title = rec ? rec.title : slot?.customTitle;
                return `
                  <div class="cb-slot-cell">
                    <div>
                      <div style="font-size:11px;font-weight:700;color:var(--cb-muted);margin-bottom:4px;">${D.MOMENT_LABELS[m].emoji} ${D.MOMENT_LABELS[m].label}</div>
                      ${
                        title
                          ? `<div style="font-weight:700;font-size:13px;${rec ? 'cursor:pointer;' : ''}" ${rec ? `data-cb-open="${rec.id}"` : ''}>${esc(title)}</div>`
                          : '<span style="font-size:12px;color:var(--cb-muted);font-style:italic;">Sin asignar</span>'
                      }
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      ${slot?.status === 'eaten' ? '<span class="cb-badge cb-badge-green">Cumplido</span>' : '<span></span>'}
                      <div style="display:flex;gap:4px;">
                        ${title ? `<button type="button" class="cb-btn cb-btn-sm cb-btn-outline" data-stog="${dIdx}:${m}">✓</button>` : ''}
                        <button type="button" class="cb-btn cb-btn-sm cb-btn-ghost" data-sedit="${dIdx}:${m}">✏️</button>
                      </div>
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>`
        ).join('')}
      </div>
    `;

    document.getElementById('cb-gen-menu').addEventListener('click', () => {
      state.userData.menuSlots = E.generateWeeklyMenu(state.user);
      persist();
      renderCBStage();
    });
    document.getElementById('cb-to-shop').addEventListener('click', () => {
      const fromMenu = E.buildShoppingListFromMenu(state.userData.menuSlots);
      const manual = state.userData.shoppingList.filter((i) => !i.fromMenu);
      state.userData.shoppingList = [...manual, ...fromMenu];
      persist();
      state.cbRoute = 'compras';
      renderCBStage();
    });
    view.querySelectorAll('[data-stog]').forEach((b) =>
      b.addEventListener('click', () => {
        const [d, m] = b.dataset.stog.split(':');
        state.userData.menuSlots = state.userData.menuSlots.map((s) =>
          s.dayIndex === Number(d) && s.moment === m
            ? { ...s, status: s.status === 'eaten' ? 'planned' : 'eaten' }
            : s
        );
        persist();
        renderCBStage();
      })
    );
    view.querySelectorAll('[data-sedit]').forEach((b) =>
      b.addEventListener('click', () => {
        const [d, m] = b.dataset.sedit.split(':');
        const compatible = D.RECIPES.filter((r) => E.isRecipeCompatible(r, state.user));
        openModal(`
          <form id="cb-se-form" class="cb-modal-body">
            <h3 style="margin:0;">${D.DAYS_OF_WEEK[Number(d)]} · ${D.MOMENT_LABELS[m].label}</h3>
            <div class="cb-field">
              <label>Elegir receta compatible</label>
              <select id="cb-se-rec">
                <option value="">-- Ninguna / comida casera --</option>
                ${compatible.map((r) => `<option value="${r.id}">${esc(r.title)} (~$U ${r.estimatedCostUyu})</option>`).join('')}
              </select>
            </div>
            <div class="cb-field"><label>O escribí una preparación</label><input id="cb-se-cust" placeholder="Ej: Sobras de guiso" /></div>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
              <button type="button" class="cb-btn cb-btn-ghost" id="cb-se-cancel">Cancelar</button>
              <button type="submit" class="cb-btn cb-btn-primary">Guardar</button>
            </div>
          </form>
        `);
        document.getElementById('cb-se-cancel').addEventListener('click', closeModal);
        document.getElementById('cb-se-form').addEventListener('submit', (e) => {
          e.preventDefault();
          const rid = document.getElementById('cb-se-rec').value;
          const cust = document.getElementById('cb-se-cust').value.trim();
          state.userData.menuSlots = state.userData.menuSlots.filter(
            (s) => !(s.dayIndex === Number(d) && s.moment === m)
          );
          if (rid || cust) {
            state.userData.menuSlots.push({
              dayIndex: Number(d),
              moment: m,
              recipeId: rid || null,
              customTitle: rid ? null : cust,
              servings: state.user.householdSize || 2,
              status: 'planned',
            });
          }
          persist();
          closeModal();
          renderCBStage();
        });
      })
    );
    bindCBRecipes(view);
  }

  // 3. RECETAS ECONÓMICAS
  function renderRecetas(view) {
    const f = state.recipeFilters;
    const q = f.query.trim().toLowerCase();
    const list = D.RECIPES.filter((r) => {
      if (f.respectProfile && !E.isRecipeCompatible(r, state.user)) return false;
      if (f.moment !== 'all' && r.moment !== f.moment) return false;
      if (f.maxCost !== 'all' && r.estimatedCostUyu > Number(f.maxCost)) return false;
      if (f.onlyFav && !state.userData.favorites.includes(r.id)) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.ingredients.some((i) => i.name.toLowerCase().includes(q))) return false;
      return true;
    });

    view.innerHTML = `
      <div class="cb-card" style="margin-bottom:16px;display:flex;flex-direction:column;gap:10px;">
        <div class="cb-grid-3">
          <div class="cb-field"><label>Buscar</label><input id="cbr-q" value="${esc(f.query)}" placeholder="lentejas, boniato..." /></div>
          <div class="cb-field">
            <label>Momento</label>
            <select id="cbr-m">
              <option value="all">Todos</option>
              <option value="desayuno" ${f.moment === 'desayuno' ? 'selected' : ''}>Desayuno</option>
              <option value="almuerzo" ${f.moment === 'almuerzo' ? 'selected' : ''}>Almuerzo</option>
              <option value="merienda" ${f.moment === 'merienda' ? 'selected' : ''}>Merienda</option>
              <option value="cena" ${f.moment === 'cena' ? 'selected' : ''}>Cena</option>
            </select>
          </div>
          <div class="cb-field">
            <label>Costo máximo ($U)</label>
            <select id="cbr-c">
              <option value="all">Cualquier costo</option>
              <option value="120" ${f.maxCost === '120' ? 'selected' : ''}>Hasta $U 120</option>
              <option value="220" ${f.maxCost === '220' ? 'selected' : ''}>Hasta $U 220</option>
              <option value="320" ${f.maxCost === '320' ? 'selected' : ''}>Hasta $U 320</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:13px;">
          <label><input type="checkbox" id="cbr-resp" ${f.respectProfile ? 'checked' : ''} /> Respetar mis restricciones</label>
          <label><input type="checkbox" id="cbr-fav" ${f.onlyFav ? 'checked' : ''} /> Solo favoritas (${state.userData.favorites.length})</label>
        </div>
      </div>

      <div class="cb-grid-3">
        ${list
          .map(
            (r) => `
          <article class="cb-recipe-card" data-cb-open="${r.id}">
            <div class="cb-recipe-thumb"><img src="${r.imageUrl}" alt="${esc(r.title)}" loading="lazy" /></div>
            <div class="cb-recipe-body">
              <div>
                <div style="font-weight:700;font-size:15px;">${esc(r.title)}</div>
                <p style="font-size:12px;color:var(--cb-muted);margin-top:4px;">${esc(r.description)}</p>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--cb-cream-dark);padding-top:8px;">
                <span style="font-size:12px;color:var(--cb-muted);">⏱ ${r.prepMinutes}m · ${r.servings} porc.</span>
                <span class="cb-badge cb-badge-sage">~$U ${r.estimatedCostUyu}</span>
              </div>
            </div>
          </article>`
          )
          .join('')}
      </div>
    `;

    document.getElementById('cbr-q').addEventListener('input', (e) => {
      state.recipeFilters.query = e.target.value;
      renderCBStage();
      const el = document.getElementById('cbr-q');
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
    document.getElementById('cbr-m').addEventListener('change', (e) => {
      state.recipeFilters.moment = e.target.value;
      renderCBStage();
    });
    document.getElementById('cbr-c').addEventListener('change', (e) => {
      state.recipeFilters.maxCost = e.target.value;
      renderCBStage();
    });
    document.getElementById('cbr-resp').addEventListener('change', (e) => {
      state.recipeFilters.respectProfile = e.target.checked;
      renderCBStage();
    });
    document.getElementById('cbr-fav').addEventListener('change', (e) => {
      state.recipeFilters.onlyFav = e.target.checked;
      renderCBStage();
    });
    bindCBRecipes(view);
  }

  // 4. ¿QUÉ COCINO HOY?
  function renderQueCocino(view) {
    const pantry = state.pantry;
    const compatible = D.RECIPES.filter((r) => E.isRecipeCompatible(r, state.user));
    const matches = compatible
      .map((rec) => {
        const req = rec.ingredients.filter((i) => !i.optional);
        const have = [];
        const miss = [];
        req.forEach((i) => {
          if (pantry.some((p) => i.name.toLowerCase().includes(p) || p.includes(i.name.toLowerCase()))) have.push(i.name);
          else miss.push(i.name);
        });
        return { rec, have, miss, ratio: req.length ? have.length / req.length : 0 };
      })
      .filter((m) => m.have.length > 0)
      .sort((a, b) => b.ratio - a.ratio);

    view.innerHTML = `
      <div class="cb-card" style="margin-bottom:16px;display:flex;flex-direction:column;gap:12px;">
        <form id="cb-pform" style="display:flex;gap:8px;">
          <input id="cb-pinp" placeholder="Ingresá un ingrediente (ej: lentejas, zapallo)..." style="flex:1;padding:9px 12px;border-radius:10px;border:1px solid #d4c8ae;" />
          <button type="submit" class="cb-btn cb-btn-primary">+ Agregar</button>
        </form>
        <div class="cb-chip-row">
          ${pantry.map((p) => `<button type="button" class="cb-chip active" data-prem="${esc(p)}">${esc(p)} ✕</button>`).join('')}
        </div>
        <div class="cb-chip-row">
          ${D.COMMON_UY_PANTRY.filter((x) => !pantry.includes(x))
            .map((x) => `<button type="button" class="cb-chip" data-padd="${x}">+ ${x}</button>`)
            .join('')}
        </div>
      </div>

      <div class="cb-grid-2">
        ${matches
          .map(
            (m) => `
          <div class="cb-card" style="display:flex;gap:12px;cursor:pointer;" data-cb-open="${m.rec.id}">
            <img src="${m.rec.imageUrl}" alt="${esc(m.rec.title)}" style="width:88px;height:88px;border-radius:12px;object-fit:cover;flex-shrink:0;" />
            <div>
              <strong>${esc(m.rec.title)}</strong>
              <div style="font-size:12px;color:#065f46;margin-top:4px;">✓ Tenés: ${esc(m.have.join(', '))}</div>
              ${m.miss.length ? `<div style="font-size:12px;color:#92400e;">⚠ Falta: ${esc(m.miss.join(', '))}</div>` : '<div style="font-size:12px;color:var(--cb-forest);font-weight:700;">¡Tenés todo!</div>'}
            </div>
          </div>`
          )
          .join('')}
      </div>
    `;

    document.getElementById('cb-pform').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = document.getElementById('cb-pinp').value.trim().toLowerCase();
      if (v && !state.pantry.includes(v)) {
        state.pantry.push(v);
        renderCBStage();
      }
    });
    view.querySelectorAll('[data-prem]').forEach((b) =>
      b.addEventListener('click', () => {
        state.pantry = state.pantry.filter((x) => x !== b.dataset.prem);
        renderCBStage();
      })
    );
    view.querySelectorAll('[data-padd]').forEach((b) =>
      b.addEventListener('click', () => {
        state.pantry.push(b.dataset.padd);
        renderCBStage();
      })
    );
    bindCBRecipes(view);
  }

  // 5. LISTA DE COMPRAS
  function renderCompras(view) {
    const items = state.userData.shoppingList;
    const total = items.reduce((s, i) => s + (i.estimatedUyu || 0), 0);
    view.innerHTML = `
      <div class="cb-section-head">
        <div>
          <h3>Lista de Compras</h3>
          <small style="color:var(--cb-muted);">Total estimado: $U ${total.toLocaleString('es-UY')}</small>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="cb-btn cb-btn-primary" id="cb-sh-sync">🔄 Generar desde mi menú</button>
          ${items.some((i) => i.checked) ? '<button type="button" class="cb-btn cb-btn-outline" id="cb-sh-clr">Limpiar comprados</button>' : ''}
        </div>
      </div>

      <form id="cb-sh-add" class="cb-card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px;align-items:end;">
        <div class="cb-field"><label>Producto</label><input id="cb-sa-n" required placeholder="Ej: Yerba" /></div>
        <div class="cb-field"><label>Cant.</label><input id="cb-sa-q" type="number" step="0.5" value="1" /></div>
        <div class="cb-field"><label>Unidad</label><input id="cb-sa-u" value="u" /></div>
        <div class="cb-field"><label>Rubro</label><select id="cb-sa-c">${D.SHOPPING_CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select></div>
        <button type="submit" class="cb-btn cb-btn-primary">+ Agregar</button>
      </form>

      <div class="cb-grid-2">
        ${D.SHOPPING_CATEGORIES.map((cat) => {
          const ci = items.filter((i) => i.category === cat);
          if (!ci.length) return '';
          return `
            <div class="cb-card">
              <strong style="font-size:14px;">${esc(cat)}</strong>
              ${ci
                .map(
                  (i) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--cb-cream-dark);${i.checked ? 'opacity:0.55;text-decoration:line-through;' : ''}">
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" data-shchk="${i.id}" ${i.checked ? 'checked' : ''} />
                    <span style="font-size:13px;"><strong>${esc(i.name)}</strong> (${i.quantity} ${esc(i.unit)})</span>
                  </label>
                  <button type="button" class="cb-btn cb-btn-sm cb-btn-ghost" data-shdel="${i.id}">✕</button>
                </div>`
                )
                .join('')}
            </div>`;
        }).join('')}
      </div>
    `;

    document.getElementById('cb-sh-sync').addEventListener('click', () => {
      const fromMenu = E.buildShoppingListFromMenu(state.userData.menuSlots);
      const manual = state.userData.shoppingList.filter((i) => !i.fromMenu);
      state.userData.shoppingList = [...manual, ...fromMenu];
      persist();
      renderCBStage();
    });
    document.getElementById('cb-sh-clr')?.addEventListener('click', () => {
      state.userData.shoppingList = state.userData.shoppingList.filter((i) => !i.checked);
      persist();
      renderCBStage();
    });
    document.getElementById('cb-sh-add').addEventListener('submit', (e) => {
      e.preventDefault();
      state.userData.shoppingList.unshift({
        id: 'm-' + Date.now(),
        name: document.getElementById('cb-sa-n').value.trim(),
        quantity: Number(document.getElementById('cb-sa-q').value) || 1,
        unit: document.getElementById('cb-sa-u').value.trim() || 'u',
        category: document.getElementById('cb-sa-c').value,
        estimatedUyu: 80,
        checked: false,
        fromMenu: false,
      });
      persist();
      renderCBStage();
    });
    view.querySelectorAll('[data-shchk]').forEach((cb) =>
      cb.addEventListener('change', () => {
        state.userData.shoppingList = state.userData.shoppingList.map((i) =>
          i.id === cb.dataset.shchk ? { ...i, checked: cb.checked } : i
        );
        persist();
        renderCBStage();
      })
    );
    view.querySelectorAll('[data-shdel]').forEach((b) =>
      b.addEventListener('click', () => {
        state.userData.shoppingList = state.userData.shoppingList.filter((i) => i.id !== b.dataset.shdel);
        persist();
        renderCBStage();
      })
    );
  }

  // 6. EDUCACIÓN NUTRICIONAL
  function renderEducacion(view) {
    view.innerHTML = `
      <div class="cb-grid-3" style="margin-bottom:16px;">
        ${D.NUTRITION_GUIDE.principles
          .map(
            (p) => `
          <div class="cb-card">
            <span class="cb-badge cb-badge-sage">${esc(p.source)}</span>
            <h4 style="margin:8px 0 6px;">${esc(p.title)}</h4>
            <p style="font-size:13px;color:var(--cb-muted);margin:0;">${esc(p.summary)}</p>
          </div>`
          )
          .join('')}
      </div>
      <div class="cb-grid-3" style="margin-bottom:16px;">
        ${D.NUTRITION_GUIDE.combinations
          .map(
            (c) => `
          <div class="cb-card" style="background:var(--cb-sage);border-color:#c6dec9;">
            <strong>${esc(c.title)}</strong>
            <p style="font-size:12px;margin:6px 0;">${esc(c.why)}</p>
            <small><strong>Ejemplo:</strong> ${esc(c.example)}</small>
          </div>`
          )
          .join('')}
      </div>
      <div class="cb-alert cb-alert-warn">
        <strong>Aviso importante:</strong> COMER BIEN es una herramienta educativa basada en la Guía del MSP Uruguay y OMS. No diagnostica ni prescribe tratamientos; las situaciones clínicas requieren orientación profesional.
      </div>
    `;
  }

  // 7. PERFIL
  function renderPerfil(view) {
    const u = state.user;
    view.innerHTML = `
      <form id="cb-pf-form" style="display:flex;flex-direction:column;gap:14px;max-width:780px;">
        <div class="cb-section-head">
          <h3>Mi Perfil y Restricciones</h3>
          <button type="submit" class="cb-btn cb-btn-primary">💾 Guardar perfil</button>
        </div>
        <div id="cb-pf-ok" class="cb-alert cb-alert-success cb-hidden">Perfil guardado.</div>
        <div class="cb-card cb-grid-2">
          <div class="cb-field"><label>Nombre</label><input id="cb-pf-n" value="${esc(u.fullName)}" /></div>
          <div class="cb-field"><label>Personas en el hogar</label><input id="cb-pf-h" type="number" min="1" value="${u.householdSize}" /></div>
          <div class="cb-field"><label>Presupuesto semanal ($U)</label><input id="cb-pf-b" type="number" step="100" value="${u.weeklyBudgetUyu}" /></div>
          <div class="cb-field"><label>Meta de vasos de agua</label><input id="cb-pf-w" type="number" min="1" value="${u.habits.waterGlassesGoal}" /></div>
        </div>
        <div class="cb-card">
          <strong style="display:block;margin-bottom:8px;">Alergias, intolerancias y restricciones</strong>
          <div class="cb-chip-row">
            ${D.RESTRICTION_OPTIONS.map(
              (r) => `<button type="button" class="cb-chip cb-chip-warn ${u.restrictions.includes(r) ? 'active' : ''}" data-pfr="${esc(r)}">${esc(r)}</button>`
            ).join('')}
          </div>
        </div>
      </form>
    `;
    view.querySelectorAll('[data-pfr]').forEach((b) =>
      b.addEventListener('click', () => {
        const val = b.dataset.pfr;
        b.classList.toggle('active');
        if (state.user.restrictions.includes(val)) state.user.restrictions = state.user.restrictions.filter((x) => x !== val);
        else state.user.restrictions.push(val);
      })
    );
    document.getElementById('cb-pf-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.user.fullName = document.getElementById('cb-pf-n').value.trim();
      state.user.householdSize = Math.max(1, Number(document.getElementById('cb-pf-h').value) || 1);
      state.user.weeklyBudgetUyu = Math.max(0, Number(document.getElementById('cb-pf-b').value) || 0);
      state.user.habits.waterGlassesGoal = Number(document.getElementById('cb-pf-w').value) || 8;
      S.saveProfile(state.user);
      syncTopbarAndMode();
      document.getElementById('cb-pf-ok').classList.remove('cb-hidden');
    });
  }

  // Modal de receta COMER BIEN (con porciones y sustituciones)
  function bindCBRecipes(root) {
    root.querySelectorAll('[data-cb-open]').forEach((el) =>
      el.addEventListener('click', () => openCBRecipeModal(el.dataset.cbOpen))
    );
  }

  function openCBRecipeModal(id) {
    const rec = D.RECIPES.find((r) => r.id === id);
    if (!rec) return;
    let servings = rec.servings;
    const subs = {};

    function draw() {
      const scale = servings / Math.max(1, rec.servings);
      const cost = Math.round(rec.estimatedCostUyu * scale);
      openModal(`
        <div style="position:relative;height:200px;">
          <img src="${rec.imageUrl}" alt="${esc(rec.title)}" style="width:100%;height:100%;object-fit:cover;" />
          <button type="button" id="cb-rm-x" style="position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:999px;border:none;background:#fff;cursor:pointer;">✕</button>
        </div>
        <div class="cb-modal-body">
          <h3 style="margin:0;">${esc(rec.title)}</h3>
          <div style="font-size:12px;color:var(--cb-muted);">⏱ ${rec.prepMinutes} min · ~$U ${cost} (${servings} porciones)</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="cb-btn cb-btn-primary cb-btn-sm" id="cb-rm-eat">✓ Ya lo comí hoy</button>
            <button type="button" class="cb-btn cb-btn-secondary cb-btn-sm" id="cb-rm-plan">📅 Pienso comer esto hoy</button>
          </div>
          <div id="cb-rm-fb" class="cb-alert cb-alert-success cb-hidden"></div>
          <div class="cb-card" style="background:var(--cb-cream);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <strong>Ingredientes</strong>
              <div style="display:flex;gap:6px;align-items:center;">
                <button type="button" class="cb-btn cb-btn-sm cb-btn-outline" id="cb-rm-min">-</button>
                <strong>${servings}</strong>
                <button type="button" class="cb-btn cb-btn-sm cb-btn-outline" id="cb-rm-pls">+</button>
              </div>
            </div>
            ${rec.ingredients
              .map((ing, idx) => {
                const si = subs[idx] ?? -1;
                const sub = si >= 0 && ing.substitutions ? ing.substitutions[si] : null;
                const qty = Math.round(ing.amount * scale * 10) / 10;
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--cb-cream-dark);font-size:13px;">
                  <span>${sub ? `<strong style="color:var(--cb-forest);">${esc(sub.substitute)}</strong> (${esc(sub.note)})` : `<strong>${qty} ${esc(ing.unit)}</strong> ${esc(ing.name)}`}</span>
                  ${ing.substitutions?.length ? `<button type="button" class="cb-btn cb-btn-sm cb-btn-secondary" data-cbs="${idx}">${sub ? 'Original' : 'Sustituir'}</button>` : ''}
                </div>`;
              })
              .join('')}
          </div>
          <div>
            <strong>Preparación</strong>
            <ol style="padding-left:18px;margin:6px 0;font-size:13px;">${rec.steps.map((s) => `<li style="margin-bottom:4px;">${esc(s)}</li>`).join('')}</ol>
          </div>
          <div class="cb-card" style="background:var(--cb-sage);font-size:13px;">
            <strong>✨ Aporte nutricional (MSP / OMS):</strong> ${esc(rec.nutritionExplanation)}
          </div>
        </div>
      `);
      document.getElementById('cb-rm-x').addEventListener('click', closeModal);
      document.getElementById('cb-rm-min').addEventListener('click', () => {
        servings = Math.max(1, servings - 1);
        draw();
      });
      document.getElementById('cb-rm-pls').addEventListener('click', () => {
        servings = Math.min(12, servings + 1);
        draw();
      });
      document.getElementById('cb-rm-eat').addEventListener('click', () => {
        window.CB_LOG_RADIAL_RECIPE(rec, 'eaten');
        const fb = document.getElementById('cb-rm-fb');
        fb.textContent = 'Registrado como comido hoy.';
        fb.classList.remove('cb-hidden');
      });
      document.getElementById('cb-rm-plan').addEventListener('click', () => {
        window.CB_LOG_RADIAL_RECIPE(rec, 'planned');
        const fb = document.getElementById('cb-rm-fb');
        fb.textContent = 'Anotado como lo que pensás comer hoy.';
        fb.classList.remove('cb-hidden');
      });
      els.modalBox.querySelectorAll('[data-cbs]').forEach((b) =>
        b.addEventListener('click', () => {
          const i = Number(b.dataset.cbs);
          const tot = rec.ingredients[i].substitutions.length;
          subs[i] = (subs[i] ?? -1) + 1 >= tot ? -1 : (subs[i] ?? -1) + 1;
          draw();
        })
      );
    }
    draw();
  }

  // ===========================================================================
  // API GLOBAL PARA INTEGRARSE CON EL MENÚ RADIAL (js/app.js)
  // ===========================================================================

  window.CB_IS_LOGGED_IN = () => Boolean(state.user);

  window.CB_LOG_RADIAL_RECIPE = (recipe, status = 'eaten') => {
    if (!state.user || !state.userData) return false;
    const validMoment = D.MOMENTS_ORDER.includes(recipe.momento || recipe.moment)
      ? recipe.momento || recipe.moment
      : 'almuerzo';
    const catMap = {
      pollo: ['proteinas_animales'],
      carnes: ['proteinas_animales'],
      pescados: ['proteinas_animales'],
      verduras: ['verduras'],
      pastas: ['cereales_tuberculos'],
      dulces: ['cereales_tuberculos'],
    };
    const fg = recipe.foodGroups || catMap[recipe.categoria] || ['cereales_tuberculos', 'verduras'];

    state.userData.dailyLogs.unshift({
      id: 'log-' + Date.now(),
      logDate: S.getTodayIso(),
      moment: validMoment,
      recipeId: recipe.id,
      title: recipe.title,
      status,
      foodGroups: fg,
    });
    persist();
    if (state.mode === 'comerbien' && state.cbRoute === 'inicio') renderCBStage();
    return true;
  };

  // Eventos globales
  els.authBtn.addEventListener('click', () => {
    if (state.user) {
      state.mode = state.mode === 'comerbien' ? 'radial' : 'comerbien';
      syncTopbarAndMode();
    } else {
      openAuthModal('login');
    }
  });

  els.guestLoginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal('login');
  });

  els.logoutBtn.addEventListener('click', () => {
    S.logout();
    state.user = null;
    state.userData = null;
    syncTopbarAndMode();
  });

  document.querySelectorAll('[data-cb-mode]').forEach((b) =>
    b.addEventListener('click', () => {
      state.mode = b.dataset.cbMode;
      syncTopbarAndMode();
    })
  );

  // Boot
  const existing = S.getActiveUser();
  if (existing) {
    state.user = existing;
    state.userData = S.getUserData(existing.username);
  }
  syncTopbarAndMode();
})();
