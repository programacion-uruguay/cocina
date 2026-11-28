/**
 * Lógica principal de Cocina Radial:
 * - Pantalla principal limpia centrada en el menú circular multinivel
 * - Al tocar el centro del círculo o al completar el último nivel (Estilo), se abre el Modal de Resultados
 * - Cada resultado tiene un enlace "Ver receta →" que abre la Ficha Completa con calculadora de porciones, checklist y temporizador
 */

(function () {
  const FAVORITES_KEY = "cocina_radial_favorites_v1";
  const THEME_KEY = "cocina_radial_theme_v1";
  const ACTIVE_FILTER_KEY = "cocina_radial_active_filter_v1";

  function getCurrentUruguaySeasonKey(date = new Date()) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    if ((m === 12 && d >= 21) || m === 1 || m === 2 || (m === 3 && d < 21)) return "verano";
    if ((m === 3 && d >= 21) || m === 4 || m === 5 || (m === 6 && d < 21)) return "otono";
    if ((m === 6 && d >= 21) || m === 7 || m === 8 || (m === 9 && d < 21)) return "invierno";
    return "primavera";
  }

  const state = {
    recipes: [],
    selectedPath: {}, // { momento?, categoria?, metodo?, estilo? }
    searchQuery: "",
    onlyFavorites: false,
    onlyWithVideo: false,
    autoMomentByTime: true,
    homeTab: "home", // "home" | "wheel" | "ideas" | "fridge"
    selectedSeason: getCurrentUruguaySeasonKey(), // "all" | "verano" | "otono" | "invierno" | "primavera"
    selectedCalories: "all", // "all" | "low" | "mid" | "high"
    selectedDiet: "all",
    resultsPage: 0,
    resultsPageSize: 6,
    favorites: loadFavorites(),
    theme: loadTheme(),
    activeRecipe: null,
    currentServings: 2,
    cameFromResultsModal: false,
    recipeTab: "ingredients", // "ingredients" | "steps" | "market"
    cookingStepIndex: null,
    showSupermarketView: false,
    marketSortBy: "price",
    selectedBarrio: "cordon",
    userGpsCoords: null,
    gpsStatus: "",
    selectedChainId: null,
    checkedIngredients: {},
    wakeLockActive: false
  };

  const els = {
    wheelContainer: document.getElementById("radial-menu-container"),
    breadcrumb: document.getElementById("breadcrumb"),
    backWheelBtn: document.getElementById("back-wheel-btn"),
    resetWheelBtn: document.getElementById("reset-wheel-btn"),
    legendItems: document.querySelectorAll("#wheel-legend .legend-item"),
    surpriseBtn: document.getElementById("surprise-btn"),
    quickSuggestions: document.getElementById("quick-suggestions"),
    quickFilterChips: document.querySelectorAll("[data-quick-chip]"),
    timeMomentToggle: document.getElementById("time-moment-toggle"),
    timeMomentLabel: document.getElementById("time-moment-label"),
    seasonFilterSelect: document.getElementById("season-filter-select"),
    caloriesFilterSelect: document.getElementById("calories-filter-select"),
    dietFilterSelect: document.getElementById("diet-filter-select"),
    homeTabBtns: document.querySelectorAll("[data-home-tab]"),
    homeTabIdeasLabel: document.getElementById("home-tab-ideas-label"),
    homeDiscoverStrip: document.getElementById("home-discover-strip"),
    homePanelWheel: document.getElementById("home-panel-wheel"),
    nowIdeasSection: document.getElementById("now-ideas-section"),
    homePanelFridge: document.getElementById("home-panel-fridge"),
    homePanelRoulette: document.getElementById("home-panel-roulette"),
    themeButtons: document.querySelectorAll("[data-theme-btn]"),
    themeCycleBtn: document.getElementById("theme-cycle-btn"),
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    searchSubmitBtn: document.getElementById("search-submit-btn"),
    favToggleBtn: document.getElementById("favorites-toggle"),
    favCount: document.getElementById("favorites-count"),
    mobileFavCount: document.getElementById("mobile-fav-count"),
    mobileNavBtns: document.querySelectorAll("[data-mobile-nav]"),
    resultsModal: document.getElementById("results-modal"),
    resultsModalClose: document.getElementById("results-modal-close"),
    resultsModalTitle: document.getElementById("results-modal-title"),
    resultsModalSubtitle: document.getElementById("results-modal-subtitle"),
    resultsModalCount: document.getElementById("results-modal-count"),
    resultsModalGrid: document.getElementById("results-modal-grid"),
    resultsPagination: document.getElementById("results-pagination"),
    resultsEmptyState: document.getElementById("results-empty-state"),
    emptyResetBtn: document.getElementById("empty-reset-btn"),
    modal: document.getElementById("recipe-modal"),
    modalBody: document.getElementById("modal-body"),
    modalClose: document.getElementById("modal-close")
  };

  const timer = new CookingTimer();
  let radialMenu = null;
  let wakeLockSentinel = null;
  let activeQuickChip = null;

  const recipeCaloriesCache = new Map();
  const recipeSeasonsCache = new Map();
  const recipeDietMatchCache = new Map();

  const SEASON_LABELS = {
    all: "Todas las estaciones",
    verano: "☀️ Verano",
    otono: "🍂 Otoño",
    invierno: "❄️ Invierno",
    primavera: "🌸 Primavera"
  };

  const CALORIES_LABELS = {
    all: "Todas las calorías",
    low: "🔥 ≤ 250 kcal",
    mid: "🔥 250–450 kcal",
    high: "🔥 > 450 kcal"
  };

  function isGlutenFreeRecipe(r) {
    if (!r) return false;
    if (/-sg$/i.test(r.id || "")) return true;
    const text = `${r.title || ""} ${r.description || ""}`;
    return /sin\s*(gluten|tacc)/i.test(text);
  }

  function getRecipeCalories(r) {
    if (!r) return 300;
    if (recipeCaloriesCache.has(r.id)) return recipeCaloriesCache.get(r.id);
    let kcal = 0;
    if (typeof r.calories === "number" && r.calories > 0) {
      kcal = Math.round(r.calories);
    } else if (typeof getRecipeNutritionAndMedia === "function") {
      try {
        kcal = Math.round(getRecipeNutritionAndMedia(r).nutrition?.kcal || 0);
      } catch {
        kcal = 0;
      }
    }
    if (!kcal) kcal = 300;
    recipeCaloriesCache.set(r.id, kcal);
    return kcal;
  }

  function getRecipeSeasons(r) {
    if (!r) return new Set(["verano", "otono", "invierno", "primavera"]);
    if (recipeSeasonsCache.has(r.id)) return recipeSeasonsCache.get(r.id);

    const ingText = (r.ingredients || []).map((i) => (typeof i === "string" ? i : i.item || "")).join(" ");
    const txt = `${r.title || ""} ${r.description || ""} ${ingText}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const seasons = new Set();
    const isCold =
      r.metodo === "sin_coccion" ||
      /\b(ensalada|gazpacho|sopa fria|ceviche|helado|sorbete|paleta|infusion|sandia|melon|durazno|frutilla|mango|anana|pepino|palta|caprese|salpicon|frio|fria|fresco|fresca|vichyssoise)\b/.test(txt);
    const isHotWinter =
      /\b(guiso|locro|puchero|sopa|caldo|crema de|estofado|cazuela|polenta|lasana|canelones|noquis|ravioles|pastel de papas|gratinad|zapallo|calabaza|boniato|lentejas|porotos|garbanzos|coliflor|brocoli|puerro|mondongo|goulash|chupin|volcan|souffle|bolognesa|tuco|carbonara|fondue)\b/.test(txt);
    const isAutumn =
      /\b(zapallo|calabaza|boniato|manzana|pera|naranja|mandarina|hongos|champinon|nueces|almendras|avena|canela|risotto|polenta|budin|tarta|empanada|pan|horno)\b/.test(txt);
    const isSpring =
      /\b(esparrago|alcaucil|arveja|chaucha|espinaca|rucula|frutilla|limon|zanahoria|remolacha|ensalada|tarta|tortilla|wrap|sandwich|tostado|pescado|salmon|merluza|pollo|tomate|zapallito|choclo)\b/.test(txt);

    if (isCold && !isHotWinter) {
      seasons.add("verano");
      seasons.add("primavera");
    } else if (isHotWinter && !isCold) {
      seasons.add("invierno");
      seasons.add("otono");
    } else {
      if (isCold || r.metodo === "parrilla" || /\b(tomate|choclo|zapallito|berenjena|albahaca|limon|pescado|atun|camaron|langostino)\b/.test(txt)) {
        seasons.add("verano");
      }
      if (isHotWinter || r.metodo === "horno") {
        seasons.add("invierno");
      }
      if (isAutumn) seasons.add("otono");
      if (isSpring) seasons.add("primavera");
    }

    if (seasons.size === 0) {
      seasons.add("verano");
      seasons.add("otono");
      seasons.add("invierno");
      seasons.add("primavera");
    }

    recipeSeasonsCache.set(r.id, seasons);
    return seasons;
  }

  function matchesSeasonFilter(r) {
    if (state.selectedSeason === "all") return true;
    return getRecipeSeasons(r).has(state.selectedSeason);
  }

  function matchesCaloriesFilter(r) {
    if (state.selectedCalories === "all") return true;
    const kcal = getRecipeCalories(r);
    if (state.selectedCalories === "low") return kcal <= 250;
    if (state.selectedCalories === "mid") return kcal > 250 && kcal <= 450;
    if (state.selectedCalories === "high") return kcal > 450;
    return true;
  }

  function populateDietFilterSelect() {
    if (!els.dietFilterSelect || typeof DIET_PLANS === "undefined") return;
    const opts = ['<option value="all">Todas las dietas</option>'];
    Object.values(DIET_PLANS).forEach((p) => {
      opts.push(`<option value="${p.key}">${p.shortLabel || p.label}</option>`);
    });
    els.dietFilterSelect.innerHTML = opts.join("");
    els.dietFilterSelect.value = state.selectedDiet;
  }

  function matchesDietFilter(r) {
    if (state.selectedDiet === "all") return true;
    const cacheKey = `${r.id}::${state.selectedDiet}`;
    if (recipeDietMatchCache.has(cacheKey)) return recipeDietMatchCache.get(cacheKey);
    let ok = true;
    if (typeof getRecipeNutritionAndMedia === "function" && typeof evaluateDietCompatibility === "function") {
      try {
        const baseMedia = getRecipeNutritionAndMedia(r);
        const adapt = typeof adaptRecipeIngredientsForDiet === "function"
          ? adaptRecipeIngredientsForDiet(r, state.selectedDiet, null, false)
          : null;
        const ev = evaluateDietCompatibility(baseMedia.nutrition, state.selectedDiet, false, adapt);
        ok = ev.status === "optimal" || ev.status === "good";
      } catch {
        ok = true;
      }
    }
    recipeDietMatchCache.set(cacheKey, ok);
    return ok;
  }

  function syncSmartFiltersUI() {
    if (els.timeMomentToggle && els.timeMomentLabel) {
      const mKey = getCurrentMomentKey();
      const mMeta = getMenuItemById("momento", mKey);
      els.timeMomentToggle.classList.toggle("is-active", state.autoMomentByTime);
      els.timeMomentToggle.setAttribute("aria-pressed", String(state.autoMomentByTime));
      els.timeMomentLabel.textContent = state.autoMomentByTime
        ? `🕒 Por horario: ${mMeta?.label || mKey}`
        : "🍽️ Todos los momentos";
    }
    if (els.seasonFilterSelect) {
      els.seasonFilterSelect.value = state.selectedSeason;
      els.seasonFilterSelect.closest(".smart-select-wrap")?.classList.toggle("is-filtered", state.selectedSeason !== "all");
    }
    if (els.caloriesFilterSelect) {
      els.caloriesFilterSelect.value = state.selectedCalories;
      els.caloriesFilterSelect.closest(".smart-select-wrap")?.classList.toggle("is-filtered", state.selectedCalories !== "all");
    }
    if (els.dietFilterSelect) {
      els.dietFilterSelect.value = state.selectedDiet;
      els.dietFilterSelect.closest(".smart-select-wrap")?.classList.toggle("is-filtered", state.selectedDiet !== "all");
    }
  }

  function releaseWakeLock() {
    if (wakeLockSentinel) {
      try {
        wakeLockSentinel.release();
      } catch {
        // Ignorar si ya fue liberado
      }
      wakeLockSentinel = null;
    }
    state.wakeLockActive = false;
  }

  async function toggleWakeLock() {
    if (state.wakeLockActive) {
      releaseWakeLock();
      if (state.activeRecipe) renderRecipeModalContent();
      return;
    }
    if (!("wakeLock" in navigator)) {
      state.wakeLockActive = false;
      const btn = document.getElementById("modal-wake-lock-btn");
      if (btn) btn.title = "Tu navegador no soporta mantener pantalla encendida";
      return;
    }
    try {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
      state.wakeLockActive = true;
      wakeLockSentinel.addEventListener("release", () => {
        wakeLockSentinel = null;
        state.wakeLockActive = false;
        if (state.activeRecipe) renderRecipeModalContent();
      });
    } catch {
      state.wakeLockActive = false;
    }
    if (state.activeRecipe) renderRecipeModalContent();
  }

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
    if (els.themeCycleBtn) {
      const icons = { light: "☀️", warm: "🔥", dark: "🌙" };
      const labels = { light: "Tema claro", warm: "Tema cálido", dark: "Tema oscuro" };
      els.themeCycleBtn.textContent = icons[theme] || "🔥";
      els.themeCycleBtn.title = `${labels[theme] || "Tema"} (tocar para cambiar)`;
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const colors = { light: "#f6f7fb", warm: "#fbf7f1", dark: "#12100e" };
      themeMeta.setAttribute("content", colors[theme] || "#fbf7f1");
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
    } catch {
      // Ignorar errores de almacenamiento privado
    }
    if (window.QCHCloud?.syncUserData) {
      window.QCHCloud.syncUserData({ favorites: state.favorites });
    }
  }

  window.addEventListener("qch:favorites-synced", (ev) => {
    const synced = ev.detail?.favorites;
    if (Array.isArray(synced)) {
      state.favorites = synced;
      updateFavBadge();
      renderNowIdeas();
      if (els.resultsModal && !els.resultsModal.hidden) renderResultsModal();
    }
  });

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
    renderNowIdeas();
    if (!els.resultsModal.hidden) renderResultsModal();
    if (state.activeRecipe && state.activeRecipe.id === id) {
      renderRecipeModalContent();
    }
  }

  function updateFavBadge() {
    els.favCount.textContent = state.favorites.length;
    if (els.mobileFavCount) {
      els.mobileFavCount.textContent = state.favorites.length;
      els.mobileFavCount.hidden = state.favorites.length === 0;
    }
  }

  function getFilteredRecipes(customPath = state.selectedPath) {
    const q = state.searchQuery.trim().toLowerCase();
    const effectiveMoment =
      customPath.momento ||
      (state.autoMomentByTime && !state.onlyFavorites && !q ? getCurrentMomentKey() : null);

    return state.recipes.filter((r) => {
      if (state.onlyFavorites && !isFavorite(r.id)) return false;
      if (state.onlyWithVideo && !r.videoUrl) return false;
      if (!matchesSeasonFilter(r)) return false;
      if (!matchesCaloriesFilter(r)) return false;
      if (!matchesDietFilter(r)) return false;
      if (window.CB_IS_RADIAL_RECIPE_COMPATIBLE && !window.CB_IS_RADIAL_RECIPE_COMPATIBLE(r)) return false;
      if (customPath.metodo && r.metodo !== customPath.metodo) return false;
      if (effectiveMoment && r.momento !== effectiveMoment) return false;
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

  function saveActiveFilter() {
    try {
      localStorage.setItem(
        ACTIVE_FILTER_KEY,
        JSON.stringify({
          selectedPath: state.selectedPath,
          searchQuery: state.searchQuery,
          onlyFavorites: state.onlyFavorites
        })
      );
    } catch {
      // Ignorar errores de almacenamiento privado
    }
  }

  function buildRecipeUrl(recipeId) {
    saveActiveFilter();
    const params = new URLSearchParams();
    MENU_LEVELS.forEach((l) => {
      const val = state.selectedPath[l.key];
      if (val) params.set(l.key, val);
    });
    const q = state.searchQuery.trim();
    if (q) params.set("q", q);
    if (state.onlyFavorites) params.set("fav", "1");
    const qs = params.toString();
    return `./recetas/${encodeURIComponent(recipeId)}/${qs ? `?${qs}` : ""}`;
  }

  function openRecipeInNewTab(recipeId) {
    const url = buildRecipeUrl(recipeId);
    const win = window.open(url, "_blank", "noopener");
    if (!win) {
      window.location.href = url;
    }
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
    state.resultsPage = 0;
    syncUI();

    // Si eligió una opción del último nivel (Nivel 4: estilo), abrir directo en nueva pestaña si queda 1 receta o mostrar grilla paginada
    const isLastLevel = levelIndex === MENU_LEVELS.length - 1;
    if (isLastLevel && !alreadySelected) {
      const filtered = getFilteredRecipes();
      if (filtered.length === 1) {
        openRecipeInNewTab(filtered[0].id);
      } else {
        openResultsModal();
      }
    }
  }

  function handleCenterClick() {
    const filtered = getFilteredRecipes();
    const hasFilters =
      Object.keys(state.selectedPath).length > 0 ||
      Boolean(state.searchQuery.trim()) ||
      state.onlyFavorites;
    if (hasFilters && filtered.length === 1) {
      openRecipeInNewTab(filtered[0].id);
      return;
    }
    openResultsModal();
  }

  function stepBackLevel() {
    const keys = MENU_LEVELS.map((l) => l.key).filter((k) => state.selectedPath[k]);
    if (keys.length === 0) return;
    delete state.selectedPath[keys[keys.length - 1]];
    state.resultsPage = 0;
    syncUI();
  }

  function jumpToLevel(targetLevelIdx) {
    const nextPath = {};
    for (let i = 0; i < targetLevelIdx; i++) {
      const k = MENU_LEVELS[i].key;
      if (state.selectedPath[k]) nextPath[k] = state.selectedPath[k];
    }
    state.selectedPath = nextPath;
    state.resultsPage = 0;
    syncUI();
  }

  function renderLegend() {
    if (!els.legendItems) return;
    const firstUnselectedIdx = MENU_LEVELS.findIndex((l) => !state.selectedPath[l.key]);
    const allDone = firstUnselectedIdx === -1;

    els.legendItems.forEach((btn) => {
      const idx = Number(btn.dataset.stepIndex);
      const level = MENU_LEVELS[idx];
      const selectedId = level ? state.selectedPath[level.key] : null;
      const selectedItem = selectedId ? getMenuItemById(level.key, selectedId) : null;
      const isDone = Boolean(selectedItem);
      const isActive = (!allDone && idx === firstUnselectedIdx) || (allDone && idx === MENU_LEVELS.length - 1);

      btn.classList.toggle("is-done", isDone);
      btn.classList.toggle("is-active", isActive);
      btn.disabled = !isDone;

      const strong = document.createElement("strong");
      strong.textContent = `${idx + 1}.`;
      const labelText = selectedItem ? ` ${selectedItem.shortLabel}` : level ? ` ${level.title}` : "";
      btn.replaceChildren(strong, document.createTextNode(labelText));

      if (selectedItem) {
        btn.style.setProperty("--legend-color", selectedItem.color);
      } else {
        btn.style.removeProperty("--legend-color");
      }
    });
  }

  function resetAllFilters() {
    state.selectedPath = {};
    state.searchQuery = "";
    state.onlyFavorites = false;
    state.onlyWithVideo = false;
    state.selectedSeason = "all";
    state.selectedCalories = "all";
    state.selectedDiet = "all";
    state.resultsPage = 0;
    activeQuickChip = null;
    els.searchInput.value = "";
    els.searchSubmitBtn.hidden = true;
    els.favToggleBtn.classList.remove("is-active");
    els.quickFilterChips?.forEach((c) => c.classList.remove("is-active"));
    syncUI();
    if (!els.resultsModal.hidden) renderResultsModal();
  }

  function renderBreadcrumb() {
    const keys = MENU_LEVELS.map((l) => l.key).filter((k) => state.selectedPath[k]);
    els.backWheelBtn.hidden = keys.length === 0;
    els.resetWheelBtn.hidden = keys.length === 0;

    if (keys.length === 0) {
      els.breadcrumb.innerHTML =
        '<span class="crumb-root">Inicio · Elegí un momento del día o tocá el centro para ver todas</span>';
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
        state.resultsPage = 0;
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
    setMobileNavActive("explore");
  }

  function renderResultsModal() {
    const list = getFilteredRecipes();
    els.resultsModalCount.textContent = `${list.length} ${list.length === 1 ? "receta" : "recetas"}`;

    const activeLabels = MENU_LEVELS.map((l) => {
      const id = state.selectedPath[l.key];
      return id ? getMenuItemById(l.key, id)?.label : null;
    }).filter(Boolean);

    if (state.onlyFavorites) activeLabels.unshift("Favoritos");
    if (state.onlyWithVideo) activeLabels.unshift("🎬 Con video");
    if (!state.selectedPath.momento && state.autoMomentByTime && !state.onlyFavorites && !state.searchQuery.trim()) {
      const mMeta = getMenuItemById("momento", getCurrentMomentKey());
      if (mMeta) activeLabels.unshift(`🕒 ${mMeta.label}`);
    }
    if (state.selectedSeason !== "all") activeLabels.push(SEASON_LABELS[state.selectedSeason]);
    if (state.selectedCalories !== "all") activeLabels.push(CALORIES_LABELS[state.selectedCalories]);
    if (state.selectedDiet !== "all" && typeof DIET_PLANS !== "undefined" && DIET_PLANS[state.selectedDiet]) {
      activeLabels.push(DIET_PLANS[state.selectedDiet].shortLabel || DIET_PLANS[state.selectedDiet].label);
    }
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
      if (els.resultsPagination) {
        els.resultsPagination.innerHTML = "";
        els.resultsPagination.hidden = true;
      }
      els.resultsEmptyState.hidden = false;
      return;
    }

    els.resultsEmptyState.hidden = true;
    const totalPages = Math.ceil(list.length / state.resultsPageSize);
    state.resultsPage = Math.min(state.resultsPage, Math.max(0, totalPages - 1));
    const startIdx = state.resultsPage * state.resultsPageSize;
    const pageItems = list.slice(startIdx, startIdx + state.resultsPageSize);

    els.resultsModalGrid.innerHTML = pageItems
      .map((r) => {
        const metodo = getMenuItemById("metodo", r.metodo);
        const momento = getMenuItemById("momento", r.momento);
        const categoria = getMenuItemById("categoria", r.categoria);
        const estilo = getMenuItemById("estilo", r.estilo);
        const totalMin = (r.prepMinutes || 0) + (r.cookMinutes || 0);
        const fav = isFavorite(r.id);
        const bannerColor = metodo?.color || "#3b82f6";

        return `
          <article class="recipe-card recipe-card-compact" data-id="${r.id}">
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
                ${r.videoUrl ? `<span class="tag tag-video">🎬 Video</span>` : ""}
                ${isGlutenFreeRecipe(r) ? `<span class="tag tag-gf">🌾 Sin Gluten</span>` : ""}
                ${momento ? `<span class="tag">${momento.emoji || ""} ${momento.shortLabel}</span>` : ""}
                ${categoria ? `<span class="tag">${categoria.emoji || ""} ${categoria.shortLabel}</span>` : ""}
                ${estilo ? `<span class="tag">${estilo.emoji || ""} ${estilo.shortLabel}</span>` : ""}
              </div>
              <div class="card-footer-bar">
                <div class="card-meta-inline">
                  <span>⏱️ ${totalMin}m</span>
                  <span>🔥 ${getRecipeCalories(r)} kcal</span>
                  <span>🍽️ ${r.servings}p</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  ${
                    window.CB_IS_LOGGED_IN && window.CB_IS_LOGGED_IN()
                      ? `<button type="button" class="cb-btn cb-btn-sm cb-btn-primary" data-cb-pick-id="${r.id}">✓ Elegir para ${window.CB_GET_DAY_WORD ? window.CB_GET_DAY_WORD() : "hoy"}</button>`
                      : ""
                  }
                  <a href="${buildRecipeUrl(r.id)}" target="_blank" rel="noopener" class="card-view-link" data-view-id="${r.id}">Abrir receta ↗</a>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    if (els.resultsPagination) {
      if (totalPages > 1) {
        const pageButtons = Array.from({ length: totalPages }, (_, i) => {
          return `<button type="button" class="page-num ${i === state.resultsPage ? "is-active" : ""}" data-page-idx="${i}" aria-label="Página ${i + 1}" ${i === state.resultsPage ? 'aria-current="page"' : ""}>${i + 1}</button>`;
        }).join("");

        els.resultsPagination.innerHTML = `
          <button type="button" class="page-btn" data-page-dir="-1" ${state.resultsPage === 0 ? "disabled" : ""}>‹ Anterior</button>
          <div class="page-numbers" role="group" aria-label="Páginas">${pageButtons}</div>
          <button type="button" class="page-btn" data-page-dir="1" ${state.resultsPage >= totalPages - 1 ? "disabled" : ""}>Siguiente ›</button>
        `;
        els.resultsPagination.hidden = false;

        els.resultsPagination.querySelectorAll("[data-page-dir]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const next = state.resultsPage + Number(btn.dataset.pageDir);
            if (next >= 0 && next < totalPages) {
              state.resultsPage = next;
              renderResultsModal();
            }
          });
        });

        els.resultsPagination.querySelectorAll("[data-page-idx]").forEach((btn) => {
          btn.addEventListener("click", () => {
            state.resultsPage = Number(btn.dataset.pageIdx);
            renderResultsModal();
          });
        });
      } else {
        els.resultsPagination.innerHTML = "";
        els.resultsPagination.hidden = true;
      }
    }

    els.resultsModalGrid.querySelectorAll("[data-cb-pick-id]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const rec = state.recipes.find((item) => item.id === btn.dataset.cbPickId);
        if (!rec || !window.CB_LOG_RADIAL_RECIPE) return;
        window.CB_LOG_RADIAL_RECIPE(rec, "planned");
        closeResultsModal();
      });
    });

    els.resultsModalGrid.querySelectorAll(".recipe-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (
          e.target.closest("[data-fav-id]") ||
          e.target.closest("[data-cb-pick-id]") ||
          e.target.closest("a.card-view-link")
        ) {
          return;
        }
        e.preventDefault();
        openRecipeInNewTab(card.dataset.id);
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

  function openRecipeModal(recipe, fromResults = false, initialTab = "ingredients") {
    state.activeRecipe = recipe;
    state.currentServings = recipe.servings || 2;
    state.cameFromResultsModal = fromResults;
    state.recipeTab = initialTab;
    state.cookingStepIndex = null;
    state.showSupermarketView = initialTab === "market";
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
    releaseWakeLock();
    els.modal.hidden = true;
    state.activeRecipe = null;
    state.recipeTab = "ingredients";
    state.cookingStepIndex = null;
    state.showSupermarketView = false;
    state.selectedChainId = null;
    state.checkedIngredients = {};
    if (els.resultsModal.hidden) {
      document.body.style.overflow = "";
    }
  }

  function backToResultsModal() {
    releaseWakeLock();
    els.modal.hidden = true;
    state.activeRecipe = null;
    state.recipeTab = "ingredients";
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
      <div class="market-view market-view-compact">
        <div class="market-controls market-controls-compact">
          <div class="market-location-bar">
            <label for="market-barrio-select" class="market-label">📍 Barrio:</label>
            <select id="market-barrio-select" class="market-select">
              ${MDEO_BARRIOS.map(
                (b) => `<option value="${b.id}" ${!state.userGpsCoords && state.selectedBarrio === b.id ? "selected" : ""}>${b.label}</option>`
              ).join("")}
            </select>
            <button type="button" id="market-gps-btn" class="btn-gps ${state.userGpsCoords ? "is-active" : ""}">
              ${state.userGpsCoords ? "📡 GPS activo" : "📍 GPS"}
            </button>
            ${state.gpsStatus ? `<span class="gps-status">${state.gpsStatus}</span>` : ""}
          </div>

          <div class="market-sort-row">
            <div class="market-sort-pills" role="group" aria-label="Criterio de comparación">
              <button type="button" class="sort-pill ${state.marketSortBy === "price" ? "is-active" : ""}" data-market-sort="price">💰 Mejor precio</button>
              <button type="button" class="sort-pill ${state.marketSortBy === "distance" ? "is-active" : ""}" data-market-sort="distance">📍 Más cerca</button>
              <button type="button" class="sort-pill ${state.marketSortBy === "smart" ? "is-active" : ""}" data-market-sort="smart">⚖️ Balance</button>
            </div>
            <div class="servings-calc" aria-label="Calculadora de porciones">
              <button type="button" id="servings-minus" class="calc-btn" aria-label="Menos porciones">−</button>
              <span id="servings-value">${state.currentServings} ${state.currentServings === 1 ? "porción" : "porciones"}</span>
              <button type="button" id="servings-plus" class="calc-btn" aria-label="Más porciones">+</button>
            </div>
          </div>
        </div>

        <div class="market-split-layout">
          <div class="market-chains-list">
            ${comparisons
              .map((c, idx) => {
                const isSelected = c.chainId === activeChain.chainId;
                let badgeText = "";
                if (c.isCheapest && state.marketSortBy === "price") badgeText = "🏆 Más barato";
                else if (c.isNearest && state.marketSortBy === "distance") badgeText = "📍 Más cerca";
                else if (c.isSmartest && state.marketSortBy === "smart") badgeText = "⭐ Mejor balance";
                else if (c.isCheapest) badgeText = "💰 Mejor precio";
                else if (c.isNearest) badgeText = "📍 Cercano";

                return `
                  <article class="market-chain-card market-chain-row ${isSelected ? "is-selected" : ""}" data-chain-id="${c.chainId}" style="--chain-color:${c.color}" tabindex="0" role="button">
                    <div class="chain-row-main">
                      <div class="chain-row-title">
                        <span class="chain-rank">#${idx + 1}</span>
                        <h4 class="chain-name">${c.chainName}</h4>
                        ${badgeText ? `<span class="chain-badge">${badgeText}</span>` : ""}
                      </div>
                      <div class="chain-branch-compact">
                        <span>${c.closestBranch.name} · ${c.closestBranch.distanceKm} km (~${c.closestBranch.blocks} cuadras)</span>
                        <a href="${c.closestBranch.mapsUrl}" target="_blank" rel="noopener noreferrer" class="chain-map-link" data-stop-card="true">Mapa ↗</a>
                      </div>
                    </div>
                    <div class="chain-price">$ ${c.totalUYU} <small>UYU</small></div>
                  </article>
                `;
              })
              .join("")}
          </div>

          <div class="market-breakdown market-breakdown-compact">
            <div class="market-breakdown-head">
              <div>
                <h4>En <span style="color:${activeChain.color}">${activeChain.chainName}</span></h4>
                <p class="market-note">Productos reales de <strong>precios.db</strong> · Envases: <strong>$ ${activeChain.totalPacksUYU || activeChain.totalUYU} UYU</strong></p>
              </div>
              <strong class="breakdown-total">$ ${activeChain.totalUYU} UYU</strong>
            </div>

            <ul class="market-items-list market-items-compact">
              ${activeChain.items
                .map((item) => {
                  const qty = formatAmount(item.amount, multiplier);
                  const unit = item.unit ? ` ${item.unit}` : "";
                  const tags = item.matchedDietTags || [];
                  let dietBadge = "";
                  if (tags.includes("sin_tacc")) dietBadge = "🌾 Sin TACC";
                  else if (tags.includes("sin_lactosa")) dietBadge = "🥛 Sin lactosa";
                  else if (tags.includes("sin_azucar")) dietBadge = "🍯 Sin azúcar";

                  return `
                    <li class="market-item-row ${item.checked ? "is-owned" : ""}">
                      <label class="market-item-check">
                        <input type="checkbox" class="market-own-checkbox" data-ing-idx="${item.index}" ${item.checked ? "checked" : ""} />
                        <span>
                          <strong>${qty}${unit}</strong> ${item.item}
                          ${
                            item.matchedProductName
                              ? `<small class="ing-adapt-meta">
                                  ${dietBadge ? `<span class="ing-adapt-badge">${dietBadge}</span>` : ""}
                                  📦 ${item.matchedProductName} · Envase: $ ${item.packPriceUYU || item.estimatedFullPriceUYU}
                                </small>`
                              : ""
                          }
                        </span>
                      </label>
                      <div class="market-item-actions">
                        <span class="market-item-price">
                          ${item.checked ? "<s>$ " + item.estimatedFullPriceUYU + "</s> $ 0" : "$ " + item.priceUYU}
                        </span>
                        <a href="${item.gondolaUrl}" target="_blank" rel="noopener noreferrer" class="btn-gondola">
                          Góndola ↗
                        </a>
                      </div>
                    </li>
                  `;
                })
                .join("")}
            </ul>
          </div>
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
    const activeTab = state.recipeTab || "ingredients";
    const isStepMode = activeTab === "steps" && state.cookingStepIndex !== null && r.steps.length > 0;
    state.showSupermarketView = activeTab === "market";

    let tabPanelHtml = "";
    if (activeTab === "market") {
      tabPanelHtml = renderSupermarketComparisonView(r, multiplier);
    } else if (activeTab === "steps") {
      tabPanelHtml = isStepMode
        ? renderStepFocusView(r)
        : `
          <div class="recipe-tab-panel">
            <div class="steps-head">
              <h3>Preparación paso a paso</h3>
              ${
                r.steps.length > 0
                  ? `<button type="button" id="enter-step-mode-btn" class="btn-step-mode">👨‍🍳 Modo Paso a Paso Grande</button>`
                  : ""
              }
            </div>
            <ol class="steps-list steps-list-compact">
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
          </div>
        `;
    } else {
      tabPanelHtml = `
        <div class="recipe-tab-panel">
          <div class="section-head">
            <div>
              <h3>Ingredientes</h3>
              <p class="tab-helper">Marcá lo que ya tenés en casa para descontarlo en Supermercados.</p>
            </div>
            <div class="servings-calc" aria-label="Calculadora de porciones">
              <button type="button" id="servings-minus" class="calc-btn" aria-label="Menos porciones">−</button>
              <span id="servings-value">${state.currentServings} ${state.currentServings === 1 ? "porción" : "porciones"}</span>
              <button type="button" id="servings-plus" class="calc-btn" aria-label="Más porciones">+</button>
            </div>
          </div>
          <ul class="checklist checklist-grid">
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
          <div class="tab-footer-actions">
            <button type="button" class="btn-tab-nav" data-goto-tab="steps">Ir a Preparación paso a paso →</button>
            <button type="button" class="btn-tab-nav is-accent" data-goto-tab="market">🛒 Comparar precios en Montevideo →</button>
          </div>
        </div>
      `;
    }

    els.modalBody.innerHTML = `
      <div class="modal-header-compact">
        <div class="modal-top-meta">
          ${
            state.cameFromResultsModal
              ? `<button type="button" id="back-to-results-btn" class="btn-back-results">← Lista</button>`
              : ""
          }
          <div class="modal-badges">
            ${metodo ? `<span class="method-pill" style="--pill-color:${metodo.color}">${metodo.emoji || ""} ${metodo.label}</span>` : ""}
            ${r.videoUrl ? `<span class="tag tag-video">🎬 Video</span>` : ""}
            ${isGlutenFreeRecipe(r) ? `<span class="tag tag-gf">🌾 Sin Gluten</span>` : ""}
            ${momento ? `<span class="tag">${momento.emoji || ""} ${momento.shortLabel}</span>` : ""}
            ${categoria ? `<span class="tag">${categoria.emoji || ""} ${categoria.shortLabel}</span>` : ""}
            ${estilo ? `<span class="tag">${estilo.emoji || ""} ${estilo.shortLabel}</span>` : ""}
          </div>
          <div class="modal-mini-stats">
            <span class="mini-stat">⏱️ Prep ${r.prepMinutes}m</span>
            <span class="mini-stat">🔥 Cocción ${r.cookMinutes}m</span>
            ${r.temperatureC ? `<span class="mini-stat">🌡️ ${r.temperatureC}°C</span>` : ""}
            <span class="mini-stat">📊 ${r.difficulty || "Fácil"}</span>
          </div>
          <button type="button" id="modal-wake-lock-btn" class="btn-wake-lock ${state.wakeLockActive ? "is-active" : ""}" aria-pressed="${state.wakeLockActive}">
            ${state.wakeLockActive ? "☀️ Pantalla activa" : "💡 Mantener pantalla"}
          </button>
          <button type="button" id="modal-fav-btn" class="btn-fav-modal ${fav ? "is-fav" : ""}">
            ${fav ? "♥ En favoritos" : "♡ Guardar"}
          </button>
        </div>

        <div class="modal-title-row">
          <h2 id="modal-title">${r.title}</h2>
          ${
            r.videoUrl
              ? `<a href="${buildRecipeUrl(r.id)}&tab=video" target="_blank" rel="noopener" class="btn-tab-nav is-accent">🎬 Ver video paso a paso ↗</a>`
              : ""
          }
        </div>
        <p class="modal-desc modal-desc-compact">${r.description}</p>
        ${
          window.CB_IS_LOGGED_IN && window.CB_IS_LOGGED_IN()
            ? `<div class="cb-radial-log-bar">
                <span style="font-size:12px;font-weight:700;color:#22533a;">🌿 COMER BIEN:</span>
                <button type="button" id="cb-radial-eat" class="cb-btn cb-btn-sm cb-btn-primary">✓ Ya lo comí hoy</button>
                <button type="button" id="cb-radial-plan" class="cb-btn cb-btn-sm cb-btn-outline">📅 Pienso comer esto hoy</button>
                <span id="cb-radial-fb" style="font-size:12px;font-weight:700;color:#065f46;"></span>
              </div>`
            : ""
        }
      </div>

      <div class="recipe-tabs" role="tablist" aria-label="Secciones de la receta">
        <button type="button" role="tab" class="recipe-tab-btn ${activeTab === "ingredients" ? "is-active" : ""}" data-recipe-tab="ingredients" aria-selected="${activeTab === "ingredients"}">
          🧺 Ingredientes (${r.ingredients.length})
        </button>
        <button type="button" role="tab" class="recipe-tab-btn ${activeTab === "steps" ? "is-active" : ""}" data-recipe-tab="steps" aria-selected="${activeTab === "steps"}">
          👩‍🍳 Preparación (${r.steps.length} pasos)
        </button>
        <button type="button" role="tab" class="recipe-tab-btn ${activeTab === "market" ? "is-active" : ""}" data-recipe-tab="market" aria-selected="${activeTab === "market"}">
          🛒 Supermercados en Mdeo
        </button>
      </div>

      <div class="recipe-tab-body">
        ${tabPanelHtml}
      </div>
    `;

    const backBtn = document.getElementById("back-to-results-btn");
    if (backBtn) {
      backBtn.addEventListener("click", backToResultsModal);
    }

    document.getElementById("modal-fav-btn").addEventListener("click", () => toggleFavorite(r.id));
    document.getElementById("modal-wake-lock-btn")?.addEventListener("click", toggleWakeLock);

    const cbEatBtn = document.getElementById("cb-radial-eat");
    const cbPlanBtn = document.getElementById("cb-radial-plan");
    const cbFb = document.getElementById("cb-radial-fb");
    if (cbEatBtn && window.CB_LOG_RADIAL_RECIPE) {
      cbEatBtn.addEventListener("click", () => {
        const res = window.CB_LOG_RADIAL_RECIPE(r, "eaten");
        if (res === "returned") {
          closeRecipeModal();
          closeResultsModal();
          return;
        }
        if (cbFb) cbFb.textContent = "✓ Actualizado como comido hoy";
      });
    }
    if (cbPlanBtn && window.CB_LOG_RADIAL_RECIPE) {
      cbPlanBtn.addEventListener("click", () => {
        const res = window.CB_LOG_RADIAL_RECIPE(r, "planned");
        if (res === "returned") {
          closeRecipeModal();
          closeResultsModal();
          return;
        }
        if (cbFb) cbFb.textContent = "✓ Actualizado para hoy";
      });
    }

    const switchTab = (nextTab) => {
      state.recipeTab = nextTab;
      state.showSupermarketView = nextTab === "market";
      if (nextTab !== "steps") state.cookingStepIndex = null;
      renderRecipeModalContent();
    };

    els.modalBody.querySelectorAll("[data-recipe-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.recipeTab));
    });

    els.modalBody.querySelectorAll("[data-goto-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.gotoTab));
    });

    if (activeTab === "market") {
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
    } else if (activeTab === "steps") {
      const enterStepBtn = document.getElementById("enter-step-mode-btn");
      if (enterStepBtn) {
        enterStepBtn.addEventListener("click", () => {
          state.cookingStepIndex = 0;
          renderRecipeModalContent();
        });
      }
    } else {
      els.modalBody.querySelectorAll(".recipe-ing-checkbox").forEach((cb) => {
        cb.addEventListener("change", (e) => {
          state.checkedIngredients[e.target.dataset.ingIdx] = e.target.checked;
        });
      });
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

  function getCurrentMomentKey() {
    const h = new Date().getHours();
    if (h < 10) return "desayuno";
    if (h < 14) return "almuerzo";
    if (h < 18) return "merienda";
    return "cena";
  }

  function renderNowIdeas() {
    if (!els.nowIdeasSection || state.recipes.length === 0) return;

    const momentKey = getCurrentMomentKey();
    const momentMeta = getMenuItemById("momento", momentKey);
    const compatible = state.recipes.filter((r) => {
      if (state.autoMomentByTime && r.momento !== momentKey) return false;
      if (!matchesSeasonFilter(r)) return false;
      if (!matchesCaloriesFilter(r)) return false;
      if (!matchesDietFilter(r)) return false;
      if (window.CB_IS_RADIAL_RECIPE_COMPATIBLE && !window.CB_IS_RADIAL_RECIPE_COMPATIBLE(r)) return false;
      return true;
    });

    const pool = compatible;
    const totalOf = (r) => (r.prepMinutes || 0) + (r.cookMinutes || 0);

    const pickColumnItems = (list, limit = 3) => {
      const gf = list.filter((r) => isGlutenFreeRecipe(r)).slice(0, 1);
      const used = new Set(gf.map((r) => r.id));
      const rest = list.filter((r) => !used.has(r.id)).slice(0, limit - gf.length);
      return [...gf, ...rest].slice(0, limit);
    };

    const columns = [
      {
        key: "fast",
        title: "⚡ Menos de 15 min",
        all: pool.filter((r) => totalOf(r) < 15)
      },
      {
        key: "medium",
        title: "⏱️ Entre 15 y 30 min",
        all: pool.filter((r) => totalOf(r) >= 15 && totalOf(r) <= 30)
      },
      {
        key: "slow",
        title: "🍲 Más de 30 min",
        all: pool.filter((r) => totalOf(r) > 30)
      }
    ].map((col) => ({
      ...col,
      items: pickColumnItems(col.all, 2)
    }));

    if (columns.every((c) => c.items.length === 0)) {
      els.nowIdeasSection.innerHTML = "";
      return;
    }

    const momentLabels = {
      desayuno: "Ideas para tu desayuno",
      almuerzo: "Ideas para el almuerzo",
      merienda: "Ideas para la merienda",
      cena: "Ideas para la cena"
    };

    const renderIdeaCard = (r) => {
      const totalMin = totalOf(r);
      const metodo = getMenuItemById("metodo", r.metodo);
      const fav = isFavorite(r.id);
      const isGf = isGlutenFreeRecipe(r);
      const waHref = window.QCHHomeDiscover?.getWhatsappShareHref
        ? window.QCHHomeDiscover.getWhatsappShareHref(r, getRecipeCalories(r))
        : "";
      return `
        <article class="now-idea-card" data-now-id="${r.id}">
          <div class="now-idea-top">
            <span class="now-idea-badge">${metodo?.emoji || "🍳"} ${metodo?.label || r.metodo}</span>
            <div class="now-idea-actions-mini">
              ${waHref ? `<a href="${waHref}" target="_blank" rel="noopener noreferrer" class="now-idea-wa" data-now-wa aria-label="Compartir por WhatsApp" title="Compartir por WhatsApp">${window.QCHHomeDiscover?.WA_ICON_SVG || "💬"}</a>` : ""}
              <button type="button" class="now-idea-fav ${fav ? "is-fav" : ""}" data-now-fav="${r.id}" aria-label="${fav ? "Quitar de favoritos" : "Guardar en favoritos"}">
                ${fav ? "♥" : "♡"}
              </button>
            </div>
          </div>
          <h3 class="now-idea-title">${r.title}</h3>
          <div class="now-idea-tags">
            ${r.videoUrl ? `<span class="tag tag-video">🎬 Video</span>` : ""}
            ${isGf ? `<span class="tag tag-gf">🌾 Sin Gluten</span>` : ""}
          </div>
          <div class="now-idea-meta">
            <span>⏱️ ${totalMin} min</span>
            <span>🔥 ${getRecipeCalories(r)} kcal</span>
            <span>🍽️ ${r.servings} porc.</span>
          </div>
        </article>
      `;
    };

    const headingTitle = state.autoMomentByTime
      ? `${momentMeta?.emoji || "🍽️"} ${momentLabels[momentKey] || "Ideas para ahora"}`
      : "🍽️ Ideas de todos los momentos";
    if (els.homeTabIdeasLabel) {
      els.homeTabIdeasLabel.textContent = `${headingTitle} (${pool.length})`;
    }
    const filterNotes = [];
    if (state.selectedSeason !== "all") filterNotes.push(SEASON_LABELS[state.selectedSeason]);
    if (state.selectedCalories !== "all") filterNotes.push(CALORIES_LABELS[state.selectedCalories]);
    const filterSuffix = filterNotes.length ? ` · ${filterNotes.join(" · ")}` : "";

    els.nowIdeasSection.innerHTML = `
      <div class="now-ideas-header">
        <div>
          <h2>${headingTitle}</h2>
          <p class="now-ideas-sub">Organizadas por tiempo de preparación (${pool.length} opciones disponibles${filterSuffix})</p>
        </div>
        <button type="button" id="now-ideas-see-all" class="now-ideas-more-btn">Ver todas →</button>
      </div>
      <div class="now-ideas-columns">
        ${columns
          .map(
            (col) => `
          <div class="now-ideas-col now-ideas-col-${col.key}">
            <div class="now-col-header">
              <span>${col.title}</span>
              <span class="now-col-count">${col.all.length}</span>
            </div>
            <div class="now-col-list">
              ${
                col.items.length > 0
                  ? col.items.map(renderIdeaCard).join("")
                  : `<p class="now-col-empty">Sin opciones en este rango</p>`
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    document.getElementById("now-ideas-see-all")?.addEventListener("click", () => {
      state.onlyFavorites = false;
      state.onlyWithVideo = false;
      state.searchQuery = "";
      if (els.searchInput) els.searchInput.value = "";
      els.quickFilterChips?.forEach((c) => c.classList.remove("is-active"));
      state.selectedPath = state.autoMomentByTime ? { momento: momentKey } : {};
      state.resultsPage = 0;
      syncUI();
      openResultsModal();
    });

    els.nowIdeasSection.querySelectorAll("[data-now-id]").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-now-fav]")) return;
        openRecipeInNewTab(card.dataset.nowId);
      });
    });

    els.nowIdeasSection.querySelectorAll("[data-now-wa]").forEach((a) => {
      a.addEventListener("click", (e) => e.stopPropagation());
    });

    els.nowIdeasSection.querySelectorAll("[data-now-fav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.nowFav);
      });
    });

    if (window.QCHHomeDiscover?.render) {
      window.QCHHomeDiscover.render();
    }
    if (window.QCHRoulette?.render && state.homeTab === "roulette") {
      window.QCHRoulette.render();
    }
  }

  function setMobileNavActive(activeKey) {
    if (!els.mobileNavBtns) return;
    els.mobileNavBtns.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mobileNav === activeKey);
    });
  }

  function applyMoodFilter(moodKey) {
    state.onlyFavorites = false;
    state.onlyWithVideo = false;
    state.resultsPage = 0;
    state.searchQuery = "";
    if (els.searchInput) els.searchInput.value = "";
    if (els.searchSubmitBtn) els.searchSubmitBtn.hidden = true;
    els.favToggleBtn?.classList.remove("is-active");
    state.selectedPath = {};

    if (moodKey === "fast") {
      state.selectedPath = { estilo: "express" };
    } else if (moodKey === "budget") {
      state.selectedPath = { estilo: "economico" };
    } else if (moodKey === "comfort") {
      state.selectedPath = { metodo: "olla" };
    } else if (moodKey === "light") {
      state.selectedCalories = "low";
      if (els.caloriesFilterSelect) els.caloriesFilterSelect.value = "low";
    }
    syncUI();
    openResultsModal();
  }

  window.QCHApp = {
    getRecipes: () => state.recipes,
    getFilteredPoolForHome: () => {
      const momentKey = getCurrentMomentKey();
      return state.recipes.filter((r) => {
        if (state.autoMomentByTime && r.momento !== momentKey) return false;
        if (!matchesSeasonFilter(r)) return false;
        if (!matchesCaloriesFilter(r)) return false;
        if (!matchesDietFilter(r)) return false;
        if (window.CB_IS_RADIAL_RECIPE_COMPATIBLE && !window.CB_IS_RADIAL_RECIPE_COMPATIBLE(r)) return false;
        return true;
      });
    },
    getCurrentMomentKey,
    getAutoMomentByTime: () => state.autoMomentByTime,
    isFavorite,
    toggleFavorite,
    getRecipeCalories,
    openRecipePage: (id) => {
      window.location.href = getRecipePageUrl(id);
    },
    applyMoodFilter
  };

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
        openRecipeInNewTab(btn.dataset.quickId);
      });
    });
  }

  function syncUI() {
    syncSmartFiltersUI();
    radialMenu.setSelectedPath(state.selectedPath);
    renderBreadcrumb();
    renderLegend();
    renderQuickSuggestions();
    renderNowIdeas();
    saveActiveFilter();
  }

  function bindGlobalEvents() {
    els.themeButtons.forEach((btn) => {
      btn.addEventListener("click", () => applyTheme(btn.dataset.themeBtn));
    });

    if (els.themeCycleBtn) {
      els.themeCycleBtn.addEventListener("click", () => {
        const order = ["warm", "dark", "light"];
        const nextIdx = (order.indexOf(state.theme) + 1) % order.length;
        applyTheme(order[nextIdx]);
      });
    }

    if (els.timeMomentToggle) {
      els.timeMomentToggle.addEventListener("click", () => {
        state.autoMomentByTime = !state.autoMomentByTime;
        if (!state.autoMomentByTime && state.selectedPath.momento) {
          delete state.selectedPath.momento;
        }
        state.resultsPage = 0;
        syncUI();
        if (!els.resultsModal.hidden) renderResultsModal();
      });
    }

    if (els.seasonFilterSelect) {
      els.seasonFilterSelect.addEventListener("change", () => {
        state.selectedSeason = els.seasonFilterSelect.value || "all";
        state.resultsPage = 0;
        syncUI();
        if (!els.resultsModal.hidden) renderResultsModal();
      });
    }

    if (els.caloriesFilterSelect) {
      els.caloriesFilterSelect.addEventListener("change", () => {
        state.selectedCalories = els.caloriesFilterSelect.value || "all";
        state.resultsPage = 0;
        syncUI();
        if (!els.resultsModal.hidden) renderResultsModal();
      });
    }

    if (els.dietFilterSelect) {
      populateDietFilterSelect();
      els.dietFilterSelect.addEventListener("change", () => {
        state.selectedDiet = els.dietFilterSelect.value || "all";
        state.resultsPage = 0;
        syncUI();
        if (!els.resultsModal.hidden) renderResultsModal();
      });
    }

    function setActiveHomeView(nextTab) {
      state.homeTab = nextTab;
      if (els.homeTabBtns) {
        els.homeTabBtns.forEach((b) => {
          const active = b.dataset.homeTab === nextTab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });
      }
      if (els.homeDiscoverStrip) els.homeDiscoverStrip.hidden = nextTab !== "home";
      if (els.homePanelWheel) els.homePanelWheel.hidden = nextTab !== "wheel";
      if (els.nowIdeasSection) els.nowIdeasSection.hidden = nextTab !== "ideas";
      if (els.homePanelFridge) els.homePanelFridge.hidden = nextTab !== "fridge";
      if (els.homePanelRoulette) els.homePanelRoulette.hidden = nextTab !== "roulette";
      if (nextTab === "wheel") {
        renderRadialMenu();
      }
      if ((nextTab === "home" || nextTab === "fridge") && window.QCHHomeDiscover?.render) {
        window.QCHHomeDiscover.render();
      }
      if (nextTab === "roulette" && window.QCHRoulette?.render) {
        window.QCHRoulette.render();
      }
    }

    if (els.homeTabBtns) {
      els.homeTabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const raw = btn.dataset.homeTab;
          const nextTab = ["home", "wheel", "ideas", "fridge"].includes(raw) ? raw : "home";
          setActiveHomeView(nextTab);
        });
      });
    }

    if (els.quickFilterChips) {
      els.quickFilterChips.forEach((chip) => {
        chip.addEventListener("click", () => {
          const kind = chip.dataset.quickChip;
          activeQuickChip = kind;
          els.quickFilterChips.forEach((c) => c.classList.toggle("is-active", c === chip));
          state.onlyFavorites = false;
          state.onlyWithVideo = false;
          state.resultsPage = 0;
          els.favToggleBtn.classList.remove("is-active");
          if (kind === "video") {
            state.selectedPath = {};
            state.searchQuery = "";
            els.searchInput.value = "";
            els.searchSubmitBtn.hidden = true;
            state.onlyWithVideo = true;
          } else if (kind === "gf") {
            state.selectedPath = {};
            state.searchQuery = "sin gluten";
            els.searchInput.value = "sin gluten";
            els.searchSubmitBtn.hidden = false;
          } else if (kind === "freidora") {
            state.searchQuery = "";
            els.searchInput.value = "";
            els.searchSubmitBtn.hidden = true;
            state.selectedPath = { metodo: "freidora" };
          } else {
            state.searchQuery = "";
            els.searchInput.value = "";
            els.searchSubmitBtn.hidden = true;
            state.selectedPath = { estilo: kind };
          }
          syncUI();
          openResultsModal();
        });
      });
    }

    if (els.mobileNavBtns) {
      els.mobileNavBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = btn.dataset.mobileNav;
          setMobileNavActive(target);
          if (target === "explore") {
            closeRecipeModal();
            closeResultsModal();
            document.querySelector('[data-cb-mode="radial"]')?.click();
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (target === "search") {
            closeRecipeModal();
            closeResultsModal();
            document.querySelector('[data-cb-mode="radial"]')?.click();
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => els.searchInput?.focus(), 180);
          } else if (target === "favorites") {
            state.onlyFavorites = true;
            state.resultsPage = 0;
            els.favToggleBtn.classList.add("is-active");
            syncUI();
            openResultsModal();
          } else if (target === "plan") {
            closeRecipeModal();
            closeResultsModal();
            if (window.CB_IS_LOGGED_IN && window.CB_IS_LOGGED_IN()) {
              document.querySelector('[data-cb-mode="comerbien"]')?.click();
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              document.getElementById("cb-auth-btn")?.click();
            }
          }
        });
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && state.wakeLockActive) {
        releaseWakeLock();
      }
    });

    if (els.legendItems) {
      els.legendItems.forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.stepIndex);
          if (!Number.isNaN(idx)) jumpToLevel(idx);
        });
      });
    }

    if (els.surpriseBtn) {
      els.surpriseBtn.addEventListener("click", () => {
        if (state.homeTab === "roulette" && window.QCHRoulette?.spin) {
          window.QCHRoulette.spin();
        } else {
          setActiveHomeView("roulette");
          els.homePanelRoulette?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }

    window.addEventListener("storage", (e) => {
      if (e.key === FAVORITES_KEY) {
        state.favorites = loadFavorites();
        updateFavBadge();
        if (!els.resultsModal.hidden) renderResultsModal();
      } else if (e.key === THEME_KEY && e.newValue) {
        applyTheme(e.newValue);
      }
    });

    els.searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      state.resultsPage = 0;
      els.searchSubmitBtn.hidden = !state.searchQuery.trim();
      syncUI();
    });

    els.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      state.resultsPage = 0;
      openResultsModal();
    });

    els.favToggleBtn.addEventListener("click", () => {
      state.onlyFavorites = true;
      state.onlyWithVideo = false;
      state.resultsPage = 0;
      els.favToggleBtn.classList.add("is-active");
      els.quickFilterChips?.forEach((c) => c.classList.remove("is-active"));
      syncUI();
      openResultsModal();
    });

    els.backWheelBtn.addEventListener("click", stepBackLevel);

    els.resetWheelBtn.addEventListener("click", () => {
      state.selectedPath = {};
      state.onlyWithVideo = false;
      state.resultsPage = 0;
      activeQuickChip = null;
      els.quickFilterChips?.forEach((c) => c.classList.remove("is-active"));
      syncUI();
    });

    els.emptyResetBtn.addEventListener("click", () => {
      resetAllFilters();
    });

    els.resultsModalClose.addEventListener("click", () => {
      state.onlyFavorites = false;
      state.onlyWithVideo = false;
      state.resultsPage = 0;
      els.favToggleBtn.classList.remove("is-active");
      els.quickFilterChips?.forEach((c) => c.classList.remove("is-active"));
      closeResultsModal();
      syncUI();
    });

    els.resultsModal.addEventListener("click", (e) => {
      if (e.target === els.resultsModal) {
        state.onlyFavorites = false;
        state.onlyWithVideo = false;
        state.resultsPage = 0;
        els.favToggleBtn.classList.remove("is-active");
        els.quickFilterChips?.forEach((c) => c.classList.remove("is-active"));
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
          state.onlyWithVideo = false;
          state.resultsPage = 0;
          els.favToggleBtn.classList.remove("is-active");
          els.quickFilterChips?.forEach((c) => c.classList.remove("is-active"));
          closeResultsModal();
          syncUI();
        }
      } else if (!els.resultsModal.hidden && els.modal.hidden) {
        if (e.key === "ArrowLeft" && state.resultsPage > 0) {
          e.preventDefault();
          state.resultsPage -= 1;
          renderResultsModal();
        } else if (e.key === "ArrowRight") {
          const totalPages = Math.ceil(getFilteredRecipes().length / state.resultsPageSize);
          if (state.resultsPage < totalPages - 1) {
            e.preventDefault();
            state.resultsPage += 1;
            renderResultsModal();
          }
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
      onStepClick: jumpToLevel,
      getItemCount: countForWheelSector,
      isItemDisabled: (levelKey, itemId) =>
        levelKey === "momento" && window.CB_IS_MOMENT_DISABLED
          ? window.CB_IS_MOMENT_DISABLED(itemId)
          : false
    });

    syncUI();
    renderNowIdeas();
    if (window.QCHHomeDiscover?.render) {
      window.QCHHomeDiscover.render();
    }
    if (window.QCHRoulette?.render && state.homeTab === "roulette") {
      window.QCHRoulette.render();
    }
  }

  window.CB_REFRESH_RADIAL = () => {
    if (radialMenu) radialMenu.render();
    renderNowIdeas();
    if (!els.resultsModal.hidden) renderResultsModal();
  };

  init();
})();
