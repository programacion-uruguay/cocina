/**
 * Lógica principal de Cocina Radial:
 * - Pantalla principal limpia centrada en el menú circular multinivel
 * - Al tocar el centro del círculo o al completar el último nivel (Estilo), se abre el Modal de Resultados
 * - Cada resultado tiene un enlace "Ver receta →" que abre la Ficha Completa con calculadora de porciones, checklist y temporizador
 */

(function () {
  const FAVORITES_KEY = "cocina_radial_favorites_v1";

  const state = {
    recipes: [],
    selectedPath: {}, // { metodo?, momento?, categoria?, estilo? }
    searchQuery: "",
    onlyFavorites: false,
    favorites: loadFavorites(),
    activeRecipe: null,
    currentServings: 2,
    cameFromResultsModal: false
  };

  const els = {
    wheelContainer: document.getElementById("radial-menu-container"),
    breadcrumb: document.getElementById("breadcrumb"),
    backWheelBtn: document.getElementById("back-wheel-btn"),
    resetWheelBtn: document.getElementById("reset-wheel-btn"),
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

        return `
          <article class="recipe-card" data-id="${r.id}">
            <div class="card-top">
              <span class="method-pill" style="--pill-color:${metodo?.color || "#3b82f6"}">
                ${metodo?.label || r.metodo}
              </span>
              <button type="button" class="card-fav-btn ${fav ? "is-fav" : ""}" data-fav-id="${r.id}" aria-label="${fav ? "Quitar de favoritos" : "Agregar a favoritos"}">
                ${fav ? "♥" : "♡"}
              </button>
            </div>
            <h3 class="card-title">${r.title}</h3>
            <p class="card-desc">${r.description}</p>
            <div class="card-tags">
              ${momento ? `<span class="tag">${momento.shortLabel}</span>` : ""}
              ${categoria ? `<span class="tag">${categoria.shortLabel}</span>` : ""}
              ${estilo ? `<span class="tag">${estilo.shortLabel}</span>` : ""}
            </div>
            <div class="card-meta">
              <span>⏱️ ${totalMin} min</span>
              ${r.temperatureC ? `<span>🌡️ ${r.temperatureC} °C</span>` : ""}
              <span>🍽️ ${r.servings} porc.</span>
            </div>
            <div class="card-footer">
              <a href="#receta-${r.id}" class="card-view-link" data-view-id="${r.id}">Ver receta →</a>
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
    if (els.resultsModal.hidden) {
      document.body.style.overflow = "";
    }
  }

  function backToResultsModal() {
    els.modal.hidden = true;
    state.activeRecipe = null;
    openResultsModal();
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

    els.modalBody.innerHTML = `
      ${
        state.cameFromResultsModal
          ? `<button type="button" id="back-to-results-btn" class="btn-back-results">← Volver a la lista</button>`
          : ""
      }
      <div class="modal-header">
        <div class="modal-badges">
          ${metodo ? `<span class="method-pill" style="--pill-color:${metodo.color}">${metodo.label}</span>` : ""}
          ${momento ? `<span class="tag">${momento.label}</span>` : ""}
          ${categoria ? `<span class="tag">${categoria.label}</span>` : ""}
          ${estilo ? `<span class="tag">${estilo.label}</span>` : ""}
        </div>
        <div class="modal-title-row">
          <h2 id="modal-title">${r.title}</h2>
          <button type="button" id="modal-fav-btn" class="btn-fav-modal ${fav ? "is-fav" : ""}">
            ${fav ? "♥ En favoritos" : "♡ Guardar favorito"}
          </button>
        </div>
        <p class="modal-desc">${r.description}</p>
        <div class="modal-stats">
          <div class="stat-box"><span>Preparación</span><strong>${r.prepMinutes} min</strong></div>
          <div class="stat-box"><span>Cocción</span><strong>${r.cookMinutes} min</strong></div>
          ${r.temperatureC ? `<div class="stat-box"><span>Temperatura</span><strong>${r.temperatureC} °C</strong></div>` : ""}
          <div class="stat-box"><span>Dificultad</span><strong>${r.difficulty || "Fácil"}</strong></div>
        </div>
      </div>

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
                return `
                  <li>
                    <label class="check-item">
                      <input type="checkbox" id="ing-${idx}" />
                      <span><strong>${qty}${unit}</strong> ${ing.item}</span>
                    </label>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </section>

        <section class="modal-steps">
          <h3>Preparación paso a paso</h3>
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
    `;

    const backBtn = document.getElementById("back-to-results-btn");
    if (backBtn) {
      backBtn.addEventListener("click", backToResultsModal);
    }

    document.getElementById("modal-fav-btn").addEventListener("click", () => toggleFavorite(r.id));

    document.getElementById("servings-minus").addEventListener("click", () => {
      if (state.currentServings > 1) {
        state.currentServings -= 1;
        renderRecipeModalContent();
      }
    });

    document.getElementById("servings-plus").addEventListener("click", () => {
      if (state.currentServings < 24) {
        state.currentServings += 1;
        renderRecipeModalContent();
      }
    });

    els.modalBody.querySelectorAll(".btn-step-timer").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mins = Number(btn.dataset.minutes);
        timer.start(mins, btn.dataset.label);
      });
    });
  }

  function syncUI() {
    radialMenu.setSelectedPath(state.selectedPath);
    renderBreadcrumb();
  }

  function bindGlobalEvents() {
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
