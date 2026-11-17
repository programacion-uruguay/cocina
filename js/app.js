/**
 * Lógica principal de Cocina Radial:
 * - Pantalla principal limpia centrada en el menú circular multinivel
 * - Al tocar el centro del círculo o al completar el último nivel (Estilo), se abre el Modal de Resultados
 * - Cada resultado tiene un enlace "Ver receta →" que abre la Ficha Completa con calculadora de porciones, checklist y temporizador
 */

(function () {
  const FAVORITES_KEY = "cocina_radial_favorites_v1";
  const THEME_KEY = "cocina_radial_theme_v1";

  const state = {
    recipes: [],
    selectedPath: {}, // { metodo?, momento?, categoria?, estilo? }
    searchQuery: "",
    onlyFavorites: false,
    favorites: loadFavorites(),
    theme: loadTheme(),
    activeRecipe: null,
    currentServings: 2,
    cameFromResultsModal: false,
    cookingStepIndex: null,
    showSupermarketView: false,
    marketSortBy: "price",
    selectedBarrio: "cordon",
    userGpsCoords: null,
    gpsStatus: "",
    selectedChainId: null,
    checkedIngredients: {}
  };

  const els = {
    wheelContainer: document.getElementById("radial-menu-container"),
    breadcrumb: document.getElementById("breadcrumb"),
    backWheelBtn: document.getElementById("back-wheel-btn"),
    resetWheelBtn: document.getElementById("reset-wheel-btn"),
    surpriseBtn: document.getElementById("surprise-btn"),
    quickSuggestions: document.getElementById("quick-suggestions"),
    themeButtons: document.querySelectorAll("[data-theme-btn]"),
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    searchSubmitBtn: document.getElementById("search-submit-btn"),
    favToggleBtn: document.getElementById("favorites-toggle"),
    favCount: document.getElementById("favorites-count"),
    resultsModal: document.getElementById("results-modal"),
    resultsModalClose: document.getElementById("results-modal-close"),
    resultsModalTitle: document.getElementById("results-modal-title"),
    resultsModalSubtitle: document.getElementById("results-modal-subtitle"),
    resultsModalCount: document.getElementById("results-modal-count"),
    resultsModalGrid: document.getElementById("results-modal-grid"),
    resultsEmptyState: document.getElementById("results-empty-state"),
    emptyResetBtn: document.getElementById("empty-reset-btn"),
    modal: document.getElementById("recipe-modal"),
    modalBody: document.getElementById("modal-body"),
    modalClose: document.getElementById("modal-close")
  };

  const timer = new CookingTimer();
  let radialMenu = null;

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return ["light", "warm", "dark"].includes(saved) ? saved : "warm";
    } catch {
      return "warm";
    }
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignorar errores de almacenamiento privado
    }
    els.themeButtons.forEach((btn) => {
      const active = btn.dataset.themeBtn === theme;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
    } catch {
      // Ignorar errores de almacenamiento privado
    }
  }

  function isFavorite(id) {
    return state.favorites.includes(id);
  }

  function toggleFavorite(id) {
    if (isFavorite(id)) {
      state.favorites = state.favorites.filter((f) => f !== id);
    } else {
      state.favorites.push(id);
    }
    saveFavorites();
    updateFavBadge();
    if (!els.resultsModal.hidden) renderResultsModal();
    if (state.activeRecipe && state.activeRecipe.id === id) {
      renderRecipeModalContent();
    }
  }

  function updateFavBadge() {
    els.favCount.textContent = state.favorites.length;
  }

  function getFilteredRecipes(customPath = state.selectedPath) {
    const q = state.searchQuery.trim().toLowerCase();

    return state.recipes.filter((r) => {
      if (state.onlyFavorites && !isFavorite(r.id)) return false;
      if (customPath.metodo && r.metodo !== customPath.metodo) return false;
      if (customPath.momento && r.momento !== customPath.momento) return false;
      if (customPath.categoria && r.categoria !== customPath.categoria) return false;
      if (customPath.estilo && r.estilo !== customPath.estilo) return false;

      if (q) {
        const inTitle = r.title.toLowerCase().includes(q);
        const inDesc = (r.description || "").toLowerCase().includes(q);
        const inIng = r.ingredients.some((ing) => ing.item.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inIng) return false;
      }
      return true;
    });
  }

  function countForWheelSector(levelKey, itemId) {
    if (!levelKey && !itemId) {
      return getFilteredRecipes(state.selectedPath).length;
    }

    const levelIndex = MENU_LEVELS.findIndex((l) => l.key === levelKey);
    const testPath = {};
    for (let i = 0; i < levelIndex; i++) {
      const k = MENU_LEVELS[i].key;
      if (state.selectedPath[k]) testPath[k] = state.selectedPath[k];
    }
    testPath[levelKey] = itemId;
    return getFilteredRecipes(testPath).length;
  }

  function handleWheelSelect(levelKey, itemId) {
    const levelIndex = MENU_LEVELS.findIndex((l) => l.key === levelKey);
    const alreadySelected = state.selectedPath[levelKey] === itemId;

    const nextPath = {};
    for (let i = 0; i < levelIndex; i++) {
      const k = MENU_LEVELS[i].key;
      if (state.selectedPath[k]) nextPath[k] = state.selectedPath[k];
    }

    if (!alreadySelected) {
      nextPath[levelKey] = itemId;
    }

    state.selectedPath = nextPath;
    syncUI();

    // Si eligió una opción del último nivel (Nivel 4: estilo), abrir el modal de resultados
    const isLastLevel = levelIndex === MENU_LEVELS.length - 1;
    if (isLastLevel && !alreadySelected) {
      openResultsModal();
    }
  }

  function handleCenterClick() {
    // El centro del círculo abre el modal con las recetas de la selección actual (o todas)
    openResultsModal();
  }

  function stepBackLevel() {
    const keys = MENU_LEVELS.map((l) => l.key).filter((k) => state.selectedPath[k]);
    if (keys.length === 0) return;
    delete state.selectedPath[keys[keys.length - 1]];
    syncUI();
  }

  function resetAllFilters() {
    state.selectedPath = {};
    state.searchQuery = "";
    state.onlyFavorites = false;
    els.searchInput.value = "";
    els.searchSubmitBtn.hidden = true;
    els.favToggleBtn.classList.remove("is-active");
    syncUI();
    if (!els.resultsModal.hidden) renderResultsModal();
  }

  function renderBreadcrumb() {
    const keys = MENU_LEVELS.map((l) => l.key).filter((k) => state.selectedPath[k]);
    els.backWheelBtn.hidden = keys.length === 0;
    els.resetWheelBtn.hidden = keys.length === 0;

    if (keys.length === 0) {
      els.breadcrumb.innerHTML =
        '<span class="crumb-root">Inicio · Elegí un método o tocá el centro para ver todas</span>';
      return;
    }

    const parts = ['<button type="button" class="crumb-btn" data-reset="all">Inicio</button>'];
    keys.forEach((key, idx) => {
      const item = getMenuItemById(key, state.selectedPath[key]);
      if (!item) return;
      parts.push('<span class="crumb-sep">›</span>');
      parts.push(
        `<button type="button" class="crumb-btn ${idx === keys.length - 1 ? "is-current" : ""}" data-level="${key}" style="--crumb-color:${item.color}">
          <span class="crumb-dot" style="background:${item.color}"></span>
          ${item.label}
        </button>`
      );
    });

    els.breadcrumb.innerHTML = parts.join("");

    els.breadcrumb.querySelectorAll(".crumb-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.reset === "all") {
          state.selectedPath = {};
        } else {
          const targetIdx = MENU_LEVELS.findIndex((l) => l.key === btn.dataset.level);
          const nextPath = {};
          for (let i = 0; i <= targetIdx; i++) {
            const k = MENU_LEVELS[i].key;
            if (state.selectedPath[k]) nextPath[k] = state.selectedPath[k];
          }
          state.selectedPath = nextPath;
        }
        syncUI();
      });
    });
  }

  function openResultsModal() {
    renderResultsModal();
    els.resultsModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeResultsModal() {
    els.resultsModal.hidden = true;
    if (els.modal.hidden) {
      document.body.style.overflow = "";
    }
  }

  function renderResultsModal() {
    const list = getFilteredRecipes();
    els.resultsModalCount.textContent = `${list.length} ${list.length === 1 ? "receta" : "recetas"}`;

    const activeLabels = MENU_LEVELS.map((l) => {
      const id = state.selectedPath[l.key];
      return id ? getMenuItemById(l.key, id)?.label : null;
    }).filter(Boolean);

    if (state.onlyFavorites) activeLabels.unshift("Favoritos");
    if (state.searchQuery.trim()) activeLabels.push(`"${state.searchQuery.trim()}"`);

    els.resultsModalTitle.textContent = activeLabels.length
      ? activeLabels.join(" · ")
      : "Todas las recetas";
    els.resultsModalSubtitle.textContent =
      list.length > 0
        ? "Tocá «Ver receta» en cualquier tarjeta para abrir los ingredientes y pasos"
        : "No hay recetas que coincidan con este filtro";

    if (list.length === 0) {
      els.resultsModalGrid.innerHTML = "";
      els.resultsEmptyState.hidden = false;
      return;
    }

    els.resultsEmptyState.hidden = true;
    els.resultsModalGrid.innerHTML = list
      .map((r) => {
        const metodo = getMenuItemById("metodo", r.metodo);
        const momento = getMenuItemById("momento", r.momento);
        const categoria = getMenuItemById("categoria", r.categoria);
        const estilo = getMenuItemById("estilo", r.estilo);
        const totalMin = (r.prepMinutes || 0) + (r.cookMinutes || 0);
        const fav = isFavorite(r.id);
        const bannerColor = metodo?.color || "#3b82f6";

        return `
          <article class="recipe-card" data-id="${r.id}">
            <div class="card-banner" style="--banner-color:${bannerColor}">
              <div class="card-banner-left">
                <span class="card-banner-emoji" aria-hidden="true">${categoria?.emoji || "🍽️"}</span>
                <span class="card-banner-method">${metodo?.emoji || ""} ${metodo?.label || r.metodo}</span>
              </div>
              <button type="button" class="card-fav-btn ${fav ? "is-fav" : ""}" data-fav-id="${r.id}" aria-label="${fav ? "Quitar de favoritos" : "Agregar a favoritos"}">
                ${fav ? "♥" : "♡"}
              </button>
            </div>
            <div class="card-body">
              <h3 class="card-title">${r.title}</h3>
              <p class="card-desc">${r.description}</p>
              <div class="card-tags">
                ${momento ? `<span class="tag">${momento.emoji || ""} ${momento.shortLabel}</span>` : ""}
                ${categoria ? `<span class="tag">${categoria.emoji || ""} ${categoria.shortLabel}</span>` : ""}
                ${estilo ? `<span class="tag">${estilo.emoji || ""} ${estilo.shortLabel}</span>` : ""}
              </div>
              <div class="card-meta">
                <span>⏱️ ${totalMin} min</span>
                ${r.temperatureC ? `<span>🌡️ ${r.temperatureC} °C</span>` : ""}
                <span>🍽️ ${r.servings} porc.</span>
              </div>
              <div class="card-footer">
                <a href="#receta-${r.id}" class="card-view-link" data-view-id="${r.id}">Ver receta →</a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    els.resultsModalGrid.querySelectorAll(".recipe-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-fav-id]")) return;
        e.preventDefault();
        const recipe = state.recipes.find((item) => item.id === card.dataset.id);
        if (recipe) openRecipeModal(recipe, true);
      });
    });

    els.resultsModalGrid.querySelectorAll("[data-fav-id]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.favId);
      });
    });
  }

  function formatAmount(baseAmount, multiplier) {
    if (baseAmount === null || baseAmount === undefined || baseAmount === "") return "";
    const val = baseAmount * multiplier;
    const rounded = Math.round(val * 100) / 100;
    if (Number.isInteger(rounded)) return String(rounded);
    return rounded.toFixed(1).replace(/\.0$/, "");
  }

  function openRecipeModal(recipe, fromResults = false) {
    state.activeRecipe = recipe;
    state.currentServings = recipe.servings || 2;
    state.cameFromResultsModal = fromResults;
    state.cookingStepIndex = null;
    state.showSupermarketView = false;
    state.selectedChainId = null;
    state.checkedIngredients = {};
    if (fromResults) {
      els.resultsModal.hidden = true;
    }
    renderRecipeModalContent();
    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeRecipeModal() {
    els.modal.hidden = true;
    state.activeRecipe = null;
    state.cookingStepIndex = null;
    state.showSupermarketView = false;
    state.selectedChainId = null;
    state.checkedIngredients = {};
    if (els.resultsModal.hidden) {
      document.body.style.overflow = "";
    }
  }

  function backToResultsModal() {
    els.modal.hidden = true;
    state.activeRecipe = null;
    state.cookingStepIndex = null;
    state.showSupermarketView = false;
    state.selectedChainId = null;
    state.checkedIngredients = {};
    openResultsModal();
  }

  function getActiveMontevideoCoords() {
    if (state.userGpsCoords) return state.userGpsCoords;
    const barrio = MDEO_BARRIOS.find((b) => b.id === state.selectedBarrio) || MDEO_BARRIOS[0];
    return { lat: barrio.lat, lng: barrio.lng };
  }

  function requestMontevideoGps() {
    if (!navigator.geolocation) {
      state.gpsStatus = "Tu navegador no soporta GPS; usá el selector de barrio.";
      renderRecipeModalContent();
      return;
    }
    state.gpsStatus = "Obteniendo ubicación...";
    renderRecipeModalContent();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.userGpsCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.gpsStatus = "GPS activo en tu ubicación actual";
        renderRecipeModalContent();
      },
      () => {
        state.gpsStatus = "No se pudo obtener el GPS; elegí tu barrio en Montevideo.";
        renderRecipeModalContent();
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  function renderSupermarketComparisonView(r, multiplier) {
    const coords = getActiveMontevideoCoords();
    const comparisons = compareRecipeInMontevideo(
      r,
      multiplier,
      coords,
      state.marketSortBy,
      state.checkedIngredients
    );

    const activeChain =
      comparisons.find((c) => c.chainId === state.selectedChainId) || comparisons[0];
    state.selectedChainId = activeChain.chainId;

    return `
      <div class="market-view">
        <div class="market-controls">
          <div class="market-location-bar">
            <label for="market-barrio-select" class="market-label">📍 Barrio en Montevideo:</label>
            <select id="market-barrio-select" class="market-select">
              ${MDEO_BARRIOS.map(
                (b) => `<option value="${b.id}" ${!state.userGpsCoords && state.selectedBarrio === b.id ? "selected" : ""}>${b.label}</option>`
              ).join("")}
            </select>
            <button type="button" id="market-gps-btn" class="btn-gps ${state.userGpsCoords ? "is-active" : ""}">
              ${state.userGpsCoords ? "📡 GPS activo" : "📍 Usar mi ubicación GPS"}
            </button>
            ${state.gpsStatus ? `<span class="gps-status">${state.gpsStatus}</span>` : ""}
          </div>

          <div class="market-sort-row">
            <div class="market-sort-pills" role="group" aria-label="Criterio de comparación">
              <button type="button" class="sort-pill ${state.marketSortBy === "price" ? "is-active" : ""}" data-market-sort="price">💰 Mejor precio ($ UYU)</button>
              <button type="button" class="sort-pill ${state.marketSortBy === "distance" ? "is-active" : ""}" data-market-sort="distance">📍 Más cerca mío</button>
              <button type="button" class="sort-pill ${state.marketSortBy === "smart" ? "is-active" : ""}" data-market-sort="smart">⚖️ Precio + Cercanía</button>
            </div>
            <div class="servings-calc" aria-label="Calculadora de porciones">
              <button type="button" id="servings-minus" class="calc-btn" aria-label="Menos porciones">−</button>
              <span id="servings-value">${state.currentServings} ${state.currentServings === 1 ? "porción" : "porciones"}</span>
              <button type="button" id="servings-plus" class="calc-btn" aria-label="Más porciones">+</button>
            </div>
          </div>
        </div>

        <div class="market-chains-grid">
          ${comparisons
            .map((c, idx) => {
              const isSelected = c.chainId === activeChain.chainId;
              let badgeText = "";
              if (c.isCheapest && state.marketSortBy === "price") badgeText = "🏆 Más barato";
              else if (c.isNearest && state.marketSortBy === "distance") badgeText = "📍 Más cerca";
              else if (c.isSmartest && state.marketSortBy === "smart") badgeText = "⭐ Mejor balance";
              else if (c.isCheapest) badgeText = "💰 Mejor precio";
              else if (c.isNearest) badgeText = "📍 Más cercano";

              return `
                <article class="market-chain-card ${isSelected ? "is-selected" : ""}" data-chain-id="${c.chainId}" style="--chain-color:${c.color}" tabindex="0" role="button">
                  <div class="chain-card-top">
                    <span class="chain-rank">#${idx + 1}</span>
                    ${badgeText ? `<span class="chain-badge">${badgeText}</span>` : ""}
                  </div>
                  <h4 class="chain-name">${c.chainName}</h4>
                  <div class="chain-price">$ ${c.totalUYU} <small>UYU</small></div>
                  <div class="chain-branch">
                    <strong>${c.closestBranch.name}</strong>
                    <span>${c.closestBranch.address}</span>
                    <div class="chain-dist-row">
                      <span>📏 ${c.closestBranch.distanceKm} km (~${c.closestBranch.blocks} cuadras)</span>
                      <a href="${c.closestBranch.mapsUrl}" target="_blank" rel="noopener noreferrer" class="chain-map-link" data-stop-card="true">Mapa ↗</a>
                    </div>
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>

        <div class="market-breakdown">
          <div class="market-breakdown-head">
            <div>
              <h4>Desglose de ingredientes en <span style="color:${activeChain.color}">${activeChain.chainName}</span></h4>
              <p class="market-note">Precios estimados de referencia en Montevideo ($ UYU). Marcá «Ya tengo» para descontar lo que tenés en casa o abrí el producto directo en la góndola online.</p>
            </div>
            <strong class="breakdown-total">A comprar: $ ${activeChain.totalUYU} UYU</strong>
          </div>

          <ul class="market-items-list">
            ${activeChain.items
              .map((item) => {
                const qty = formatAmount(item.amount, multiplier);
                const unit = item.unit ? ` ${item.unit}` : "";
                return `
                  <li class="market-item-row ${item.checked ? "is-owned" : ""}">
                    <label class="market-item-check">
                      <input type="checkbox" class="market-own-checkbox" data-ing-idx="${item.index}" ${item.checked ? "checked" : ""} />
                      <span>
                        <strong>${qty}${unit}</strong> ${item.item}
                        <small class="market-search-tag">(${item.searchTerm})</small>
                      </span>
                    </label>
                    <div class="market-item-actions">
                      <span class="market-item-price">
                        ${item.checked ? "<s>$ " + item.estimatedFullPriceUYU + "</s> $ 0" : "$ " + item.priceUYU}
                      </span>
                      <a href="${item.gondolaUrl}" target="_blank" rel="noopener noreferrer" class="btn-gondola">
                        Ver en góndola ↗
                      </a>
                    </div>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </div>
      </div>
    `;
  }

  function renderStepFocusView(r) {
    const idx = state.cookingStepIndex;
    const total = r.steps.length;
    const step = r.steps[idx];
    const progressPct = Math.round(((idx + 1) / total) * 100);
    const isLast = idx === total - 1;

    return `
      <div class="step-focus-view">
        <div class="step-focus-topbar">
          <span class="step-focus-counter">Paso ${idx + 1} de ${total}</span>
          <button type="button" id="exit-step-mode-btn" class="btn-exit-step-mode">Salir del modo paso a paso</button>
        </div>
        <div class="step-progress-track" aria-hidden="true">
          <div class="step-progress-fill" style="width:${progressPct}%"></div>
        </div>
        <div class="step-focus-card">
          <div class="step-focus-badge">Paso ${idx + 1}</div>
          <p class="step-focus-text">${step.text}</p>
          ${
            step.timerMinutes
              ? `<button type="button" class="btn-step-timer btn-step-timer-lg" data-minutes="${step.timerMinutes}" data-label="${r.title} · Paso ${idx + 1}">
                  ⏱️ Iniciar timer (${step.timerMinutes} min)
                </button>`
              : ""
          }
        </div>
        <div class="step-focus-nav">
          <button type="button" id="step-prev-btn" class="btn-step-nav" ${idx === 0 ? "disabled" : ""}>← Anterior</button>
          <button type="button" id="step-next-btn" class="btn-step-nav is-primary">
            ${isLast ? "✅ Finalizar" : "Siguiente →"}
          </button>
        </div>
      </div>
    `;
  }

  function renderRecipeModalContent() {
    const r = state.activeRecipe;
    if (!r) return;

    const metodo = getMenuItemById("metodo", r.metodo);
    const momento = getMenuItemById("momento", r.momento);
    const categoria = getMenuItemById("categoria", r.categoria);
    const estilo = getMenuItemById("estilo", r.estilo);
    const multiplier = state.currentServings / (r.servings || 1);
    const fav = isFavorite(r.id);
    const isStepMode = state.cookingStepIndex !== null && r.steps.length > 0;
    const isMarketView = state.showSupermarketView;

    els.modalBody.innerHTML = `
      ${
        state.cameFromResultsModal
          ? `<button type="button" id="back-to-results-btn" class="btn-back-results">← Volver a la lista</button>`
          : ""
      }
      <div class="modal-header">
        <div class="modal-badges">
          ${metodo ? `<span class="method-pill" style="--pill-color:${metodo.color}">${metodo.emoji || ""} ${metodo.label}</span>` : ""}
          ${momento ? `<span class="tag">${momento.emoji || ""} ${momento.label}</span>` : ""}
          ${categoria ? `<span class="tag">${categoria.emoji || ""} ${categoria.label}</span>` : ""}
          ${estilo ? `<span class="tag">${estilo.emoji || ""} ${estilo.label}</span>` : ""}
        </div>
        <div class="modal-title-row">
          <h2 id="modal-title">${r.title}</h2>
          <div class="modal-title-actions">
            <button type="button" id="toggle-market-btn" class="btn-market-toggle ${isMarketView ? "is-active" : ""}">
              ${isMarketView ? "📖 Volver a la receta" : "🛒 Comparar en Supermercados (Mdeo)"}
            </button>
            <button type="button" id="modal-fav-btn" class="btn-fav-modal ${fav ? "is-fav" : ""}">
              ${fav ? "♥ En favoritos" : "♡ Guardar favorito"}
            </button>
          </div>
        </div>
        <p class="modal-desc">${r.description}</p>
        <div class="modal-stats">
          <div class="stat-box"><span>Preparación</span><strong>${r.prepMinutes} min</strong></div>
          <div class="stat-box"><span>Cocción</span><strong>${r.cookMinutes} min</strong></div>
          ${r.temperatureC ? `<div class="stat-box"><span>Temperatura</span><strong>${r.temperatureC} °C</strong></div>` : ""}
          <div class="stat-box"><span>Dificultad</span><strong>${r.difficulty || "Fácil"}</strong></div>
        </div>
      </div>

      ${
        isMarketView
          ? renderSupermarketComparisonView(r, multiplier)
          : isStepMode
          ? renderStepFocusView(r)
          : `
      <div class="modal-columns">
        <section class="modal-ingredients">
          <div class="section-head">
            <h3>Ingredientes</h3>
            <div class="servings-calc" aria-label="Calculadora de porciones">
              <button type="button" id="servings-minus" class="calc-btn" aria-label="Menos porciones">−</button>
              <span id="servings-value">${state.currentServings} ${state.currentServings === 1 ? "porción" : "porciones"}</span>
              <button type="button" id="servings-plus" class="calc-btn" aria-label="Más porciones">+</button>
            </div>
          </div>
          <ul class="checklist">
            ${r.ingredients
              .map((ing, idx) => {
                const qty = formatAmount(ing.amount, multiplier);
                const unit = ing.unit ? ` ${ing.unit}` : "";
                const checked = Boolean(state.checkedIngredients[idx]);
                return `
                  <li>
                    <label class="check-item">
                      <input type="checkbox" class="recipe-ing-checkbox" data-ing-idx="${idx}" id="ing-${idx}" ${checked ? "checked" : ""} />
                      <span><strong>${qty}${unit}</strong> ${ing.item}</span>
                    </label>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </section>

        <section class="modal-steps">
          <div class="steps-head">
            <h3>Preparación paso a paso</h3>
            ${
              r.steps.length > 0
                ? `<button type="button" id="enter-step-mode-btn" class="btn-step-mode">👨‍🍳 Modo Paso a Paso Grande</button>`
                : ""
            }
          </div>
          <ol class="steps-list">
            ${r.steps
              .map(
                (step, idx) => `
              <li class="step-item">
                <div class="step-num">${idx + 1}</div>
                <div class="step-content">
                  <p>${step.text}</p>
                  ${
                    step.timerMinutes
                      ? `<button type="button" class="btn-step-timer" data-minutes="${step.timerMinutes}" data-label="${r.title} · Paso ${idx + 1}">
                          ⏱️ Iniciar timer (${step.timerMinutes} min)
                        </button>`
                      : ""
                  }
                </div>
              </li>
            `
              )
              .join("")}
          </ol>
        </section>
      </div>
      `
      }
    `;

    const backBtn = document.getElementById("back-to-results-btn");
    if (backBtn) {
      backBtn.addEventListener("click", backToResultsModal);
    }

    document.getElementById("toggle-market-btn").addEventListener("click", () => {
      state.showSupermarketView = !state.showSupermarketView;
      if (state.showSupermarketView) state.cookingStepIndex = null;
      renderRecipeModalContent();
    });

    document.getElementById("modal-fav-btn").addEventListener("click", () => toggleFavorite(r.id));

    if (isMarketView) {
      document.getElementById("market-barrio-select").addEventListener("change", (e) => {
        state.selectedBarrio = e.target.value;
        state.userGpsCoords = null;
        state.gpsStatus = "";
        renderRecipeModalContent();
      });

      document.getElementById("market-gps-btn").addEventListener("click", requestMontevideoGps);

      els.modalBody.querySelectorAll("[data-market-sort]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.marketSortBy = btn.dataset.marketSort;
          renderRecipeModalContent();
        });
      });

      els.modalBody.querySelectorAll(".market-chain-card").forEach((card) => {
        const selectChain = (e) => {
          if (e.target.closest("[data-stop-card]")) return;
          state.selectedChainId = card.dataset.chainId;
          renderRecipeModalContent();
        };
        card.addEventListener("click", selectChain);
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectChain(e);
          }
        });
      });

      els.modalBody.querySelectorAll(".market-own-checkbox").forEach((cb) => {
        cb.addEventListener("change", (e) => {
          state.checkedIngredients[e.target.dataset.ingIdx] = e.target.checked;
          renderRecipeModalContent();
        });
      });
    } else if (isStepMode) {
      document.getElementById("exit-step-mode-btn").addEventListener("click", () => {
        state.cookingStepIndex = null;
        renderRecipeModalContent();
      });
      document.getElementById("step-prev-btn").addEventListener("click", () => {
        if (state.cookingStepIndex > 0) {
          state.cookingStepIndex -= 1;
          renderRecipeModalContent();
        }
      });
      document.getElementById("step-next-btn").addEventListener("click", () => {
        if (state.cookingStepIndex < r.steps.length - 1) {
          state.cookingStepIndex += 1;
        } else {
          state.cookingStepIndex = null;
        }
        renderRecipeModalContent();
      });
    } else {
      els.modalBody.querySelectorAll(".recipe-ing-checkbox").forEach((cb) => {
        cb.addEventListener("change", (e) => {
          state.checkedIngredients[e.target.dataset.ingIdx] = e.target.checked;
        });
      });

      const enterStepBtn = document.getElementById("enter-step-mode-btn");
      if (enterStepBtn) {
        enterStepBtn.addEventListener("click", () => {
          state.cookingStepIndex = 0;
          renderRecipeModalContent();
        });
      }
    }

    const minusBtn = document.getElementById("servings-minus");
    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        if (state.currentServings > 1) {
          state.currentServings -= 1;
          renderRecipeModalContent();
        }
      });
    }

    const plusBtn = document.getElementById("servings-plus");
    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        if (state.currentServings < 24) {
          state.currentServings += 1;
          renderRecipeModalContent();
        }
      });
    }

    els.modalBody.querySelectorAll(".btn-step-timer").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mins = Number(btn.dataset.minutes);
        timer.start(mins, btn.dataset.label);
      });
    });
  }

  function renderQuickSuggestions() {
    if (!els.quickSuggestions) return;
    const list = getFilteredRecipes();
    const fastest = [...list]
      .sort((a, b) => (a.prepMinutes + a.cookMinutes) - (b.prepMinutes + b.cookMinutes))
      .slice(0, 2);

    if (fastest.length === 0) {
      els.quickSuggestions.innerHTML = "";
      return;
    }

    els.quickSuggestions.innerHTML = fastest
      .map((r) => {
        const totalMin = (r.prepMinutes || 0) + (r.cookMinutes || 0);
        const cat = getMenuItemById("categoria", r.categoria);
        return `<button type="button" class="quick-pill" data-quick-id="${r.id}">${cat?.emoji || "⚡"} ${r.title} <span class="quick-pill-time">${totalMin}m</span></button>`;
      })
      .join("");

    els.quickSuggestions.querySelectorAll("[data-quick-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const recipe = state.recipes.find((item) => item.id === btn.dataset.quickId);
        if (recipe) openRecipeModal(recipe, false);
      });
    });
  }

  function syncUI() {
    radialMenu.setSelectedPath(state.selectedPath);
    renderBreadcrumb();
    renderQuickSuggestions();
  }

  function bindGlobalEvents() {
    els.themeButtons.forEach((btn) => {
      btn.addEventListener("click", () => applyTheme(btn.dataset.themeBtn));
    });

    if (els.surpriseBtn) {
      els.surpriseBtn.addEventListener("click", () => {
        const filtered = getFilteredRecipes();
        const pool = filtered.length > 0 ? filtered : state.recipes;
        if (pool.length === 0) return;
        const randomRecipe = pool[Math.floor(Math.random() * pool.length)];
        openRecipeModal(randomRecipe, false);
      });
    }

    els.searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      els.searchSubmitBtn.hidden = !state.searchQuery.trim();
      syncUI();
    });

    els.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      openResultsModal();
    });

    els.favToggleBtn.addEventListener("click", () => {
      state.onlyFavorites = true;
      els.favToggleBtn.classList.add("is-active");
      syncUI();
      openResultsModal();
    });

    els.backWheelBtn.addEventListener("click", stepBackLevel);

    els.resetWheelBtn.addEventListener("click", () => {
      state.selectedPath = {};
      syncUI();
    });

    els.emptyResetBtn.addEventListener("click", () => {
      resetAllFilters();
    });

    els.resultsModalClose.addEventListener("click", () => {
      state.onlyFavorites = false;
      els.favToggleBtn.classList.remove("is-active");
      closeResultsModal();
      syncUI();
    });

    els.resultsModal.addEventListener("click", (e) => {
      if (e.target === els.resultsModal) {
        state.onlyFavorites = false;
        els.favToggleBtn.classList.remove("is-active");
        closeResultsModal();
        syncUI();
      }
    });

    els.modalClose.addEventListener("click", closeRecipeModal);
    els.modal.addEventListener("click", (e) => {
      if (e.target === els.modal) closeRecipeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!els.modal.hidden) {
          closeRecipeModal();
        } else if (!els.resultsModal.hidden) {
          state.onlyFavorites = false;
          els.favToggleBtn.classList.remove("is-active");
          closeResultsModal();
          syncUI();
        }
      }
    });
  }

  async function init() {
    applyTheme(state.theme);
    updateFavBadge();
    bindGlobalEvents();

    try {
      const res = await fetch("./data/recipes.json");
      if (!res.ok) throw new Error("No se pudo cargar recipes.json");
      state.recipes = await res.json();
    } catch (err) {
      console.error(err);
      state.recipes = [];
    }

    radialMenu = new RadialMenu(els.wheelContainer, MENU_LEVELS, {
      onSelect: handleWheelSelect,
      onCenterClick: handleCenterClick,
      getItemCount: countForWheelSector
    });

    syncUI();
  }

  init();
})();
