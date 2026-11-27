(() => {
  const D = window.CB_DATA;
  const S = window.CB_STORAGE;
  const E = window.CB_ENGINE;

  const state = {
    user: null,
    userData: null,
    mode: 'radial', // 'radial' | 'comerbien'
    cbRoute: 'inicio',
    pickingForInicio: false,
    recipeFilters: { query: '', moment: 'all', maxCost: 'all', focus: 'all', onlyFav: false, respectProfile: true },
    recipeWheelStep: 1, // 1: Presupuesto, 2: Momento, 3: Enfoque
    preferredSupermarket: '', // '' = mejor precio entre supermercados de Montevideo
    pantry: ['huevo', 'papa', 'cebolla'],
    pantryWheelPath: { group: null, subgroup: null },
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
      if (state.user.isCloud && window.QCHCloud?.syncUserData) {
        window.QCHCloud.syncUserData({
          profile: state.user,
          menuSlots: state.userData.menuSlots || [],
          dailyLogs: state.userData.dailyLogs || [],
          shoppingList: state.userData.shoppingList || [],
        });
      }
    }
  }

  function applyCloudSession(fbUser, cloudDoc) {
    if (!fbUser) {
      if (state.user && state.user.isCloud) {
        state.user = null;
        state.userData = null;
        syncTopbarAndMode();
      }
      return;
    }

    const baseProfile = (cloudDoc && cloudDoc.profile) || {
      uid: fbUser.uid,
      username: (fbUser.displayName || fbUser.email?.split('@')[0] || 'usuario')
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, '')
        .slice(0, 24) || 'usuario',
      fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario',
      email: (fbUser.email || '').toLowerCase(),
      photoURL: fbUser.photoURL || '',
      householdSize: 2,
      weeklyBudgetUyu: 3500,
      preferences: [],
      restrictions: [],
      habits: { waterGlassesGoal: 8, cookingTimePreference: 'moderado', notes: '' },
    };
    baseProfile.uid = fbUser.uid;
    baseProfile.isCloud = true;
    if (!baseProfile.habits) {
      baseProfile.habits = { waterGlassesGoal: 8, cookingTimePreference: 'moderado', notes: '' };
    }

    state.user = baseProfile;
    const localData = S.getUserData(baseProfile.username);
    state.userData = {
      favorites: (cloudDoc && Array.isArray(cloudDoc.favorites) ? cloudDoc.favorites : localData.favorites) || [],
      menuSlots: (cloudDoc && Array.isArray(cloudDoc.menuSlots) && cloudDoc.menuSlots.length ? cloudDoc.menuSlots : localData.menuSlots) || [],
      dailyLogs: (cloudDoc && Array.isArray(cloudDoc.dailyLogs) && cloudDoc.dailyLogs.length ? cloudDoc.dailyLogs : localData.dailyLogs) || [],
      shoppingList: (cloudDoc && Array.isArray(cloudDoc.shoppingList) && cloudDoc.shoppingList.length ? cloudDoc.shoppingList : localData.shoppingList) || [],
    };
    S.saveUserData(baseProfile.username, state.userData);
    syncTopbarAndMode();
  }

  function syncTopbarAndMode() {
    if (state.user) {
      els.authBtn.innerHTML = `<span>👤 @${esc(state.user.username)}</span>`;
      els.authBtn.classList.add('is-logged');
      els.guestBanner?.classList.add('cb-hidden');
      els.modeBar.classList.remove('cb-hidden');
      els.userStatusLabel.textContent = `Sesión: ${state.user.fullName || state.user.username}${state.user.isCloud ? ' ☁️' : ''}`;
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
    if (window.CB_REFRESH_RADIAL) window.CB_REFRESH_RADIAL();

    // Banner contextual cuando viene desde "Buscar más en Menú Radial" en Inicio
    let pickBanner = document.getElementById('cb-pick-banner');
    if (state.user && state.mode === 'radial' && state.pickingForInicio) {
      if (!pickBanner) {
        pickBanner = document.createElement('div');
        pickBanner.id = 'cb-pick-banner';
        pickBanner.className = 'cb-mode-bar';
        pickBanner.style.background = '#ecfdf5';
        pickBanner.style.borderColor = '#a7f3d0';
        els.wheelSection.parentNode.insertBefore(pickBanner, els.wheelSection);
      }
      const dietLabel = window.CB_GET_ACTIVE_DIET_LABEL();
      pickBanner.innerHTML = `
        <span style="font-size:13px;font-weight:700;color:#065f46;">
          🌿 Elegí un momento y tocá <strong>“✓ Elegir para hoy”</strong> en la receta (${esc(dietLabel)})
        </span>
        <button type="button" id="cb-cancel-pick" class="cb-btn cb-btn-sm cb-btn-outline">← Volver a Inicio</button>
      `;
      pickBanner.classList.remove('cb-hidden');
      document.getElementById('cb-cancel-pick').addEventListener('click', () => {
        state.pickingForInicio = false;
        localStorage.removeItem('comer_bien_picking_for_inicio');
        state.mode = 'comerbien';
        state.cbRoute = 'inicio';
        syncTopbarAndMode();
      });
    } else if (pickBanner) {
      pickBanner.classList.add('cb-hidden');
    }
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
            tab !== 'recover'
              ? `
            <button type="button" id="cb-google-btn" class="cb-btn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#ffffff;color:#1f2937;border:1px solid #d1d5db;font-weight:700;padding:10px 14px;">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41 35.4 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              <span>Continuar con Google</span>
            </button>
            <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--cb-muted);">
              <span style="flex:1;height:1px;background:var(--cb-cream-dark);"></span>
              <span>o con tu correo</span>
              <span style="flex:1;height:1px;background:var(--cb-cream-dark);"></span>
            </div>`
              : ''
          }

          ${
            tab === 'login'
              ? `
            <form id="cb-form-login" style="display:flex;flex-direction:column;gap:12px;">
              <div class="cb-field"><label>Correo electrónico (o usuario demo)</label><input id="cb-l-user" required placeholder="tu@correo.com o sofia" /></div>
              <div class="cb-field"><label>Contraseña</label><input id="cb-l-pass" type="password" required placeholder="Tu contraseña" /></div>
              <div style="text-align:right;"><button type="button" id="cb-go-rec" class="cb-btn cb-btn-ghost cb-btn-sm">¿Olvidaste tu contraseña?</button></div>
              <button type="submit" id="cb-login-submit" class="cb-btn cb-btn-primary">Entrar a mi espacio →</button>
            </form>`
              : tab === 'register'
              ? `
            <form id="cb-form-reg" style="display:flex;flex-direction:column;gap:10px;">
              <div class="cb-field"><label>Tu nombre</label><input id="cb-r-name" required placeholder="Ej: Lucía Fernández" /></div>
              <div class="cb-field"><label>Nombre de usuario</label><input id="cb-r-user" required minlength="3" placeholder="Ej: lucia_uy" /></div>
              <div class="cb-field"><label>Correo electrónico</label><input id="cb-r-mail" type="email" required placeholder="lucia@correo.com" /></div>
              <div class="cb-field"><label>Contraseña (mín. 6 caracteres)</label><input id="cb-r-pass" type="password" required minlength="6" /></div>
              <button type="submit" id="cb-reg-submit" class="cb-btn cb-btn-primary">Crear cuenta en la nube →</button>
            </form>`
              : `
            <form id="cb-form-rec" style="display:flex;flex-direction:column;gap:10px;">
              <div class="cb-field"><label>Correo electrónico registrado</label><input id="cb-rec-mail" type="email" required placeholder="tu@correo.com" /></div>
              <button type="submit" id="cb-rec-submit" class="cb-btn cb-btn-primary">Enviar link de recuperación</button>
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

      document.getElementById('cb-google-btn')?.addEventListener('click', async () => {
        if (!window.QCHCloud) {
          showMsg('Cargando conexión con la nube, probá en un segundo...');
          return;
        }
        const btn = document.getElementById('cb-google-btn');
        if (btn) btn.disabled = true;
        try {
          const { fbUser, cloudDoc } = await window.QCHCloud.loginWithGoogle();
          applyCloudSession(fbUser, cloudDoc);
          state.mode = 'comerbien';
          closeModal();
          syncTopbarAndMode();
        } catch (err) {
          showMsg(err.message);
          if (btn) btn.disabled = false;
        }
      });

      document.getElementById('cb-form-login')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('cb-l-user').value.trim();
        const pass = document.getElementById('cb-l-pass').value;
        const submitBtn = document.getElementById('cb-login-submit');
        if (submitBtn) submitBtn.disabled = true;
        try {
          if (identifier.includes('@') && window.QCHCloud) {
            const { fbUser, cloudDoc } = await window.QCHCloud.loginWithEmail(identifier, pass);
            applyCloudSession(fbUser, cloudDoc);
            state.mode = 'comerbien';
            closeModal();
            syncTopbarAndMode();
          } else {
            state.user = S.login(identifier, pass);
            state.userData = S.getUserData(state.user.username);
            state.mode = 'comerbien';
            closeModal();
            syncTopbarAndMode();
          }
        } catch (err) {
          showMsg(err.message);
          if (submitBtn) submitBtn.disabled = false;
        }
      });

      document.getElementById('cb-form-reg')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('cb-reg-submit');
        if (submitBtn) submitBtn.disabled = true;
        try {
          const payload = {
            username: document.getElementById('cb-r-user').value,
            fullName: document.getElementById('cb-r-name').value,
            email: document.getElementById('cb-r-mail').value,
            password: document.getElementById('cb-r-pass').value,
          };
          if (window.QCHCloud) {
            const { fbUser, cloudDoc } = await window.QCHCloud.registerWithEmail(payload);
            applyCloudSession(fbUser, cloudDoc);
          } else {
            state.user = S.register(payload);
            state.userData = S.getUserData(state.user.username);
          }
          state.mode = 'comerbien';
          closeModal();
          syncTopbarAndMode();
        } catch (err) {
          showMsg(err.message);
          if (submitBtn) submitBtn.disabled = false;
        }
      });

      document.getElementById('cb-form-rec')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('cb-rec-mail').value.trim();
        const submitBtn = document.getElementById('cb-rec-submit');
        if (submitBtn) submitBtn.disabled = true;
        try {
          if (window.QCHCloud) {
            await window.QCHCloud.resetPasswordEmail(email);
            tab = 'login';
            renderAuth();
            showMsg('Te enviamos un correo con el link para restablecer tu contraseña.', true);
          } else {
            showMsg('Necesitás conexión a internet para restablecer tu contraseña.');
          }
        } catch (err) {
          showMsg(err.message);
          if (submitBtn) submitBtn.disabled = false;
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
      { id: 'inicio', label: '🏠 Inicio' },
      { id: 'planificador', label: '📅 Semanal' },
      { id: 'recetas', label: '📖 Económicas' },
      { id: 'que-cocino', label: '🍳 ¿Qué cocino?' },
      { id: 'compras', label: '🛒 Compras' },
      { id: 'educacion', label: '🎓 Guía MSP' },
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
    const ctx = S.getPlanningContext();
    const today = ctx.targetDateIso;
    const todayIdx = ctx.targetDayIndex;
    const dayWord = ctx.dayWord;
    const todayLogs = state.userData.dailyLogs.filter((l) => l.logDate === today);
    const todaySlots = state.userData.menuSlots.filter((s) => s.dayIndex === todayIdx);
    const summary = E.analyzeDayAndSuggest(todayLogs, todaySlots, state.user, ctx.disabledMoments, dayWord);
    const firstName = (state.user.fullName || state.user.username).split(' ')[0];

    const momentsHtml = D.MOMENTS_ORDER.map((m) => {
      const meta = D.MOMENT_LABELS[m];
      const isDisabled = ctx.disabledMoments.includes(m);
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
        <div class="cb-card ${covered ? '' : 'cb-card-dashed'}" style="${isDisabled ? 'opacity:0.55;filter:grayscale(0.5);' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <strong>${meta.emoji} ${meta.label}</strong>
              <small style="color:var(--cb-muted);">(${meta.timeHint})</small>
              ${isDisabled ? '<span class="cb-badge cb-badge-amber" style="margin-left:6px;">Horario pasado</span>' : ''}
            </div>
            <button type="button" class="cb-btn cb-btn-sm cb-btn-secondary" data-qlog="${m}" ${isDisabled ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>+ Registrar</button>
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
                  <span style="font-size:12px;color:var(--cb-muted);">⏱ ${s.recipe.prepMinutes}m · ~$U ${E.getRecipeMarketInfo(s.recipe, s.recipe.servings, state.preferredSupermarket || null).costUyu}</span>
                  <button type="button" class="cb-btn cb-btn-sm cb-btn-secondary" data-acsug="${s.moment}:${s.recipe.id}">Planificar ${dayWord}</button>
                </div>
              </div>
            </article>`
            )
            .join('')}
        </div>
      </div>`
        : '';

    const activePatternObj =
      D.DIET_PATTERNS.find((p) => p.id === (state.user.dietPattern || 'equilibrada')) || D.DIET_PATTERNS[0];

    view.innerHTML = `
      <div class="cb-hero">
        <div style="max-width:620px;">
          <div style="font-size:12px;font-weight:700;color:#c8e6c9;">RESUMEN DE ${dayWord.toUpperCase()} · ${activePatternObj.emoji} ${esc(activePatternObj.label.toUpperCase())}</div>
          <h2>¡Hola, ${esc(firstName)}! ${esc(summary.headline)}</h2>
          <p style="font-size:14px;color:#e6f0ea;margin:0;">${esc(summary.encouragement)}</p>
        </div>
        <div class="cb-hero-stats">
          <div class="cb-stat"><small>Momentos ${dayWord}</small><strong>${summary.coveredMoments.length} / 4</strong></div>
          <div class="cb-stat"><small>Meta de agua</small><strong>💧 ${state.user.habits.waterGlassesGoal}</strong></div>
        </div>
      </div>

      <div class="cb-section-head">
        <h3>Tus 4 momentos de ${dayWord}</h3>
        <button type="button" class="cb-btn cb-btn-sm cb-btn-outline" id="cb-go-radial">🎡 Buscar más en Menú Radial</button>
      </div>
      <div class="cb-grid-2">${momentsHtml}</div>
      ${sugHtml}
    `;

    document.getElementById('cb-go-radial').addEventListener('click', () => {
      state.pickingForInicio = true;
      localStorage.setItem('comer_bien_picking_for_inicio', '1');
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
    const chainId = state.preferredSupermarket || null;
    const weeklyCost = slots.reduce((acc, s) => {
      if (s.status === 'skipped' || !s.recipeId) return acc;
      const rec = D.RECIPES.find((r) => r.id === s.recipeId);
      return rec ? acc + E.getRecipeMarketInfo(rec, s.servings || 2, chainId).costUyu : acc;
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

  // 3. RECETAS ECONÓMICAS (con Rueda Radial de Presupuesto -> Momento -> Enfoque)
  const RECIPE_WHEEL_LEVELS = {
    1: {
      title: 'PASO 1 · PRESUPUESTO',
      items: [
        { id: '120', label: 'Hasta $U 120', emoji: '🪙', color: '#DCFCE7' },
        { id: '220', label: 'Hasta $U 220', emoji: '💵', color: '#FEF3C7' },
        { id: '350', label: 'Hasta $U 350', emoji: '🛒', color: '#E0F2FE' },
        { id: 'all', label: 'Todos los $U', emoji: '🌟', color: '#FCE7F3' },
      ],
    },
    2: {
      title: 'PASO 2 · MOMENTO',
      items: [
        { id: 'desayuno', label: 'Desayuno', emoji: '☀️', color: '#FEF3C7' },
        { id: 'almuerzo', label: 'Almuerzo', emoji: '🍽️', color: '#DCFCE7' },
        { id: 'merienda', label: 'Merienda', emoji: '🧉', color: '#E0F2FE' },
        { id: 'cena', label: 'Cena', emoji: '🌙', color: '#EDE9FE' },
        { id: 'all', label: 'Todos', emoji: '✨', color: '#FCE7F3' },
      ],
    },
    3: {
      title: 'PASO 3 · ENFOQUE',
      items: [
        { id: 'verduras', label: 'Con verduras', emoji: '🥦', color: '#DCFCE7' },
        { id: 'legumbres', label: 'Legumbres', emoji: '🫘', color: '#FFEDD5' },
        { id: 'rapido', label: 'Rápidas ≤20m', emoji: '⏱️', color: '#FEF3C7' },
        { id: 'all', label: 'Variado', emoji: '🌿', color: '#E0F2FE' },
      ],
    },
  };

  function filterRecipesList() {
    const f = state.recipeFilters;
    const q = f.query.trim().toLowerCase();
    return D.RECIPES.filter((r) => {
      if (f.respectProfile && !E.isRecipeCompatible(r, state.user)) return false;
      if (f.moment !== 'all' && r.moment !== f.moment) return false;
      if (f.maxCost !== 'all' && E.getRecipeMarketInfo(r, r.servings, state.preferredSupermarket || null).costUyu > Number(f.maxCost)) return false;
      if (f.focus === 'verduras' && !r.foodGroups.includes('verduras')) return false;
      if (f.focus === 'legumbres' && !r.foodGroups.includes('legumbres')) return false;
      if (f.focus === 'rapido' && r.prepMinutes > 20) return false;
      if (f.onlyFav && !state.userData.favorites.includes(r.id)) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.ingredients.some((i) => i.name.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  function buildRecipeWheelSvg(matchCount) {
    const cx = 210;
    const cy = 210;
    const rOuter = 192;
    const rMid = 96;
    const rInner = 54;
    const level = state.recipeWheelStep;
    const cfg = RECIPE_WHEEL_LEVELS[level];
    const segments = cfg.items;
    const f = state.recipeFilters;

    const polar = (r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    const ringArc = (rIn, rOut, a1, a2) => {
      const [x1, y1] = polar(rOut, a1);
      const [x2, y2] = polar(rOut, a2);
      const [x3, y3] = polar(rIn, a2);
      const [x4, y4] = polar(rIn, a1);
      const large = a2 - a1 > Math.PI ? 1 : 0;
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rOut} ${rOut} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y3.toFixed(1)} A ${rIn} ${rIn} 0 ${large} 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`;
    };
    const outerRimArc = (r, a1, a2) => {
      const [x1, y1] = polar(r, a1);
      const [x2, y2] = polar(r, a2);
      const large = a2 - a1 > Math.PI ? 1 : 0;
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    };

    const accentPalette = ['#22C55E', '#F59E0B', '#06B6D4', '#EC4899', '#3B82F6'];
    const total = segments.length;
    const step = (2 * Math.PI) / total;

    const defs = segments
      .map(
        (item, idx) => `
        <radialGradient id="cbr-grad-${idx}" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${item.color}" stop-opacity="1" />
        </radialGradient>`
      )
      .join('');

    const wedges = segments
      .map((item, idx) => {
        const a1 = -Math.PI / 2 + idx * step + 0.012;
        const a2 = -Math.PI / 2 + (idx + 1) * step - 0.012;
        const mid = (a1 + a2) / 2;
        const accent = accentPalette[idx % accentPalette.length];
        const [tx, ty] = polar((rOuter + rMid) / 2 + 2, mid);

        const activeVal = level === 1 ? f.maxCost : level === 2 ? f.moment : f.focus;
        const isSelected = activeVal === item.id;

        return `
        <g class="cb-pantry-wedge" data-rw-seg="${item.id}" role="button" tabindex="0">
          <path d="${ringArc(rMid + 2, rOuter, a1, a2)}" fill="${isSelected ? '#D1FAE5' : `url(#cbr-grad-${idx})`}" stroke="${isSelected ? '#10B981' : '#E5E7EB'}" stroke-width="${isSelected ? '1.8' : '1'}" />
          <path d="${outerRimArc(rOuter - 1.5, a1, a2)}" fill="none" stroke="${isSelected ? '#059669' : accent}" stroke-width="${isSelected ? '4.5' : '3.5'}" stroke-linecap="round" />
          <circle cx="${tx.toFixed(1)}" cy="${(ty - 12).toFixed(1)}" r="15" fill="${isSelected ? '#059669' : accent}" />
          <text x="${tx.toFixed(1)}" y="${(ty - 11).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="14">${item.emoji}</text>
          <text x="${tx.toFixed(1)}" y="${(ty + 11).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="700" fill="${isSelected ? '#064E3B' : '#1F2933'}">${item.label}</text>
        </g>`;
      })
      .join('');

    const stepLabels = [
      { id: 1, text: '1 · Presupuesto' },
      { id: 2, text: '2 · Momento' },
      { id: 3, text: '3 · Enfoque' },
    ];
    const stepAngle = (2 * Math.PI) / 3;
    const stepRing = stepLabels
      .map((st, i) => {
        const a1 = -Math.PI / 2 - stepAngle / 2 + i * stepAngle + 0.02;
        const a2 = -Math.PI / 2 - stepAngle / 2 + (i + 1) * stepAngle - 0.02;
        const mid = (a1 + a2) / 2;
        const isActive = st.id === level;
        const [lx, ly] = polar((rMid + rInner) / 2, mid);
        let rot = (mid * 180) / Math.PI + 90;
        if (rot > 90 && rot < 270) rot += 180;

        return `
        <g data-rw-step="${st.id}" style="cursor:pointer;">
          <path d="${ringArc(rInner, rMid, a1, a2)}" fill="${isActive ? '#FFFFFF' : '#F1F5F9'}" stroke="#CBD5E1" stroke-width="1" />
          ${isActive ? `<path d="${outerRimArc(rMid - 1.5, a1, a2)}" fill="none" stroke="#2F6F4E" stroke-width="3" stroke-linecap="round" />` : ''}
          <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="8.8" font-weight="${isActive ? '800' : '600'}" fill="${isActive ? '#2F6F4E' : '#64748B'}" transform="rotate(${rot.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})">${st.text}</text>
        </g>`;
      })
      .join('');

    return `
      <svg viewBox="0 0 420 420" class="cb-pantry-svg" style="max-width:400px;" aria-label="Rueda de recetas económicas">
        <defs>
          ${defs}
          <filter id="cbr-hub-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12" />
          </filter>
        </defs>
        ${wedges}
        ${stepRing}
        <g class="cb-pantry-center" id="cb-rw-center-btn">
          <circle cx="${cx}" cy="${cy}" r="${rInner - 4}" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#cbr-hub-shadow)" />
          <text x="${cx}" y="${cy - 22}" text-anchor="middle" font-size="7.2" font-weight="800" fill="#64748B">${cfg.title}</text>
          <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="18">📖</text>
          <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#1E293B">Ver recetas</text>
          <text x="${cx}" y="${cy + 28}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#2F6F4E">${matchCount} encontradas ↓</text>
        </g>
      </svg>`;
  }

  function renderRecetas(view) {
    const f = state.recipeFilters;
    const list = filterRecipesList();

    const crumbParts = [
      f.maxCost === 'all' ? 'Todos los $U' : `Hasta $U ${f.maxCost}`,
      f.moment === 'all' ? 'Todos los momentos' : D.MOMENT_LABELS[f.moment].label,
      f.focus === 'all' ? 'Enfoque variado' : f.focus,
    ];

    view.innerHTML = `
      <div class="cb-card" style="margin-bottom:16px;">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:700;color:var(--cb-forest);">
            ${crumbParts.join(' → ')}
          </div>
          <div style="display:flex;gap:6px;">
            ${state.recipeWheelStep > 1 ? '<button type="button" class="cb-btn cb-btn-sm cb-btn-outline" id="cb-rw-back">← Atrás</button>' : ''}
            <button type="button" class="cb-btn cb-btn-sm cb-btn-ghost" id="cb-rw-reset">Reiniciar filtros</button>
          </div>
        </div>

        <div class="cb-pantry-wheel-wrap">
          <div>${buildRecipeWheelSvg(list.length)}</div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <h3 style="margin:0 0 4px;">Buscador Económico Radial</h3>
              <p style="font-size:13px;color:var(--cb-muted);margin:0;">
                Elegí presupuesto en $U, momento del día y enfoque en la rueda, o buscá por palabra clave.
              </p>
            </div>
            <div class="cb-field">
              <label>Buscar por nombre o ingrediente</label>
              <input id="cbr-q" value="${esc(f.query)}" placeholder="Ej: lentejas, boniato, avena..." />
            </div>
            <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:13px;">
              <label style="cursor:pointer;"><input type="checkbox" id="cbr-resp" ${f.respectProfile ? 'checked' : ''} /> Respetar mis restricciones</label>
              <label style="cursor:pointer;"><input type="checkbox" id="cbr-fav" ${f.onlyFav ? 'checked' : ''} /> Solo favoritas (${state.userData.favorites.length})</label>
            </div>
          </div>
        </div>
      </div>

      <div id="cb-rec-results" class="cb-grid-3">
        ${
          list.length
            ? list
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
                      <span class="cb-badge cb-badge-sage" title="Precio alimentado de supermercados de Montevideo">~$U ${E.getRecipeMarketInfo(r, r.servings, state.preferredSupermarket || null).costUyu} (${E.getRecipeMarketInfo(r, r.servings, state.preferredSupermarket || null).chainName})</span>
                    </div>
                  </div>
                </article>`
                )
                .join('')
            : '<div class="cb-card">No encontramos recetas con esa combinación. Probá reiniciar filtros.</div>'
        }
      </div>
    `;

    view.querySelectorAll('[data-rw-seg]').forEach((g) =>
      g.addEventListener('click', () => {
        const val = g.dataset.rwSeg;
        if (state.recipeWheelStep === 1) {
          state.recipeFilters.maxCost = val;
          state.recipeWheelStep = 2;
        } else if (state.recipeWheelStep === 2) {
          state.recipeFilters.moment = val;
          state.recipeWheelStep = 3;
        } else {
          state.recipeFilters.focus = val;
        }
        renderCBStage();
      })
    );

    view.querySelectorAll('[data-rw-step]').forEach((g) =>
      g.addEventListener('click', () => {
        state.recipeWheelStep = Number(g.dataset.rwStep);
        renderCBStage();
      })
    );

    document.getElementById('cb-rw-back')?.addEventListener('click', () => {
      state.recipeWheelStep = Math.max(1, state.recipeWheelStep - 1);
      renderCBStage();
    });

    document.getElementById('cb-rw-reset')?.addEventListener('click', () => {
      state.recipeFilters = { ...state.recipeFilters, query: '', moment: 'all', maxCost: 'all', focus: 'all' };
      state.recipeWheelStep = 1;
      renderCBStage();
    });

    document.getElementById('cb-rw-center-btn')?.addEventListener('click', () => {
      document.getElementById('cb-rec-results')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('cbr-q').addEventListener('input', (e) => {
      state.recipeFilters.query = e.target.value;
      renderCBStage();
      const el = document.getElementById('cbr-q');
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
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

  // 4. ¿QUÉ COCINO HOY? (Rueda radial multinivel: 1. Grupo -> 2. Subtipo -> 3. Ingrediente)
  const PANTRY_TREE = [
    {
      id: 'verduras',
      label: 'Verduras',
      emoji: '🥦',
      color: '#DCFCE7',
      subgroups: [
        {
          id: 'raices',
          label: 'Papa y Zapallo',
          emoji: '🥔',
          color: '#FEF3C7',
          items: [
            { id: 'papa', label: 'Papa', emoji: '🥔', color: '#FDE68A' },
            { id: 'boniato', label: 'Boniato', emoji: '🍠', color: '#FED7AA' },
            { id: 'zapallo', label: 'Zapallo', emoji: '🎃', color: '#FFEDD5' },
            { id: 'zanahoria', label: 'Zanahoria', emoji: '🥕', color: '#FED7AA' },
          ],
        },
        {
          id: 'hojas',
          label: 'Hojas verdes',
          emoji: '🥬',
          color: '#D1FAE5',
          items: [
            { id: 'acelga', label: 'Acelga', emoji: '🥬', color: '#A7F3D0' },
            { id: 'espinaca', label: 'Espinaca', emoji: '🌿', color: '#BBF7D0' },
            { id: 'brócoli', label: 'Brócoli', emoji: '🥦', color: '#DCFCE7' },
            { id: 'lechuga', label: 'Lechuga', emoji: '🥗', color: '#D1FAE5' },
          ],
        },
        {
          id: 'frescas',
          label: 'Tomate y Cebolla',
          emoji: '🍅',
          color: '#FEE2E2',
          items: [
            { id: 'tomate', label: 'Tomate', emoji: '🍅', color: '#FECACA' },
            { id: 'cebolla', label: 'Cebolla', emoji: '🧅', color: '#FCE7F3' },
            { id: 'morrón', label: 'Morrón', emoji: '🫑', color: '#DCFCE7' },
            { id: 'berenjena', label: 'Berenjena', emoji: '🍆', color: '#EDE9FE' },
          ],
        },
      ],
    },
    {
      id: 'frutas',
      label: 'Frutas',
      emoji: '🍎',
      color: '#FFE4E6',
      subgroups: [
        {
          id: 'citricos',
          label: 'Cítricos',
          emoji: '🍊',
          color: '#FFEDD5',
          items: [
            { id: 'naranja', label: 'Naranja', emoji: '🍊', color: '#FED7AA' },
            { id: 'limón', label: 'Limón', emoji: '🍋', color: '#FEF9C3' },
            { id: 'mandarina', label: 'Mandarina', emoji: '🍊', color: '#FFEDD5' },
          ],
        },
        {
          id: 'estacion',
          label: 'Dulces',
          emoji: '🍌',
          color: '#FEF3C7',
          items: [
            { id: 'banana', label: 'Banana', emoji: '🍌', color: '#FEF08A' },
            { id: 'manzana', label: 'Manzana', emoji: '🍎', color: '#FFE4E6' },
            { id: 'pera', label: 'Pera', emoji: '🍐', color: '#ECFCCB' },
          ],
        },
      ],
    },
    {
      id: 'proteinas',
      label: 'Proteínas',
      emoji: '🥚',
      color: '#FEF3C7',
      subgroups: [
        {
          id: 'carnes_huevo',
          label: 'Huevo y Carnes',
          emoji: '🍗',
          color: '#FFEDD5',
          items: [
            { id: 'huevo', label: 'Huevo', emoji: '🥚', color: '#FEF3C7' },
            { id: 'pollo', label: 'Pollo', emoji: '🍗', color: '#FED7AA' },
            { id: 'merluza', label: 'Merluza', emoji: '🐟', color: '#E0F2FE' },
            { id: 'atún', label: 'Atún', emoji: '🥫', color: '#DBEAFE' },
          ],
        },
        {
          id: 'lacteos',
          label: 'Lácteos',
          emoji: '🧀',
          color: '#E0F2FE',
          items: [
            { id: 'queso', label: 'Queso', emoji: '🧀', color: '#FEF3C7' },
            { id: 'ricota', label: 'Ricota', emoji: '🥛', color: '#F3F4F6' },
            { id: 'yogur', label: 'Yogur', emoji: '🥣', color: '#E0F2FE' },
            { id: 'leche', label: 'Leche', emoji: '🥛', color: '#EFF6FF' },
          ],
        },
      ],
    },
    {
      id: 'almacen',
      label: 'Legumbres y Arroz',
      emoji: '🫘',
      color: '#FFEDD5',
      subgroups: [
        {
          id: 'legumbres',
          label: 'Legumbres',
          emoji: '🫘',
          color: '#FDE68A',
          items: [
            { id: 'lentejas', label: 'Lentejas', emoji: '🫘', color: '#FED7AA' },
            { id: 'garbanzos', label: 'Garbanzos', emoji: '🧆', color: '#FEF3C7' },
            { id: 'porotos', label: 'Porotos', emoji: '🫘', color: '#E0E7FF' },
            { id: 'arvejas', label: 'Arvejas', emoji: '🫛', color: '#DCFCE7' },
          ],
        },
        {
          id: 'cereales',
          label: 'Cereales y Pan',
          emoji: '🌾',
          color: '#FEF9C3',
          items: [
            { id: 'arroz', label: 'Arroz', emoji: '🍚', color: '#F3F4F6' },
            { id: 'avena', label: 'Avena', emoji: '🌾', color: '#FEF3C7' },
            { id: 'fideos', label: 'Fideos', emoji: '🍝', color: '#FDE68A' },
            { id: 'pan', label: 'Pan', emoji: '🍞', color: '#FFEDD5' },
          ],
        },
      ],
    },
    {
      id: 'extras',
      label: 'Grasas y Semillas',
      emoji: '🥑',
      color: '#ECFCCB',
      subgroups: [
        {
          id: 'saludables',
          label: 'Palta y Semillas',
          emoji: '🥑',
          color: '#D9F99D',
          items: [
            { id: 'palta', label: 'Palta', emoji: '🥑', color: '#DCFCE7' },
            { id: 'maní', label: 'Maní', emoji: '🥜', color: '#FED7AA' },
            { id: 'semillas', label: 'Semillas', emoji: '🌻', color: '#FEF9C3' },
            { id: 'choclo', label: 'Choclo', emoji: '🌽', color: '#FEF08A' },
          ],
        },
      ],
    },
  ];

  function isIngredientAllowedForProfile(ingId, profile) {
    const pattern = (profile.dietPattern || 'equilibrada').toLowerCase();
    const restrictions = (profile.restrictions || []).map((r) => r.toLowerCase());
    const has = (kw) => restrictions.some((r) => r.includes(kw));

    const meatFish = ['pollo', 'merluza', 'atún'];
    const dairy = ['queso', 'ricota', 'yogur', 'leche'];
    const gluten = ['avena', 'fideos', 'pan'];

    if ((pattern === 'vegana' || has('vegano')) && (meatFish.includes(ingId) || dairy.includes(ingId) || ingId === 'huevo')) {
      return false;
    }
    if ((pattern === 'vegetariana' || has('vegetariano')) && meatFish.includes(ingId)) {
      return false;
    }
    if ((pattern === 'sin_lactosa' || has('lactosa') || has('lácteo')) && dairy.includes(ingId)) {
      return false;
    }
    if ((pattern === 'sin_gluten' || has('gluten') || has('celiaqu')) && gluten.includes(ingId)) {
      return false;
    }
    if ((has('huevo')) && ingId === 'huevo') return false;
    if ((has('pescado') || has('marisco')) && ['merluza', 'atún'].includes(ingId)) return false;
    if ((has('frutos secos') || has('maní')) && ingId === 'maní') return false;
    if ((pattern === 'bajo_sodio' || has('sodio')) && ingId === 'atún') return false;
    return true;
  }

  function getFilteredPantryTree(profile) {
    return PANTRY_TREE.map((g) => {
      const subs = g.subgroups
        .map((s) => ({
          ...s,
          items: s.items.filter((it) => isIngredientAllowedForProfile(it.id, profile)),
        }))
        .filter((s) => s.items.length > 0);
      return { ...g, subgroups: subs };
    }).filter((g) => g.subgroups.length > 0);
  }

  function buildPantryWheelSvg(pantry, matchCount) {
    const cx = 210;
    const cy = 210;
    const rOuter = 192;
    const rMid = 96;
    const rInner = 54;
    const path = state.pantryWheelPath;
    const tree = getFilteredPantryTree(state.user);

    let level = 1;
    let segments = tree;
    let stepTitle = 'PASO 1 · GRUPO';

    const groupObj = path.group ? tree.find((g) => g.id === path.group) : null;
    const subObj =
      groupObj && path.subgroup ? groupObj.subgroups.find((s) => s.id === path.subgroup) : null;

    if (subObj) {
      level = 3;
      segments = subObj.items;
      stepTitle = 'PASO 3 · INGREDIENTES';
    } else if (groupObj) {
      level = 2;
      segments = groupObj.subgroups;
      stepTitle = 'PASO 2 · SUBTIPO';
    }

    const polar = (r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];

    const ringArc = (rIn, rOut, a1, a2) => {
      const [x1, y1] = polar(rOut, a1);
      const [x2, y2] = polar(rOut, a2);
      const [x3, y3] = polar(rIn, a2);
      const [x4, y4] = polar(rIn, a1);
      const large = a2 - a1 > Math.PI ? 1 : 0;
      return [
        `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
        `A ${rOut} ${rOut} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
        `L ${x3.toFixed(1)} ${y3.toFixed(1)}`,
        `A ${rIn} ${rIn} 0 ${large} 0 ${x4.toFixed(1)} ${y4.toFixed(1)}`,
        'Z',
      ].join(' ');
    };

    const outerRimArc = (r, a1, a2) => {
      const [x1, y1] = polar(r, a1);
      const [x2, y2] = polar(r, a2);
      const large = a2 - a1 > Math.PI ? 1 : 0;
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    };

    const accentPalette = ['#22C55E', '#F59E0B', '#06B6D4', '#EC4899', '#3B82F6', '#8B5CF6'];
    const total = segments.length;
    const step = (2 * Math.PI) / total;

    const defs = segments
      .map(
        (item, idx) => `
          <radialGradient id="cb-grad-${idx}" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
            <stop offset="100%" stop-color="${item.color}" stop-opacity="1" />
          </radialGradient>
          <linearGradient id="cb-sel-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2F6F4E" />
            <stop offset="100%" stop-color="#22533A" />
          </linearGradient>`
      )
      .join('');

    const wedges = segments
      .map((item, idx) => {
        const a1 = -Math.PI / 2 + idx * step + 0.012;
        const a2 = -Math.PI / 2 + (idx + 1) * step - 0.012;
        const mid = (a1 + a2) / 2;
        const accent = accentPalette[idx % accentPalette.length];
        const isSelected = level === 3 && pantry.includes(item.id);

        const [tx, ty] = polar((rOuter + rMid) / 2 + 2, mid);
        const subText =
          level === 1
            ? `${item.subgroups.length} subtipos`
            : level === 2
            ? `${item.items.length} ing.`
            : isSelected
            ? '✓ Elegido'
            : 'Tocar';

        return `
        <g class="cb-pantry-wedge" data-wheel-seg="${item.id}" data-wheel-level="${level}" role="button" tabindex="0">
          <path d="${ringArc(rMid + 2, rOuter, a1, a2)}" fill="${isSelected ? '#D1FAE5' : `url(#cb-grad-${idx})`}" stroke="${isSelected ? '#10B981' : '#E5E7EB'}" stroke-width="${isSelected ? '1.8' : '1'}" />
          <path d="${outerRimArc(rOuter - 1.5, a1, a2)}" fill="none" stroke="${isSelected ? '#059669' : accent}" stroke-width="${isSelected ? '4.5' : '3.5'}" stroke-linecap="round" />
          <circle cx="${tx.toFixed(1)}" cy="${(ty - 14).toFixed(1)}" r="15" fill="${isSelected ? '#059669' : accent}" />
          <text x="${tx.toFixed(1)}" y="${(ty - 13).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="14">${item.emoji}</text>
          <text x="${tx.toFixed(1)}" y="${(ty + 9).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="11.5" font-weight="700" fill="${isSelected ? '#064E3B' : '#1F2933'}">${item.label}</text>
          <rect x="${(tx - 24).toFixed(1)}" y="${(ty + 18).toFixed(1)}" width="48" height="15" rx="7.5" fill="${isSelected ? 'rgba(5,150,105,0.16)' : 'rgba(15,23,42,0.06)'}" />
          <text x="${tx.toFixed(1)}" y="${(ty + 25.5).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="8.5" font-weight="700" fill="${isSelected ? '#065F46' : '#475569'}">${subText}</text>
        </g>`;
      })
      .join('');

    const stepLabels = [
      { id: 1, text: '1 · Grupo' },
      { id: 2, text: '2 · Subtipo' },
      { id: 3, text: '3 · Ingredientes' },
    ];
    const stepAngle = (2 * Math.PI) / 3;
    const stepRing = stepLabels
      .map((st, i) => {
        const a1 = -Math.PI / 2 - stepAngle / 2 + i * stepAngle + 0.02;
        const a2 = -Math.PI / 2 - stepAngle / 2 + (i + 1) * stepAngle - 0.02;
        const mid = (a1 + a2) / 2;
        const isActive = st.id === level;
        const [lx, ly] = polar((rMid + rInner) / 2, mid);
        let rot = (mid * 180) / Math.PI + 90;
        if (rot > 90 && rot < 270) rot += 180;

        return `
        <g data-wheel-step="${st.id}" style="cursor:${st.id < level ? 'pointer' : 'default'};">
          <path d="${ringArc(rInner, rMid, a1, a2)}" fill="${isActive ? '#FFFFFF' : '#F1F5F9'}" stroke="#CBD5E1" stroke-width="1" />
          ${isActive ? `<path d="${outerRimArc(rMid - 1.5, a1, a2)}" fill="none" stroke="#2F6F4E" stroke-width="3" stroke-linecap="round" />` : ''}
          <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="${isActive ? '800' : '600'}" fill="${isActive ? '#2F6F4E' : '#64748B'}" transform="rotate(${rot.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})">${st.text}</text>
        </g>`;
      })
      .join('');

    return `
      <svg viewBox="0 0 420 420" class="cb-pantry-svg" style="max-width:400px;" aria-label="Rueda multinivel de ingredientes">
        <defs>
          ${defs}
          <filter id="cb-hub-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12" />
          </filter>
        </defs>
        ${wedges}
        ${stepRing}
        <g class="cb-pantry-center" id="cb-wheel-center-btn">
          <circle cx="${cx}" cy="${cy}" r="${rInner - 4}" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#cb-hub-shadow)" />
          <text x="${cx}" y="${cy - 22}" text-anchor="middle" font-size="7.5" font-weight="800" fill="#64748B" letter-spacing="0.4">${stepTitle}</text>
          <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="18">🍳</text>
          <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#1E293B">Ver recetas</text>
          <text x="${cx}" y="${cy + 28}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#2F6F4E">${matchCount} posibles (${pantry.length} ing.)</text>
        </g>
      </svg>`;
  }

  function renderQueCocino(view) {
    const pantry = state.pantry.filter((id) => isIngredientAllowedForProfile(id, state.user));
    state.pantry = pantry;
    const tree = getFilteredPantryTree(state.user);
    const path = state.pantryWheelPath;
    const groupObj = path.group ? tree.find((g) => g.id === path.group) : null;
    const subObj =
      groupObj && path.subgroup ? groupObj.subgroups.find((s) => s.id === path.subgroup) : null;

    const activePatternObj =
      D.DIET_PATTERNS.find((p) => p.id === (state.user.dietPattern || 'equilibrada')) || D.DIET_PATTERNS[0];

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

    const crumb = ['1. Grupos'];
    if (groupObj) crumb.push(`${groupObj.emoji} ${groupObj.label}`);
    if (subObj) crumb.push(`${subObj.emoji} ${subObj.label}`);

    view.innerHTML = `
      <div class="cb-card" style="margin-bottom:16px;">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:700;color:var(--cb-forest);">
            ${crumb.join(' → ')}
          </div>
          <div style="display:flex;gap:6px;">
            ${
              path.group
                ? '<button type="button" class="cb-btn cb-btn-sm cb-btn-outline" id="cb-pw-back">← Atrás</button>'
                : ''
            }
            ${
              path.group
                ? '<button type="button" class="cb-btn cb-btn-sm cb-btn-ghost" id="cb-pw-reset">Reiniciar rueda</button>'
                : ''
            }
          </div>
        </div>

        <div class="cb-pantry-wheel-wrap">
          <div>
            ${buildPantryWheelSvg(pantry, matches.length)}
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:4px;">
                <h3 style="margin:0;">Explorá por categoría en el círculo</h3>
                <span class="cb-badge cb-badge-sage">${activePatternObj.emoji} ${esc(activePatternObj.label)}</span>
              </div>
              <p style="font-size:13px;color:var(--cb-muted);margin:0;">
                Solo mostramos ingredientes y recetas compatibles con tu tipo de alimentación.
              </p>
            </div>
            <form id="cb-pform" style="display:flex;gap:8px;">
              <input id="cb-pinp" placeholder="O escribí otro ingrediente..." style="flex:1;padding:9px 12px;border-radius:10px;border:1px solid #d4c8ae;" />
              <button type="submit" class="cb-btn cb-btn-primary">+ Agregar</button>
            </form>
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--cb-muted);margin-bottom:6px;">Tus ingredientes seleccionados (${pantry.length}):</div>
              <div class="cb-chip-row">
                ${
                  pantry.length
                    ? pantry.map((p) => `<button type="button" class="cb-chip active" data-prem="${esc(p)}">${esc(p)} ✕</button>`).join('')
                    : '<span style="font-size:12px;color:var(--cb-muted);">Ninguno seleccionado todavía.</span>'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="cb-pantry-results" class="cb-grid-2">
        ${
          matches.length
            ? matches
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
                .join('')
            : '<div class="cb-card">Elegí ingredientes en la rueda para ver recetas posibles.</div>'
        }
      </div>
    `;

    view.querySelectorAll('[data-wheel-seg]').forEach((g) =>
      g.addEventListener('click', () => {
        const segId = g.dataset.wheelSeg;
        const lvl = Number(g.dataset.wheelLevel);
        if (lvl === 1) {
          state.pantryWheelPath = { group: segId, subgroup: null };
        } else if (lvl === 2) {
          state.pantryWheelPath = { ...state.pantryWheelPath, subgroup: segId };
        } else if (lvl === 3) {
          if (state.pantry.includes(segId)) {
            state.pantry = state.pantry.filter((x) => x !== segId);
          } else {
            state.pantry.push(segId);
          }
        }
        renderCBStage();
      })
    );

    document.getElementById('cb-pw-back')?.addEventListener('click', () => {
      if (state.pantryWheelPath.subgroup) {
        state.pantryWheelPath = { ...state.pantryWheelPath, subgroup: null };
      } else {
        state.pantryWheelPath = { group: null, subgroup: null };
      }
      renderCBStage();
    });

    document.getElementById('cb-pw-reset')?.addEventListener('click', () => {
      state.pantryWheelPath = { group: null, subgroup: null };
      renderCBStage();
    });

    view.querySelectorAll('[data-wheel-step]').forEach((g) =>
      g.addEventListener('click', () => {
        const stepNum = Number(g.dataset.wheelStep);
        if (stepNum === 1) {
          state.pantryWheelPath = { group: null, subgroup: null };
          renderCBStage();
        } else if (stepNum === 2 && state.pantryWheelPath.group) {
          state.pantryWheelPath = { ...state.pantryWheelPath, subgroup: null };
          renderCBStage();
        }
      })
    );

    document.getElementById('cb-wheel-center-btn')?.addEventListener('click', () => {
      document.getElementById('cb-pantry-results')?.scrollIntoView({ behavior: 'smooth' });
    });

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
    bindCBRecipes(view);
  }

  // 5. LISTA DE COMPRAS (Precios autoalimentados por Supermercados de Montevideo)
  function renderCompras(view) {
    const chainId = state.preferredSupermarket || null;
    const chains = typeof MDEO_SUPERMARKETS !== 'undefined' ? MDEO_SUPERMARKETS : [];

    // Recalcular precios en vivo desde el comparador de supermercados
    const items = state.userData.shoppingList.map((item) => {
      if (typeof window.estimateItemSupermarketUYU === 'function') {
        const est = window.estimateItemSupermarketUYU(item.name, item.quantity, item.unit, chainId);
        return {
          ...item,
          estimatedUyu: est.priceUYU,
          chainName: est.chainName,
          gondolaUrl: est.gondolaUrl,
        };
      }
      return item;
    });
    const total = items.reduce((s, i) => s + (i.estimatedUyu || 0), 0);

    view.innerHTML = `
      <div class="cb-section-head">
        <div>
          <h3>Lista de Compras</h3>
          <small style="color:var(--cb-muted);">Total estimado en supermercados: <strong>$U ${total.toLocaleString('es-UY')}</strong></small>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <select id="cb-sh-chain" style="padding:8px 12px;border-radius:10px;border:1px solid #d4c8ae;font-size:13px;background:#fff;">
            <option value="" ${!chainId ? 'selected' : ''}>🏆 Mejor precio (todos los súper)</option>
            ${chains.map((c) => `<option value="${c.id}" ${chainId === c.id ? 'selected' : ''}>🏪 ${esc(c.name)}</option>`).join('')}
          </select>
          <button type="button" class="cb-btn cb-btn-primary" id="cb-sh-sync">🔄 Generar desde mi menú</button>
          ${items.some((i) => i.checked) ? '<button type="button" class="cb-btn cb-btn-outline" id="cb-sh-clr">Limpiar comprados</button>' : ''}
        </div>
      </div>

      <form id="cb-sh-add" class="cb-card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px;align-items:end;">
        <div class="cb-field"><label>Producto</label><input id="cb-sa-n" required placeholder="Ej: Yerba, arroz..." /></div>
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
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--cb-cream-dark);${i.checked ? 'opacity:0.55;text-decoration:line-through;' : ''}">
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;">
                    <input type="checkbox" data-shchk="${i.id}" ${i.checked ? 'checked' : ''} />
                    <div style="font-size:13px;">
                      <strong>${esc(i.name)}</strong> (${i.quantity} ${esc(i.unit)})
                      <div style="font-size:11px;color:var(--cb-muted);">~$U ${i.estimatedUyu} · ${esc(i.chainName || 'Súper Mdeo')}</div>
                    </div>
                  </label>
                  <div style="display:flex;align-items:center;gap:4px;">
                    ${i.gondolaUrl ? `<a href="${i.gondolaUrl}" target="_blank" rel="noopener" class="cb-btn cb-btn-sm cb-btn-outline" title="Buscar en góndola online" style="text-decoration:none;">🛒</a>` : ''}
                    <button type="button" class="cb-btn cb-btn-sm cb-btn-ghost" data-shdel="${i.id}">✕</button>
                  </div>
                </div>`
                )
                .join('')}
            </div>`;
        }).join('')}
      </div>
    `;

    document.getElementById('cb-sh-chain').addEventListener('change', (e) => {
      state.preferredSupermarket = e.target.value;
      renderCBStage();
    });

    document.getElementById('cb-sh-sync').addEventListener('click', () => {
      const fromMenu = E.buildShoppingListFromMenu(state.userData.menuSlots, state.preferredSupermarket || null);
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
    const activePattern = u.dietPattern || 'equilibrada';
    const activePatternObj = D.DIET_PATTERNS.find((p) => p.id === activePattern) || D.DIET_PATTERNS[0];

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
          <strong style="display:block;margin-bottom:4px;">Tipo de alimentación o dieta actual</strong>
          <p style="font-size:12px;color:var(--cb-muted);margin:0 0 10px;">
            Las recetas, sugerencias, menú semanal y rueda de ingredientes se adaptarán automáticamente a tu elección.
          </p>
          <div class="cb-chip-row">
            ${D.DIET_PATTERNS.map(
              (p) =>
                `<button type="button" class="cb-chip ${activePattern === p.id ? 'active' : ''}" data-pf-diet="${p.id}" title="${esc(p.desc)}">${p.emoji} ${esc(p.label)}</button>`
            ).join('')}
          </div>
          <div id="cb-pf-diet-note" style="font-size:12px;color:${activePatternObj.clinical ? '#78350f' : 'var(--cb-muted)'};margin-top:8px;">
            ${activePatternObj.clinical ? '⚕️ Recordá que las situaciones clínicas requieren orientación profesional.' : esc(activePatternObj.desc)}
          </div>
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
    view.querySelectorAll('[data-pf-diet]').forEach((b) =>
      b.addEventListener('click', () => {
        const val = b.dataset.pfDiet;
        state.user.dietPattern = val;
        view.querySelectorAll('[data-pf-diet]').forEach((btn) =>
          btn.classList.toggle('active', btn.dataset.pfDiet === val)
        );
        const obj = D.DIET_PATTERNS.find((p) => p.id === val);
        const noteEl = document.getElementById('cb-pf-diet-note');
        if (obj && noteEl) {
          noteEl.style.color = obj.clinical ? '#78350f' : 'var(--cb-muted)';
          noteEl.textContent = obj.clinical
            ? '⚕️ Recordá que las situaciones clínicas requieren orientación profesional.'
            : obj.desc;
        }
      })
    );
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
      if (state.user.isCloud && window.QCHCloud?.syncUserData) {
        window.QCHCloud.syncUserData({ profile: state.user });
      }
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
      const market = E.getRecipeMarketInfo(rec, servings, state.preferredSupermarket || null);
      const cost = market.costUyu;
      openModal(`
        <div style="position:relative;height:200px;">
          <img src="${rec.imageUrl}" alt="${esc(rec.title)}" style="width:100%;height:100%;object-fit:cover;" />
          <button type="button" id="cb-rm-x" style="position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:999px;border:none;background:#fff;cursor:pointer;">✕</button>
        </div>
        <div class="cb-modal-body">
          <h3 style="margin:0;">${esc(rec.title)}</h3>
          <div style="font-size:12px;color:var(--cb-muted);">⏱ ${rec.prepMinutes} min · ~$U ${cost} en ${esc(market.chainName)} (${servings} porciones)</div>
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
  window.CB_IS_PICKING_FOR_INICIO = () => Boolean(state.pickingForInicio);
  window.CB_IS_MOMENT_DISABLED = (momentId) => S.getPlanningContext().disabledMoments.includes(momentId);
  window.CB_GET_DAY_WORD = () => S.getPlanningContext().dayWord;
  window.CB_GET_ACTIVE_DIET_LABEL = () => {
    if (!state.user) return '';
    const p = D.DIET_PATTERNS.find((x) => x.id === (state.user.dietPattern || 'equilibrada'));
    return p ? `${p.emoji} ${p.label}` : '';
  };

  window.CB_IS_RADIAL_RECIPE_COMPATIBLE = (radialRecipe) => {
    if (!state.user) return true;
    const pattern = (state.user.dietPattern || 'equilibrada').toLowerCase();
    const restrictions = (state.user.restrictions || []).map((r) => r.toLowerCase());
    const has = (kw) => restrictions.some((r) => r.includes(kw));

    const idAndTitle = `${radialRecipe.id || ''} ${radialRecipe.title || ''}`.toLowerCase();
    const text = [
      radialRecipe.id || '',
      radialRecipe.title || '',
      radialRecipe.categoria || '',
      ...(radialRecipe.ingredients || []).map((i) => (typeof i === 'string' ? i : i.item || '')),
    ]
      .join(' ')
      .toLowerCase();

    if (pattern === 'sin_gluten' || has('gluten') || has('celiaqu')) {
      const explicitlyGlutenFree = /celiaco-|sin tacc|sin gluten/.test(idAndTitle);
      const hasGlutenIngredient =
        /(harina de trigo|harina 000|harina común|harina integral|harina para pan|\bharina\b|trigo|sémola|burgol|salvado|avena|fideo|espagueti|fettuccini|tallar|penne|mostachol|macarr|rigatoni|caracol|moñito|codito|lasaña|panqueque|tapa.*copetín|galleta|pan |miñón|baguette|lactal)/.test(
          text
        ) && !/harina de (arroz|maíz|garbanzo|almendra)|premezcla sin tacc/.test(text);
      if (!explicitlyGlutenFree && hasGlutenIngredient) return false;
    }

    if (pattern === 'sin_lactosa' || has('lactosa') || has('lácteo')) {
      if (
        /(leche|queso|yogur|ricota|crema de leche|manteca|mozzarella|muzzarella|parmesano|sardo|provolone|colonia|dambo|gruyere|cheddar|roquefort|salsa blanca|bechamel)/.test(
          text
        ) &&
        !/sin lactosa|deslactosad|vegano|vegana|bebida vegetal/.test(text)
      ) {
        return false;
      }
    }

    if (has('huevo') && /huevo|clara|yema/.test(text)) return false;
    if ((has('pescado') || has('marisco')) && /(salmón|salmon|merluza|corvina|atún|pescado|brótola|camar|mejill|anchoa)/.test(text)) return false;
    if (has('frutos secos') && /(nuez|nueces|almendra|maní|avellana|castaña)/.test(text)) return false;
    if ((pattern === 'bajo_sodio' || has('sodio') || has('hipertens')) && /(fiambre|jamón|panceta|salame|pepperoni|chorizo|anchoa|alcaparra|aceituna|soja)/.test(text)) return false;

    if (pattern === 'sin_azucar' || has('azúcar') || has('azucar')) {
      if (/(\bazúcar\b|miel|dulce de leche|membrillo)/.test(text) && !/sin azúcar|diabetes-/.test(idAndTitle) && radialRecipe.categoria === 'dulces') {
        return false;
      }
    }

    if (pattern === 'vegana' || has('vegano')) {
      if (
        /(pollo|pechuga|suprema|muslo|carne|vaca|vacun|res|bife|cuadril|nalga|peceto|cerdo|chorizo|panceta|jamón|pepperoni|salame|pescado|salmón|salmon|merluza|corvina|atún|anchoa|camar|mejill|huevo|clara|yema|leche|queso|yogur|ricota|mozzarella|muzzarella|parmesano|sardo|provolone|colonia|dambo|gruyere|cheddar|roquefort|manteca|crema de leche|miel)/.test(
          text
        ) &&
        !/vegano-|vegana/.test(idAndTitle)
      ) {
        return false;
      }
    } else if (pattern === 'vegetariana' || has('vegetariano')) {
      if (
        /(pollo|pechuga|suprema|muslo|carne|vaca|vacun|res|bife|cuadril|nalga|peceto|cerdo|chorizo|panceta|jamón|pepperoni|salame|pescado|salmón|salmon|merluza|corvina|atún|anchoa|camar|mejill|lomo|asado|milanesa de carne)/.test(
          text
        ) &&
        !/vegano-|vegetariano/.test(idAndTitle)
      ) {
        return false;
      }
    }
    return true;
  };

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
    const ctx = S.getPlanningContext();
    const today = ctx.targetDateIso;
    const todayIdx = ctx.targetDayIndex;

    // Reemplazar el registro de hoy para ese momento (ej: si eligió Merienda, actualiza la Merienda de hoy)
    state.userData.dailyLogs = state.userData.dailyLogs.filter(
      (l) => !(l.logDate === today && l.moment === validMoment)
    );
    state.userData.dailyLogs.unshift({
      id: 'log-' + Date.now(),
      logDate: today,
      moment: validMoment,
      recipeId: recipe.id,
      title: recipe.title,
      status,
      foodGroups: fg,
    });

    // Sincronizar también el slot de hoy en el planificador semanal
    const hasSlot = state.userData.menuSlots.some(
      (s) => s.dayIndex === todayIdx && s.moment === validMoment
    );
    if (hasSlot) {
      state.userData.menuSlots = state.userData.menuSlots.map((s) =>
        s.dayIndex === todayIdx && s.moment === validMoment
          ? { ...s, recipeId: recipe.id, customTitle: null, status }
          : s
      );
    }

    persist();

    if (state.pickingForInicio) {
      state.pickingForInicio = false;
      state.mode = 'comerbien';
      state.cbRoute = 'inicio';
      syncTopbarAndMode();
      return 'returned';
    }

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
    if (window.QCHCloud?.logout) window.QCHCloud.logout();
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

  const CATEGORY_IMAGES = {
    pollo: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
    carnes: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    verduras: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    pastas: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80',
    pescados: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80',
    dulces: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=900&q=80',
  };

  function inferShoppingCategory(itemName) {
    const low = itemName.toLowerCase();
    if (/(pollo|carne|bife|colita|salmón|salmon|merluza|atún|pescado|jamón)/.test(low)) return 'Carnicería y Pescadería';
    if (/(leche|queso|yogur|ricota|crema|manteca|huevo|mozzarella|muzzarella)/.test(low)) return 'Lácteos y Huevos';
    if (/(pan|tarta|masa|galleta)/.test(low)) return 'Panadería y Otros';
    if (/(papa|boniato|zapallo|calabaza|cebolla|tomate|zanahoria|acelga|espinaca|brócoli|berenjena|palta|manzana|banana|naranja|limón|ajo|perejil|lechuga|morrón|zapallito|palta)/.test(low)) return 'Verdulería y Frutería';
    return 'Almacén y Legumbres';
  }

  function normalizeRadialRecipe(raw) {
    const ingNames = (raw.ingredients || []).map((i) => (i.item || '').toLowerCase()).join(' ');
    const allergens = [];
    if (/(trigo|harina|pan |pan$|fideo|pasta|spaghetti|lasaña|avena|galleta|masa)/.test(ingNames) && !/sin tacc|arroz/.test(ingNames)) allergens.push('gluten');
    if (/(leche|queso|yogur|ricota|crema|manteca|mozzarella|muzzarella)/.test(ingNames)) allergens.push('lactosa');
    if (/huevo|clara|yema/.test(ingNames)) allergens.push('huevo');
    if (/(salmón|salmon|merluza|atún|pescado|brótola)/.test(ingNames)) allergens.push('pescado');
    if (/(maní|mani|nuez|almendra)/.test(ingNames)) allergens.push('frutos_secos');

    const catGroupMap = {
      pollo: ['proteinas_animales', 'verduras'],
      carnes: ['proteinas_animales', 'verduras'],
      pescados: ['proteinas_animales', 'verduras'],
      verduras: ['verduras', 'cereales_tuberculos'],
      pastas: ['cereales_tuberculos', 'verduras'],
      dulces: ['cereales_tuberculos', 'frutas'],
    };

    const moment = raw.momento === 'snacks' ? 'merienda' : D.MOMENTS_ORDER.includes(raw.momento) ? raw.momento : 'almuerzo';

    return {
      id: raw.id,
      title: raw.title,
      description: raw.description || '',
      imageUrl: CATEGORY_IMAGES[raw.categoria] || CATEGORY_IMAGES.verduras,
      moment,
      prepMinutes: (Number(raw.prepMinutes) || 10) + (Number(raw.cookMinutes) || 10),
      servings: Number(raw.servings) || 2,
      estimatedCostUyu: 180,
      foodGroups: catGroupMap[raw.categoria] || ['verduras', 'cereales_tuberculos'],
      tags: [raw.estilo || 'clasico', raw.metodo || 'cocina'],
      allergens,
      ingredients: (raw.ingredients || []).map((i) => ({
        name: i.item,
        amount: Number(i.amount) || 1,
        unit: i.unit || 'u',
        category: inferShoppingCategory(i.item || ''),
      })),
      steps: (raw.steps || []).map((s) => (typeof s === 'string' ? s : s.text)),
      nutritionExplanation: `Receta del catálogo ¿Qué Cocino Hoy? (${raw.categoria || 'variado'}). Acompañala con vegetales frescos o fruta de estación para equilibrar el plato según la Guía del MSP.`,
    };
  }

  async function loadExternalRecipesIntoCatalog() {
    try {
      const res = await fetch('./data/recipes.json');
      if (!res.ok) return;
      const list = await res.json();
      const existingIds = new Set(D.RECIPES.map((r) => r.id));
      for (const raw of list) {
        if (!existingIds.has(raw.id)) {
          D.RECIPES.push(normalizeRadialRecipe(raw));
          existingIds.add(raw.id);
        }
      }
      if (state.user && state.mode === 'comerbien') renderCBStage();
    } catch {
      // Silencioso si se abre por file:// sin servidor
    }
  }

  window.addEventListener('qch:auth-changed', (ev) => {
    const detail = ev.detail || {};
    applyCloudSession(detail.fbUser, detail.cloudDoc);
  });

  // Boot
  const existing = S.getActiveUser();
  if (existing) {
    state.user = existing;
    state.userData = S.getUserData(existing.username);
    if (localStorage.getItem('comer_bien_return_to_inicio') === '1') {
      localStorage.removeItem('comer_bien_return_to_inicio');
      state.mode = 'comerbien';
      state.cbRoute = 'inicio';
    }
  }
  syncTopbarAndMode();
  loadExternalRecipesIntoCatalog();
})();
