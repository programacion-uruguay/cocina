/**
 * Lógica principal de Cocina Radial:
 * - Carga de recetas desde ./data/recipes.json
 * - Filtrado multinivel sincronizado con el menú circular
 * - Buscador, favoritos (localStorage), calculadora de porciones, checklist y temporizador
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
    currentServings: 2
  };

  const els = {
    wheelContainer: document.getElementById("radial-menu-container"),
    breadcrumb: document.getElementById("breadcrumb"),
    resetWheelBtn: document.getElementById("reset-wheel-btn"),
    searchInput: document.getElementById("search-input"),
    favToggleBtn: document.getElementById("favorites-toggle"),
    favCount: document.getElementById("favorites-count"),
    resultsTitle: document.getElementById("results-title"),
    resultsSubtitle: document.getElementById("results-subtitle"),
    resultsCount: document.getElementById("results-count"),
    recipesGrid: document.getElementById("recipes-grid"),
    emptyState: document.getElementById("empty-state"),
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
    renderRecipes();
    if (state.activeRecipe && state.activeRecipe.id === id) {
      renderModalContent();
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

    // Construimos un path hipotético hasta ese nivel para contar cuántas recetas coinciden
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

    // Limpiamos niveles posteriores al nivel clickeado
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
  }

  function handleCenterClick() {
    const keys = MENU_LEVELS.map((l) => l.key).filter((k) => state.selectedPath[k]);
    if (keys.length === 0) return;
    const lastKey = keys[keys.length - 1];
    delete state.selectedPath[lastKey];
    syncUI();
  }

  function resetAllFilters() {
    state.selectedPath = {};
    state.searchQuery = "";
    state.onlyFavorites = false;
    els.searchInput.value = "";
    els.favToggleBtn.classList.remove("is-active");
    els.favToggleBtn.setAttribute("aria-pressed", "false");
    syncUI();
  }

  function renderBreadcrumb() {
    const keys = MENU_LEVELS.map((l) => l.key).filter((k) => state.selectedPath[k]);
    els.resetWheelBtn.hidden = keys.length === 0;

    if (keys.length === 0) {
      els.breadcrumb.innerHTML = '<span class="crumb-root">Inicio · Elegí un método en el anillo interior</span>';
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

  function renderRecipes() {
    const list = getFilteredRecipes();
    els.resultsCount.textContent = `${list.length} ${list.length === 1 ? "receta" : "recetas"}`;

    const activeLabels = MENU_LEVELS.map((l) => {
      const id = state.selectedPath[l.key];
      return id ? getMenuItemById(l.key, id)?.label : null;
    }).filter(Boolean);

    if (state.onlyFavorites) activeLabels.unshift("Favoritos");
    if (state.searchQuery.trim()) activeLabels.push(`"${state.searchQuery.trim()}"`);

    els.resultsTitle.textContent = activeLabels.length ? activeLabels.join(" · ") : "Todas las recetas";
    els.resultsSubtitle.textContent = activeLabels.length
      ? "Podés seguir filtrando en el siguiente anillo o abrir una receta"
      : "Hacé clic en un anillo del menú circular para filtrar por método, momento, categoría y estilo";

    if (list.length === 0) {
      els.recipesGrid.innerHTML = "";
      els.emptyState.hidden = false;
      return;
    }

    els.emptyState.hidden = true;
    els.recipesGrid.innerHTML = list
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
          </article>
        `;
      })
      .join("");

    els.recipesGrid.querySelectorAll(".recipe-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-fav-id]")) return;
        const recipe = state.recipes.find((item) => item.id === card.dataset.id);
        if (recipe) openModal(recipe);
      });
    });

    els.recipesGrid.querySelectorAll("[data-fav-id]").forEach((btn) => {
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

  function openModal(recipe) {
    state.activeRecipe = recipe;
    state.currentServings = recipe.servings || 2;
    renderModalContent();
    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    els.modal.hidden = true;
    state.activeRecipe = null;
    document.body.style.overflow = "";
  }

  function renderModalContent() {
    const r = state.activeRecipe;
    if (!r) return;

    const metodo = getMenuItemById("metodo", r.metodo);
    const momento = getMenuItemById("momento", r.momento);
    const categoria = getMenuItemById("categoria", r.categoria);
    const estilo = getMenuItemById("estilo", r.estilo);
    const multiplier = state.currentServings / (r.servings || 1);
    const fav = isFavorite(r.id);

    els.modalBody.innerHTML = `
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

    document.getElementById("modal-fav-btn").addEventListener("click", () => toggleFavorite(r.id));

    document.getElementById("servings-minus").addEventListener("click", () => {
      if (state.currentServings > 1) {
        state.currentServings -= 1;
        renderModalContent();
      }
    });

    document.getElementById("servings-plus").addEventListener("click", () => {
      if (state.currentServings < 24) {
        state.currentServings += 1;
        renderModalContent();
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
    renderRecipes();
  }

  function bindGlobalEvents() {
    els.searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      syncUI();
    });

    els.favToggleBtn.addEventListener("click", () => {
      state.onlyFavorites = !state.onlyFavorites;
      els.favToggleBtn.classList.toggle("is-active", state.onlyFavorites);
      els.favToggleBtn.setAttribute("aria-pressed", String(state.onlyFavorites));
      syncUI();
    });

    els.resetWheelBtn.addEventListener("click", () => {
      state.selectedPath = {};
      syncUI();
    });

    els.emptyResetBtn.addEventListener("click", resetAllFilters);

    els.modalClose.addEventListener("click", closeModal);
    els.modal.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.modal.hidden) {
        closeModal();
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
