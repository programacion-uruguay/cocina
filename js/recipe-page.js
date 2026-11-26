/**
 * Página dedicada del Estudio de Receta (`receta.html?id=<id>`):
 * - Panel izquierdo ("Split Minimalista"): Visuales (Fotos/Video), título e información clave mínima
 * - Panel derecho: 1 sola sección visible por vez (Ingredientes, Preparación, Calorías/Dieta, Supermercados)
 */

(function () {
  const FAVORITES_KEY = "cocina_radial_favorites_v1";
  const THEME_KEY = "cocina_radial_theme_v1";
  const DIET_PLAN_KEY = "cocina_radial_diet_plan_v1";
  const CUSTOM_MEDIA_KEY = "cocina_radial_custom_media_v1";
  const ACTIVE_FILTER_KEY = "cocina_radial_active_filter_v1";

  const state = {
    recipes: [],
    activeRecipe: null,
    activeFilter: null,
    theme: loadStorage(THEME_KEY, "warm", (v) => ["light", "warm", "dark"].includes(v)),
    favorites: loadJsonStorage(FAVORITES_KEY, []),
    dietPlan: loadStorage(DIET_PLAN_KEY, "balanced", (v) => Boolean(DIET_PLANS[v])),
    adaptIngredients: true,
    customMedia: loadJsonStorage(CUSTOM_MEDIA_KEY, {}),
    lightMode: false,
    currentServings: 2,
    mediaTab: "photos", // "photos" | "video" | "custom"
    activePhotoIndex: 0,
    videoChapterIndex: 0,
    sessionVideoBlobUrl: "",
    mediaFeedback: "",
    rightTab: "ingredients", // "ingredients" | "steps" | "nutrition" | "market"
    cookingStepIndex: null,
    marketSortBy: "price",
    selectedBarrio: "cordon",
    userGpsCoords: null,
    gpsStatus: "",
    selectedChainId: null,
    checkedIngredients: {},
    wakeLockActive: false
  };

  const els = {
    quickSelect: document.getElementById("recipe-quick-select"),
    breadcrumbMeta: document.getElementById("studio-breadcrumb-meta"),
    favBtn: document.getElementById("page-fav-btn"),
    themeButtons: document.querySelectorAll("[data-theme-btn]"),
    themeCycleBtn: document.getElementById("theme-cycle-btn"),
    studio: document.getElementById("recipe-studio")
  };

  const timer = new CookingTimer();
  let wakeLockSentinel = null;
  let ytApiPromise = null;
  let ytPlayer = null;
  let ytDuration = 0;
  let ytPollInterval = null;

  function loadYouTubeIframeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve, reject) => {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === "function") {
          try { prevReady(); } catch {}
        }
        resolve(window.YT);
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => reject(new Error("No se pudo cargar YouTube API"));
      document.head.appendChild(tag);
    });
    return ytApiPromise;
  }

  function destroyYtPlayer() {
    if (ytPollInterval) {
      clearInterval(ytPollInterval);
      ytPollInterval = null;
    }
    if (ytPlayer) {
      try {
        if (typeof ytPlayer.destroy === "function") ytPlayer.destroy();
      } catch {
        // Ignorar
      }
      ytPlayer = null;
    }
    ytDuration = 0;
  }

  function formatSeconds(sec) {
    if (sec === null || sec === undefined || Number.isNaN(Number(sec))) return "";
    const total = Math.max(0, Math.floor(Number(sec)));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function getSavedChapterTimes(recipeId) {
    return state.customMedia[recipeId]?.chapterTimes || {};
  }

  function getChapterStartSec(recipe, idx, totalChapters, durationSec) {
    const saved = getSavedChapterTimes(recipe.id);
    if (saved && typeof saved[idx] === "number" && !Number.isNaN(saved[idx])) {
      return Math.max(0, Math.floor(saved[idx]));
    }
    const step = recipe.steps?.[idx];
    if (step && typeof step === "object" && typeof step.videoStartSec === "number") {
      return Math.max(0, Math.floor(step.videoStartSec));
    }
    if (durationSec > 0 && totalChapters > 0) {
      return idx === 0 ? 0 : Math.floor((durationSec * idx) / totalChapters);
    }
    return null;
  }

  function isGlutenFreeRecipe(r) {
    if (!r) return false;
    if (/-sg$/i.test(r.id || "")) return true;
    const text = `${r.title || ""} ${r.description || ""}`;
    return /sin\s*(gluten|tacc)/i.test(text);
  }

  function releaseWakeLock() {
    if (wakeLockSentinel) {
      try {
        wakeLockSentinel.release();
      } catch {
        // Ignorar
      }
      wakeLockSentinel = null;
    }
    state.wakeLockActive = false;
  }

  async function toggleWakeLock() {
    if (state.wakeLockActive) {
      releaseWakeLock();
      renderStudio();
      return;
    }
    if (!("wakeLock" in navigator)) {
      const btn = document.getElementById("studio-wake-lock-btn");
      if (btn) btn.title = "Tu navegador no soporta mantener pantalla encendida";
      return;
    }
    try {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
      state.wakeLockActive = true;
      wakeLockSentinel.addEventListener("release", () => {
        wakeLockSentinel = null;
        state.wakeLockActive = false;
        renderStudio();
      });
    } catch {
      state.wakeLockActive = false;
    }
    renderStudio();
  }

  function loadStorage(key, fallback, validator) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null && (!validator || validator(val))) return val;
      return fallback;
    } catch {
      return fallback;
    }
  }

  function loadJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isSafeUrl(url) {
    const trimmed = String(url || "").trim();
    if (!trimmed) return false;
    return /^(https?:\/\/|data:image\/|blob:)/i.test(trimmed);
  }

  function getVideoEmbedInfo(url) {
    const trimmed = String(url || "").trim();
    if (!isSafeUrl(trimmed)) return null;

    const ytMatch = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/
    );
    if (ytMatch) {
      const originParam =
        window.location && /^https?:/.test(window.location.origin)
          ? `&origin=${encodeURIComponent(window.location.origin)}`
          : "";
      return {
        type: "youtube",
        videoId: ytMatch[1],
        src: `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1&rel=0&playsinline=1${originParam}`,
        watchUrl: `https://www.youtube.com/watch?v=${ytMatch[1]}`
      };
    }

    const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return {
        type: "iframe",
        src: `https://player.vimeo.com/video/${vimeoMatch[1]}`
      };
    }

    return {
      type: "video",
      src: trimmed
    };
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignorar almacenamiento privado
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

  function isFavorite(id) {
    return state.favorites.includes(id);
  }

  function toggleFavorite(id) {
    if (isFavorite(id)) {
      state.favorites = state.favorites.filter((f) => f !== id);
    } else {
      state.favorites.push(id);
    }
    saveJsonStorage(FAVORITES_KEY, state.favorites);
    populateQuickSelect();
    syncHeaderState();
  }

  function hasUrlFilterParams() {
    const params = new URLSearchParams(window.location.search);
    return (
      MENU_LEVELS.some((l) => Boolean(params.get(l.key))) ||
      Boolean(params.get("q")) ||
      params.get("fav") === "1"
    );
  }

  function getActiveFilterContext() {
    const params = new URLSearchParams(window.location.search);
    if (hasUrlFilterParams()) {
      const selectedPath = {};
      MENU_LEVELS.forEach((l) => {
        const val = params.get(l.key);
        if (val) selectedPath[l.key] = val;
      });
      return {
        selectedPath,
        searchQuery: params.get("q") || "",
        onlyFavorites: params.get("fav") === "1"
      };
    }

    const stored = loadJsonStorage(ACTIVE_FILTER_KEY, null);
    if (stored && typeof stored === "object") {
      return {
        selectedPath: stored.selectedPath || {},
        searchQuery: stored.searchQuery || "",
        onlyFavorites: Boolean(stored.onlyFavorites)
      };
    }

    return {
      selectedPath: {},
      searchQuery: "",
      onlyFavorites: false
    };
  }

  function getComerBienActiveUser() {
    try {
      return window.CB_STORAGE ? window.CB_STORAGE.getActiveUser() : null;
    } catch {
      return null;
    }
  }

  function isRecipeCompatibleWithComerBienUser(radialRecipe, user) {
    if (!user) return true;
    const pattern = String(user.dietPattern || "equilibrada").toLowerCase();
    const restrictions = (user.restrictions || []).map((r) => String(r).toLowerCase());
    const has = (kw) => restrictions.some((r) => r.includes(kw));

    const idAndTitle = `${radialRecipe.id || ""} ${radialRecipe.title || ""}`.toLowerCase();
    const text = [
      radialRecipe.id || "",
      radialRecipe.title || "",
      radialRecipe.categoria || "",
      ...(radialRecipe.ingredients || []).map((i) => (typeof i === "string" ? i : i.item || ""))
    ]
      .join(" ")
      .toLowerCase();

    if (pattern === "sin_gluten" || has("gluten") || has("celiaqu")) {
      const explicitlyGF = /celiaco-|sin tacc|sin gluten/.test(idAndTitle);
      const hasGluten =
        /(harina de trigo|harina 000|harina común|harina integral|harina para pan|\bharina\b|trigo|sémola|burgol|salvado|avena|fideo|espagueti|fettuccini|tallar|penne|mostachol|macarr|rigatoni|caracol|moñito|codito|lasaña|panqueque|tapa.*copetín|galleta|pan |miñón|baguette|lactal)/.test(
          text
        ) && !/harina de (arroz|maíz|garbanzo|almendra)|premezcla sin tacc/.test(text);
      if (!explicitlyGF && hasGluten) return false;
    }
    if (pattern === "sin_lactosa" || has("lactosa") || has("lácteo")) {
      if (
        /(leche|queso|yogur|ricota|crema de leche|manteca|mozzarella|muzzarella|parmesano|sardo|provolone|colonia|dambo|gruyere|cheddar|roquefort|salsa blanca|bechamel)/.test(
          text
        ) &&
        !/sin lactosa|deslactosad|vegano|vegana|bebida vegetal/.test(text)
      ) {
        return false;
      }
    }
    if (has("huevo") && /huevo|clara|yema/.test(text)) return false;
    if ((has("pescado") || has("marisco")) && /(salmón|salmon|merluza|corvina|atún|pescado|brótola|camar|mejill|anchoa)/.test(text)) return false;
    if (has("frutos secos") && /(nuez|nueces|almendra|maní|avellana|castaña)/.test(text)) return false;
    if ((pattern === "bajo_sodio" || has("sodio") || has("hipertens")) && /(fiambre|jamón|panceta|salame|pepperoni|chorizo|anchoa|alcaparra|aceituna|soja)/.test(text)) return false;
    if (pattern === "sin_azucar" || has("azúcar") || has("azucar")) {
      if (/(\bazúcar\b|miel|dulce de leche|membrillo)/.test(text) && !/sin azúcar|diabetes-/.test(idAndTitle) && radialRecipe.categoria === "dulces") {
        return false;
      }
    }
    if (pattern === "vegana" || has("vegano")) {
      if (
        /(pollo|pechuga|suprema|muslo|carne|vaca|vacun|res|bife|cuadril|nalga|peceto|cerdo|chorizo|panceta|jamón|pepperoni|salame|pescado|salmón|salmon|merluza|corvina|atún|anchoa|camar|mejill|huevo|clara|yema|leche|queso|yogur|ricota|mozzarella|muzzarella|parmesano|sardo|provolone|colonia|dambo|gruyere|cheddar|roquefort|manteca|crema de leche|miel)/.test(
          text
        ) &&
        !/vegano-|vegana/.test(idAndTitle)
      ) {
        return false;
      }
    } else if (pattern === "vegetariana" || has("vegetariano")) {
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
  }

  function getFilteredRecipesForSelect() {
    const ctx = state.activeFilter || getActiveFilterContext();
    const path = ctx.selectedPath || {};
    const q = (ctx.searchQuery || "").trim().toLowerCase();
    const cbUser = getComerBienActiveUser();

    const filtered = state.recipes.filter((r) => {
      if (ctx.onlyFavorites && !isFavorite(r.id)) return false;
      if (cbUser && !isRecipeCompatibleWithComerBienUser(r, cbUser)) return false;
      if (path.momento && r.momento !== path.momento) return false;
      if (path.categoria && r.categoria !== path.categoria) return false;
      if (path.metodo && r.metodo !== path.metodo) return false;
      if (path.estilo && r.estilo !== path.estilo) return false;

      if (q) {
        const inTitle = r.title.toLowerCase().includes(q);
        const inDesc = (r.description || "").toLowerCase().includes(q);
        const inIng = r.ingredients.some((ing) => (ing.item || String(ing)).toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inIng) return false;
      }
      return true;
    });

    if (state.activeRecipe && !filtered.some((r) => r.id === state.activeRecipe.id)) {
      return [state.activeRecipe, ...filtered];
    }
    return filtered;
  }

  function populateQuickSelect() {
    if (!els.quickSelect) return;
    const filteredList = getFilteredRecipesForSelect();
    els.quickSelect.innerHTML = filteredList
      .map((r) => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.title)}</option>`)
      .join("");
    if (state.activeRecipe) {
      els.quickSelect.value = state.activeRecipe.id;
    }
  }

  function syncHeaderState() {
    const r = state.activeRecipe;
    if (!r) return;
    const fav = isFavorite(r.id);
    els.favBtn.classList.toggle("is-fav", fav);
    els.favBtn.setAttribute("aria-pressed", String(fav));
    els.favBtn.textContent = fav ? "♥ En favoritos" : "♡ Guardar";

    const ctx = state.activeFilter || getActiveFilterContext();
    const path = ctx.selectedPath || {};
    const filterLabels = MENU_LEVELS.map((l) => {
      const id = path[l.key];
      return id ? getMenuItemById(l.key, id)?.shortLabel : null;
    }).filter(Boolean);
    if (ctx.onlyFavorites) filterLabels.unshift("Favoritos");
    if ((ctx.searchQuery || "").trim()) filterLabels.push(`"${ctx.searchQuery.trim()}"`);

    const count = getFilteredRecipesForSelect().length;
    if (filterLabels.length > 0) {
      els.breadcrumbMeta.textContent = `${filterLabels.join(" · ")} (${count} ${count === 1 ? "receta" : "recetas"})`;
    } else {
      const metodo = getMenuItemById("metodo", r.metodo);
      const momento = getMenuItemById("momento", r.momento);
      els.breadcrumbMeta.textContent = `${[momento?.label, metodo?.label].filter(Boolean).join(" · ")} (${count} recetas)`;
    }
    document.title = `${r.title} — Cocina Radial`;
  }

  function formatAmount(baseAmount, multiplier) {
    if (baseAmount === null || baseAmount === undefined || baseAmount === "") return "";
    const val = baseAmount * multiplier;
    const rounded = Math.round(val * 100) / 100;
    if (Number.isInteger(rounded)) return String(rounded);
    return rounded.toFixed(1).replace(/\.0$/, "");
  }

  function getActiveMontevideoCoords() {
    if (state.userGpsCoords) return state.userGpsCoords;
    const barrio = MDEO_BARRIOS.find((b) => b.id === state.selectedBarrio) || MDEO_BARRIOS[0];
    return { lat: barrio.lat, lng: barrio.lng };
  }

  function requestMontevideoGps() {
    if (!navigator.geolocation) {
      state.gpsStatus = "Tu navegador no soporta GPS; usá el selector de barrio.";
      renderStudio();
      return;
    }
    state.gpsStatus = "Obteniendo ubicación...";
    renderStudio();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.userGpsCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.gpsStatus = "GPS activo en tu ubicación actual";
        renderStudio();
      },
      () => {
        state.gpsStatus = "No se pudo obtener el GPS; elegí tu barrio en Montevideo.";
        renderStudio();
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  function getRecipePhotos(recipe, baseMedia) {
    const customPhotos = (state.customMedia[recipe.id]?.photos || []).map((p, idx) => ({
      ...p,
      isCustom: true,
      customIdx: idx
    }));
    return [...customPhotos, ...baseMedia.photos];
  }

  function compressImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Archivo de imagen inválido."));
        img.onload = () => {
          const maxDim = 1080;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderLeftVisualPane(r, baseMedia, evalResult) {
    const photos = getRecipePhotos(r, baseMedia);
    state.activePhotoIndex = Math.min(state.activePhotoIndex, Math.max(0, photos.length - 1));
    const currentPhoto = photos[state.activePhotoIndex];

    const customVideoUrl = state.sessionVideoBlobUrl || state.customMedia[r.id]?.videoUrl || baseMedia.videoUrl;
    const videoEmbed = getVideoEmbedInfo(customVideoUrl);
    const chapters = baseMedia.videoChapters || [];
    state.videoChapterIndex = Math.min(state.videoChapterIndex, Math.max(0, chapters.length - 1));
    const activeChapter = chapters[state.videoChapterIndex];

    const metodo = getMenuItemById("metodo", r.metodo);
    const momento = getMenuItemById("momento", r.momento);
    const categoria = getMenuItemById("categoria", r.categoria);
    const estilo = getMenuItemById("estilo", r.estilo);
    const totalMin = (r.prepMinutes || 0) + (r.cookMinutes || 0);

    let stageHtml = "";

    if (state.mediaTab === "photos") {
      stageHtml = `
        <div class="media-stage">
          <img src="${escapeHtml(currentPhoto.url)}" alt="${escapeHtml(currentPhoto.caption)}" class="media-main-img" id="media-hero-img" />
          ${
            photos.length > 1
              ? `
            <button type="button" class="media-arrow is-prev" data-photo-nav="-1" aria-label="Foto anterior">‹</button>
            <button type="button" class="media-arrow is-next" data-photo-nav="1" aria-label="Foto siguiente">›</button>
          `
              : ""
          }
          <div class="media-caption-bar">
            <span>${escapeHtml(currentPhoto.caption)}</span>
            <span class="media-counter">${state.activePhotoIndex + 1} / ${photos.length}</span>
          </div>
        </div>
        <div class="media-thumbs">
          ${photos
            .map(
              (p, idx) => `
            <div class="thumb-wrap ${idx === state.activePhotoIndex ? "is-active" : ""}">
              <button type="button" class="media-thumb-btn" data-photo-idx="${idx}" aria-label="Ver foto ${idx + 1}">
                <img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption)}" />
              </button>
              ${
                p.isCustom
                  ? `<button type="button" class="thumb-remove-btn" data-remove-photo="${p.customIdx}" aria-label="Quitar foto personalizada" title="Quitar foto">✕</button>`
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } else if (state.mediaTab === "video") {
      const savedTimes = getSavedChapterTimes(r.id);
      const hasSavedTimes = Object.keys(savedTimes).length > 0;
      const isCustomVideo = Boolean(state.sessionVideoBlobUrl || state.customMedia[r.id]?.videoUrl);

      stageHtml = `
        <div class="video-stage">
          ${
            videoEmbed
              ? videoEmbed.type === "youtube"
                ? `<div class="video-frame-wrap">
                    <iframe id="yt-player-frame" src="${escapeHtml(videoEmbed.src)}" data-video-id="${escapeHtml(videoEmbed.videoId)}" title="Video de ${escapeHtml(r.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                  </div>
                  <div class="video-meta-bar">
                    <div class="video-meta-info">
                      <strong>${escapeHtml((!isCustomVideo && baseMedia.videoTitle) || `Video de ${r.title}`)}</strong>
                      ${!isCustomVideo && baseMedia.videoChannel ? `<span>Canal: ${escapeHtml(baseMedia.videoChannel)}</span>` : ""}
                    </div>
                    <a href="${escapeHtml(videoEmbed.watchUrl)}" target="_blank" rel="noopener noreferrer" class="btn-yt-external">Abrir en YouTube ↗</a>
                  </div>`
                : videoEmbed.type === "iframe"
                  ? `<div class="video-frame-wrap">
                      <iframe src="${escapeHtml(videoEmbed.src)}" title="Video de ${escapeHtml(r.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>`
                  : `<video class="video-native-player" src="${escapeHtml(videoEmbed.src)}" controls playsinline></video>`
              : `
                <div class="video-guide-player">
                  <div class="video-guide-badge">🎬 Guía interactiva por capítulos</div>
                  ${
                    activeChapter
                      ? `
                    <div class="video-guide-step">Paso ${activeChapter.index + 1} de ${chapters.length}</div>
                    <p class="video-guide-text">${escapeHtml(activeChapter.text)}</p>
                    <div class="video-guide-actions">
                      ${
                        activeChapter.timerMinutes
                          ? `<button type="button" class="btn-step-timer" data-minutes="${activeChapter.timerMinutes}" data-label="${escapeHtml(r.title)} · Paso ${activeChapter.index + 1}">
                              ⏱️ Timer (${activeChapter.timerMinutes} min)
                            </button>`
                          : ""
                      }
                      <button type="button" class="btn-tab-nav is-accent" data-media-switch="custom">
                        ➕ Cargar mi video real (YouTube / MP4)
                      </button>
                    </div>
                  `
                      : `<p>No hay pasos registrados aún.</p>`
                  }
                </div>
              `
          }
          ${
            videoEmbed && activeChapter
              ? `
                <div id="video-active-step-card" class="video-active-step-card">
                  <div class="video-active-step-head">
                    <span id="video-active-step-label" class="video-active-step-label">Paso ${activeChapter.index + 1} de ${chapters.length}</span>
                    ${
                      videoEmbed.type === "youtube"
                        ? `<div class="video-active-step-tools">
                            <button type="button" id="mark-chapter-time-btn" class="btn-mark-time" title="Guarda el segundo actual del video para este paso">
                              📍 Fijar momento aquí
                            </button>
                            ${hasSavedTimes ? `<button type="button" id="reset-chapter-times-btn" class="btn-reset-times" title="Restaurar tiempos automáticos">↺</button>` : ""}
                          </div>`
                        : ""
                    }
                  </div>
                  <p id="video-active-step-text" class="video-active-step-text">${escapeHtml(activeChapter.text)}</p>
                  <div id="video-active-step-actions" class="video-active-step-actions">
                    ${
                      activeChapter.timerMinutes
                        ? `<button type="button" class="btn-step-timer" data-minutes="${activeChapter.timerMinutes}" data-label="${escapeHtml(r.title)} · Paso ${activeChapter.index + 1}">
                            ⏱️ Timer (${activeChapter.timerMinutes} min)
                          </button>`
                        : ""
                    }
                  </div>
                </div>
              `
              : ""
          }
          ${
            chapters.length > 0
              ? `
            <div class="video-chapters-bar" id="video-chapters-bar">
              ${chapters
                .map((ch, idx) => {
                  const knownSec = getChapterStartSec(r, idx, chapters.length, ytDuration);
                  const timeStr = knownSec !== null ? formatSeconds(knownSec) : "";
                  return `
                    <button type="button" class="chapter-pill ${idx === state.videoChapterIndex ? "is-active" : ""}" data-chapter-idx="${idx}">
                      <span>${idx + 1}. ${escapeHtml(ch.title)}${ch.timerMinutes ? ` (${ch.timerMinutes}m)` : ""}</span>
                      <span class="chapter-time" data-chapter-time="${idx}">${timeStr ? `· ${timeStr}` : ""}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      `;
    } else {
      const savedVideoUrl = state.customMedia[r.id]?.videoUrl || "";
      stageHtml = `
        <div class="custom-media-panel">
          <div class="custom-media-block">
            <h4>📸 Agregar foto a esta receta</h4>
            <p class="custom-media-hint">Pegá el enlace de una imagen o subí una foto desde tu dispositivo (se guarda en este navegador).</p>
            <div class="custom-input-row">
              <input type="url" id="custom-photo-url" class="studio-input" placeholder="https://ejemplo.com/mi-plato.jpg" />
              <input type="text" id="custom-photo-caption" class="studio-input" placeholder="Descripción breve (opcional)" />
              <button type="button" id="add-photo-url-btn" class="btn-studio-primary">Agregar foto</button>
            </div>
            <label class="file-upload-btn">
              📁 Subir foto desde mi dispositivo
              <input type="file" id="custom-photo-file" accept="image/*" hidden />
            </label>
          </div>

          <div class="custom-media-block">
            <h4>🎬 Vincular video (YouTube, Vimeo o MP4)</h4>
            <p class="custom-media-hint">Pegá el link de un video de YouTube/Vimeo o probá un archivo MP4 local.</p>
            <div class="custom-input-row">
              <input type="url" id="custom-video-url" class="studio-input" value="${escapeHtml(savedVideoUrl)}" placeholder="https://www.youtube.com/watch?v=..." />
              <button type="button" id="save-video-url-btn" class="btn-studio-primary">Guardar video</button>
            </div>
            <div class="custom-video-tools">
              <label class="file-upload-btn">
                🎥 Probar video local (.mp4 / .webm)
                <input type="file" id="custom-video-file" accept="video/*" hidden />
              </label>
              <button type="button" id="reset-custom-media-btn" class="btn-studio-ghost">Restaurar visuales por defecto</button>
            </div>
          </div>

          ${state.mediaFeedback ? `<div class="media-feedback">${escapeHtml(state.mediaFeedback)}</div>` : ""}
        </div>
      `;
    }

    return `
      <section class="studio-card studio-visual-card" aria-label="Vista visual y resumen de la receta">
        <div class="visual-header">
          <div class="tech-sheet-badges">
            ${metodo ? `<span class="method-pill" style="--pill-color:${metodo.color}">${metodo.emoji || ""} ${escapeHtml(metodo.label)}</span>` : ""}
            ${isGlutenFreeRecipe(r) ? `<span class="tag tag-gf">🌾 Sin Gluten</span>` : ""}
            ${momento ? `<span class="tag">${momento.emoji || ""} ${escapeHtml(momento.shortLabel)}</span>` : ""}
            ${categoria ? `<span class="tag">${categoria.emoji || ""} ${escapeHtml(categoria.shortLabel)}</span>` : ""}
            ${estilo ? `<span class="tag">${estilo.emoji || ""} ${escapeHtml(estilo.shortLabel)}</span>` : ""}
          </div>

          <h1 class="studio-recipe-title">${escapeHtml(r.title)}</h1>
          <p class="studio-recipe-desc">${escapeHtml(r.description)}</p>

          <div class="visual-key-facts">
            <span class="fact-pill">⏱️ ${totalMin} min</span>
            ${r.temperatureC ? `<span class="fact-pill">🌡️ ${r.temperatureC} °C</span>` : ""}
            <span class="fact-pill">🔥 ${evalResult.perServing.kcal} kcal / porc.</span>
            <span class="fact-pill">📊 ${escapeHtml(r.difficulty || "Fácil")}</span>
            <button type="button" id="studio-wake-lock-btn" class="btn-wake-lock ${state.wakeLockActive ? "is-active" : ""}" aria-pressed="${state.wakeLockActive}">
              ${state.wakeLockActive ? "☀️ Pantalla activa" : "💡 Mantener pantalla"}
            </button>
          </div>
          ${
            window.CB_STORAGE && window.CB_STORAGE.getActiveUser()
              ? `<div class="cb-radial-log-bar" style="margin-top:12px;">
                  <span style="font-size:12px;font-weight:700;color:#22533a;">🌿 COMER BIEN:</span>
                  <button type="button" id="cb-studio-eat" class="cb-btn cb-btn-sm cb-btn-primary">✓ Ya lo comí hoy</button>
                  <button type="button" id="cb-studio-plan" class="cb-btn cb-btn-sm cb-btn-outline">📅 Pienso comer esto hoy</button>
                  <span id="cb-studio-fb" style="font-size:12px;font-weight:700;color:#065f46;"></span>
                </div>`
              : ""
          }
        </div>

        <div class="media-tabs-bar" role="tablist">
          <button type="button" role="tab" class="media-tab-btn ${state.mediaTab === "photos" ? "is-active" : ""}" data-media-tab="photos" aria-selected="${state.mediaTab === "photos"}">
            📸 Fotos (${photos.length})
          </button>
          <button type="button" role="tab" class="media-tab-btn ${state.mediaTab === "video" ? "is-active" : ""} ${customVideoUrl ? "has-video" : ""}" data-media-tab="video" aria-selected="${state.mediaTab === "video"}">
            ${customVideoUrl ? "🎬 Video YouTube ▶" : "🎬 Video paso a paso"}
          </button>
          <button type="button" role="tab" class="media-tab-btn ${state.mediaTab === "custom" ? "is-active" : ""}" data-media-tab="custom" aria-selected="${state.mediaTab === "custom"}">
            ➕ Mi foto / video
          </button>
        </div>
        ${stageHtml}
      </section>
    `;
  }

  function renderIngredientsTab(r, multiplier, adaptation, cbUser) {
    const activePlan = DIET_PLANS[state.dietPlan] || DIET_PLANS.balanced;
    const ingList = adaptation ? adaptation.ingredients : r.ingredients;

    return `
      <div class="recipe-tab-panel">
        <div class="section-head">
          <div>
            <h3>Ingredientes necesarios</h3>
            <p class="tab-helper">Marcá lo que ya tenés en casa para descontarlo automáticamente en Supermercados.</p>
          </div>
          <div class="servings-calc" aria-label="Calculadora de porciones">
            <button type="button" id="servings-minus" class="calc-btn" aria-label="Menos porciones">−</button>
            <span id="servings-value">${state.currentServings} ${state.currentServings === 1 ? "porción" : "porciones"}</span>
            <button type="button" id="servings-plus" class="calc-btn" aria-label="Más porciones">+</button>
          </div>
        </div>

        <div class="diet-adapt-toolbar" aria-label="Adaptación según tu dieta">
          <div class="diet-adapt-left">
            <label for="ing-diet-select" class="diet-select-label">🥗 Mi dieta:</label>
            <select id="ing-diet-select" class="market-select">
              ${Object.values(DIET_PLANS)
                .map(
                  (p) => `<option value="${p.key}" ${p.key === state.dietPlan ? "selected" : ""}>${escapeHtml(p.shortLabel)}</option>`
                )
                .join("")}
            </select>
            ${
              cbUser
                ? `<span class="cb-sync-pill" title="Sincronizado con tu sesión de COMER BIEN">🌿 Perfil @${escapeHtml(cbUser.username)}</span>`
                : ""
            }
          </div>

          <div class="diet-adapt-right">
            ${
              adaptation && adaptation.hasAvailableAdaptations
                ? `<label class="diet-adapt-toggle">
                    <input type="checkbox" id="ing-adapt-toggle" ${state.adaptIngredients ? "checked" : ""} />
                    <span>🔄 Adaptar ingredientes (${adaptation.changedCount})</span>
                  </label>`
                : state.dietPlan !== "balanced"
                  ? `<span class="diet-ok-pill">✓ 100% apta para ${escapeHtml(activePlan.label)}</span>`
                  : ""
            }
          </div>
        </div>

        <ul class="checklist checklist-grid">
          ${ingList
            .map((ing, idx) => {
              const qty = formatAmount(ing.amount, multiplier);
              const unit = ing.unit ? ` ${ing.unit}` : "";
              const checked = Boolean(state.checkedIngredients[idx]);
              return `
                <li>
                  <label class="check-item ${ing.isAdapted ? "is-adapted" : ""}">
                    <input type="checkbox" class="recipe-ing-checkbox" data-ing-idx="${idx}" id="ing-${idx}" ${checked ? "checked" : ""} />
                    <span>
                      <strong>${escapeHtml(qty)}${escapeHtml(unit)}</strong> ${escapeHtml(ing.item)}
                      ${
                        ing.isAdapted && ing.originalItem
                          ? `<small class="ing-adapt-meta"><span class="ing-adapt-badge">${escapeHtml(ing.adaptBadge || "Adaptado")}</span>Reemplaza: ${escapeHtml(ing.originalItem)}</small>`
                          : ""
                      }
                    </span>
                  </label>
                </li>
              `;
            })
            .join("")}
        </ul>

        <div class="tab-footer-actions">
          <button type="button" class="btn-tab-nav" data-goto-right-tab="steps">👩‍🍳 Ir a Preparación →</button>
          <button type="button" class="btn-tab-nav is-accent" data-goto-right-tab="market">🛒 Comparar en Supermercados →</button>
        </div>
      </div>
    `;
  }

  function renderStepsTab(r) {
    if (state.cookingStepIndex !== null && r.steps.length > 0) {
      return renderStepFocusView(r);
    }

    return `
      <div class="recipe-tab-panel">
        <div class="steps-head">
          <div>
            <h3>Preparación paso a paso</h3>
            <p class="tab-helper">Seguí los pasos en orden o iniciá el temporizador en cada etapa.</p>
          </div>
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
                <p>${escapeHtml(step.text)}</p>
                ${
                  step.timerMinutes
                    ? `<button type="button" class="btn-step-timer" data-minutes="${step.timerMinutes}" data-label="${escapeHtml(r.title)} · Paso ${idx + 1}">
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
  }

  function renderNutritionTab(baseMedia, evalResult, adaptation, cbUser) {
    const { plan, perServing, kcalPct, proteinPct, carbsPct, fatPct, status, message } = evalResult;
    const totalBatchKcal = perServing.kcal * state.currentServings;
    const clampPct = (pct) => Math.min(100, Math.max(4, pct));

    return `
      <div class="recipe-tab-panel">
        <div class="nutrition-head">
          <div>
            <h3>Control de Calorías y Dietas</h3>
            <p class="nutrition-sub">
              Calculado según ingredientes reales · ${state.currentServings} ${state.currentServings === 1 ? "porción" : "porciones"} suman <strong>${totalBatchKcal} kcal</strong> totales.
              ${cbUser ? `<span class="cb-sync-pill" style="margin-left:6px;">🌿 @${escapeHtml(cbUser.username)}</span>` : ""}
            </p>
          </div>
          <div class="diet-select-wrap">
            <label for="diet-plan-select" class="diet-select-label">Mi dieta / objetivo:</label>
            <select id="diet-plan-select" class="market-select">
              ${Object.values(DIET_PLANS)
                .map(
                  (p) => `<option value="${p.key}" ${p.key === state.dietPlan ? "selected" : ""}>${escapeHtml(p.shortLabel)}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>

        ${
          adaptation && adaptation.hasAvailableAdaptations
            ? `<div class="diet-adapt-toolbar" style="margin-bottom:12px;">
                <span style="font-size:0.8rem;font-weight:600;">
                  ${
                    state.adaptIngredients
                      ? `✅ Macros calculados con <strong>${adaptation.changedCount}</strong> ${adaptation.changedCount === 1 ? "ingrediente sustituido" : "ingredientes sustituidos"} para ${escapeHtml(plan.label)}.`
                      : `💡 Hay <strong>${adaptation.changedCount}</strong> sustituciones disponibles para ${escapeHtml(plan.label)}.`
                  }
                </span>
                <label class="diet-adapt-toggle">
                  <input type="checkbox" id="nutri-adapt-toggle" ${state.adaptIngredients ? "checked" : ""} />
                  <span>🔄 Adaptar ingredientes</span>
                </label>
              </div>`
            : ""
        }

        <div class="macros-grid">
          <div class="macro-box is-kcal">
            <div class="macro-top">
              <span>🔥 Calorías</span>
              <small>${kcalPct}% día</small>
            </div>
            <strong>${perServing.kcal} <small>kcal</small></strong>
            <div class="macro-bar"><span style="width:${clampPct(kcalPct)}%"></span></div>
          </div>

          <div class="macro-box is-protein">
            <div class="macro-top">
              <span>💪 Proteínas</span>
              <small>${proteinPct}% día</small>
            </div>
            <strong>${perServing.protein} <small>g</small></strong>
            <div class="macro-bar"><span style="width:${clampPct(proteinPct)}%"></span></div>
          </div>

          <div class="macro-box is-carbs">
            <div class="macro-top">
              <span>🌾 Carbohidratos</span>
              <small>${carbsPct}% día</small>
            </div>
            <strong>${perServing.carbs} <small>g</small></strong>
            <div class="macro-sub">${perServing.fiber} g fibra · meta ${plan.carbsG} g</div>
            <div class="macro-bar"><span style="width:${clampPct(carbsPct)}%"></span></div>
          </div>

          <div class="macro-box is-fat">
            <div class="macro-top">
              <span>🥑 Grasas</span>
              <small>${fatPct}% día</small>
            </div>
            <strong>${perServing.fat} <small>g</small></strong>
            <div class="macro-bar"><span style="width:${clampPct(fatPct)}%"></span></div>
          </div>
        </div>

        <div class="diet-badges-row">
          ${(baseMedia.nutrition.dietTags || [])
            .map((tag) => `<span class="diet-tag-pill">✓ ${escapeHtml(tag)}</span>`)
            .join("")}
        </div>

        <div class="diet-compatibility-banner is-${status}">
          <span class="diet-compat-badge">${status === "optimal" ? "Óptima" : status === "good" ? "Compatible" : "A moderar"}</span>
          <span>${escapeHtml(message)}</span>
        </div>

        <div class="light-toggle-row">
          <label class="light-switch-label">
            <input type="checkbox" id="light-mode-toggle" ${state.lightMode ? "checked" : ""} />
            <span><strong>🌱 Aplicar ajuste liviano (-18% kcal)</strong></span>
          </label>
          <p class="light-tip-text">💡 ${escapeHtml(baseMedia.nutrition.lightTip)}</p>
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
          <p class="step-focus-text">${escapeHtml(step.text)}</p>
          ${
            step.timerMinutes
              ? `<button type="button" class="btn-step-timer btn-step-timer-lg" data-minutes="${step.timerMinutes}" data-label="${escapeHtml(r.title)} · Paso ${idx + 1}">
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

  function renderSupermarketWorkspace(r, multiplier) {
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
        <div class="market-controls">
          <div class="market-location-bar">
            <label for="market-barrio-select" class="market-label">📍 Barrio:</label>
            <select id="market-barrio-select" class="market-select">
              ${MDEO_BARRIOS.map(
                (b) => `<option value="${b.id}" ${!state.userGpsCoords && state.selectedBarrio === b.id ? "selected" : ""}>${escapeHtml(b.label)}</option>`
              ).join("")}
            </select>
            <button type="button" id="market-gps-btn" class="btn-gps ${state.userGpsCoords ? "is-active" : ""}">
              ${state.userGpsCoords ? "📡 GPS activo" : "📍 GPS"}
            </button>
            ${state.gpsStatus ? `<span class="gps-status">${escapeHtml(state.gpsStatus)}</span>` : ""}
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
                        <h4 class="chain-name">${escapeHtml(c.chainName)}</h4>
                        ${badgeText ? `<span class="chain-badge">${badgeText}</span>` : ""}
                      </div>
                      <div class="chain-branch-compact">
                        <span>${escapeHtml(c.closestBranch.name)} · ${c.closestBranch.distanceKm} km (~${c.closestBranch.blocks} cuadras)</span>
                        <a href="${escapeHtml(c.closestBranch.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="chain-map-link" data-stop-card="true">Mapa ↗</a>
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
                <h4>En <span style="color:${activeChain.color}">${escapeHtml(activeChain.chainName)}</span></h4>
                <p class="market-note">Productos reales de <strong>precios.db</strong> · Envases cerrados: <strong>$ ${activeChain.totalPacksUYU || activeChain.totalUYU} UYU</strong></p>
              </div>
              <div style="text-align:right;">
                <strong class="breakdown-total">$ ${activeChain.totalUYU} UYU</strong>
                <small style="display:block;font-size:0.7rem;color:var(--text-muted);">costo receta</small>
              </div>
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
                  else if (tags.includes("vegano")) dietBadge = "🌱 Vegano";
                  else if (tags.includes("integral")) dietBadge = "🌾 Integral";

                  return `
                    <li class="market-item-row ${item.checked ? "is-owned" : ""}">
                      <label class="market-item-check">
                        <input type="checkbox" class="market-own-checkbox" data-ing-idx="${item.index}" ${item.checked ? "checked" : ""} />
                        <span>
                          <strong>${escapeHtml(qty)}${escapeHtml(unit)}</strong> ${escapeHtml(item.item)}
                          ${
                            item.matchedProductName
                              ? `<small class="ing-adapt-meta">
                                  ${dietBadge ? `<span class="ing-adapt-badge">${escapeHtml(dietBadge)}</span>` : ""}
                                  📦 ${escapeHtml(item.matchedProductName)} · <strong>Envase: $ ${item.packPriceUYU || item.estimatedFullPriceUYU}</strong>
                                </small>`
                              : ""
                          }
                        </span>
                      </label>
                      <div class="market-item-actions">
                        <span class="market-item-price" title="Costo proporcional para la receta">
                          ${item.checked ? "<s>$ " + item.estimatedFullPriceUYU + "</s> $ 0" : "$ " + item.priceUYU}
                        </span>
                        <a href="${escapeHtml(item.gondolaUrl)}" target="_blank" rel="noopener noreferrer" class="btn-gondola">
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

  function renderRightTabbedPane(r, baseMedia, evalResult, multiplier, adaptation, cbUser) {
    const activeTab = state.rightTab || "ingredients";
    const marketRecipe =
      adaptation && state.adaptIngredients ? { ...r, ingredients: adaptation.ingredients } : r;
    let tabContentHtml = "";

    if (activeTab === "steps") {
      tabContentHtml = renderStepsTab(r);
    } else if (activeTab === "nutrition") {
      tabContentHtml = renderNutritionTab(baseMedia, evalResult, adaptation, cbUser);
    } else if (activeTab === "market") {
      tabContentHtml = renderSupermarketWorkspace(marketRecipe, multiplier);
    } else {
      tabContentHtml = renderIngredientsTab(r, multiplier, adaptation, cbUser);
    }

    return `
      <section class="studio-card studio-tabbed-card" aria-label="Detalle interactivo de la receta">
        <div class="studio-main-tabs" role="tablist" aria-label="Secciones de la receta">
          <button type="button" role="tab" class="studio-main-tab-btn ${activeTab === "ingredients" ? "is-active" : ""}" data-right-tab="ingredients" aria-selected="${activeTab === "ingredients"}">
            🧺 Ingredientes (${r.ingredients.length})
          </button>
          <button type="button" role="tab" class="studio-main-tab-btn ${activeTab === "steps" ? "is-active" : ""}" data-right-tab="steps" aria-selected="${activeTab === "steps"}">
            👩‍🍳 Preparación (${r.steps.length})
          </button>
          <button type="button" role="tab" class="studio-main-tab-btn ${activeTab === "nutrition" ? "is-active" : ""}" data-right-tab="nutrition" aria-selected="${activeTab === "nutrition"}">
            ⚖️ Calorías y Dieta
          </button>
          <button type="button" role="tab" class="studio-main-tab-btn ${activeTab === "market" ? "is-active" : ""}" data-right-tab="market" aria-selected="${activeTab === "market"}">
            🛒 Supermercados
          </button>
        </div>

        <div class="studio-tab-content">
          ${tabContentHtml}
        </div>
      </section>
    `;
  }

  function renderStudio() {
    const r = state.activeRecipe;
    if (!r) return;

    destroyYtPlayer();
    syncHeaderState();
    const cbUser = getComerBienActiveUser();
    const adaptation =
      typeof adaptRecipeIngredientsForDiet === "function"
        ? adaptRecipeIngredientsForDiet(r, state.dietPlan, cbUser, state.adaptIngredients)
        : null;
    const baseMedia = getRecipeNutritionAndMedia(
      r,
      adaptation && state.adaptIngredients ? adaptation.ingredients : null
    );
    const evalResult = evaluateDietCompatibility(baseMedia.nutrition, state.dietPlan, state.lightMode, {
      changedCount: adaptation ? adaptation.changedCount : 0,
      isAdaptedActive: Boolean(state.adaptIngredients)
    });
    const multiplier = state.currentServings / (r.servings || 1);

    els.studio.innerHTML = `
      <div class="recipe-studio-grid">
        ${renderLeftVisualPane(r, baseMedia, evalResult)}
        ${renderRightTabbedPane(r, baseMedia, evalResult, multiplier, adaptation, cbUser)}
      </div>
    `;

    bindStudioEvents(r, baseMedia);
  }

  function bindStudioEvents(r, baseMedia) {
    // Media tabs
    const backBtn = document.querySelector(".btn-back-menu");
    if (backBtn && localStorage.getItem("comer_bien_picking_for_inicio") === "1") {
      backBtn.textContent = "← Volver a Inicio";
    }

    const saveStudioToComerBien = (status) => {
      if (!window.CB_STORAGE || !window.CB_DATA || !window.CB_ENGINE) return;
      const user = window.CB_STORAGE.getActiveUser();
      if (!user) return;
      const userData = window.CB_STORAGE.getUserData(user.username);
      const validMoment = window.CB_DATA.MOMENTS_ORDER.includes(r.momento) ? r.momento : "almuerzo";
      const catMap = {
        pollo: ["proteinas_animales"],
        carnes: ["proteinas_animales"],
        pescados: ["proteinas_animales"],
        verduras: ["verduras"],
        pastas: ["cereales_tuberculos"],
        dulces: ["cereales_tuberculos"],
      };
      const fg = catMap[r.categoria] || ["cereales_tuberculos", "verduras"];
      const today = window.CB_STORAGE.getTodayIso();
      const todayIdx = window.CB_ENGINE.getTodayDayIndex();

      userData.dailyLogs = userData.dailyLogs.filter(
        (l) => !(l.logDate === today && l.moment === validMoment)
      );
      userData.dailyLogs.unshift({
        id: "log-" + Date.now(),
        logDate: today,
        moment: validMoment,
        recipeId: r.id,
        title: r.title,
        status,
        foodGroups: fg,
      });

      if (userData.menuSlots.some((s) => s.dayIndex === todayIdx && s.moment === validMoment)) {
        userData.menuSlots = userData.menuSlots.map((s) =>
          s.dayIndex === todayIdx && s.moment === validMoment
            ? { ...s, recipeId: r.id, customTitle: null, status }
            : s
        );
      }

      window.CB_STORAGE.saveUserData(user.username, userData);

      if (localStorage.getItem("comer_bien_picking_for_inicio") === "1") {
        localStorage.removeItem("comer_bien_picking_for_inicio");
        localStorage.setItem("comer_bien_return_to_inicio", "1");
        window.location.href = "./index.html";
        return;
      }

      const fb = document.getElementById("cb-studio-fb");
      if (fb) {
        fb.textContent =
          status === "eaten" ? "✓ Actualizado como comido hoy" : "✓ Actualizado para hoy";
      }
    };

    document.getElementById("cb-studio-eat")?.addEventListener("click", () => saveStudioToComerBien("eaten"));
    document.getElementById("cb-studio-plan")?.addEventListener("click", () => saveStudioToComerBien("planned"));
    document.getElementById("studio-wake-lock-btn")?.addEventListener("click", toggleWakeLock);

    els.studio.querySelectorAll("[data-media-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mediaTab = btn.dataset.mediaTab;
        state.mediaFeedback = "";
        renderStudio();
      });
    });

    els.studio.querySelectorAll("[data-media-switch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mediaTab = btn.dataset.mediaSwitch;
        state.mediaFeedback = "";
        renderStudio();
      });
    });

    // Fotos navegación
    const photos = getRecipePhotos(r, baseMedia);
    els.studio.querySelectorAll("[data-photo-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = Number(btn.dataset.photoNav);
        state.activePhotoIndex = (state.activePhotoIndex + dir + photos.length) % photos.length;
        renderStudio();
      });
    });

    els.studio.querySelectorAll("[data-photo-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activePhotoIndex = Number(btn.dataset.photoIdx);
        renderStudio();
      });
    });

    els.studio.querySelectorAll("[data-remove-photo]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const removeIdx = Number(btn.dataset.removePhoto);
        const current = state.customMedia[r.id] || {};
        const nextPhotos = (current.photos || []).filter((_, i) => i !== removeIdx);
        state.customMedia[r.id] = { ...current, photos: nextPhotos };
        saveJsonStorage(CUSTOM_MEDIA_KEY, state.customMedia);
        state.activePhotoIndex = 0;
        renderStudio();
      });
    });

    // Capítulos de video y YouTube IFrame API (Opción A + Opción B)
    const chapters = baseMedia.videoChapters || [];
    const customVideoUrl = state.sessionVideoBlobUrl || state.customMedia[r.id]?.videoUrl || baseMedia.videoUrl;
    const videoEmbed = getVideoEmbedInfo(customVideoUrl);
    const ytFrameEl = document.getElementById("yt-player-frame");

    const bindActiveStepTimer = () => {
      const container = document.getElementById("video-active-step-actions");
      if (!container) return;
      container.querySelectorAll(".btn-step-timer").forEach((btn) => {
        btn.addEventListener("click", () => {
          timer.start(Number(btn.dataset.minutes), btn.dataset.label);
        });
      });
    };

    const refreshChapterTimesUI = () => {
      els.studio.querySelectorAll("[data-chapter-time]").forEach((span) => {
        const idx = Number(span.dataset.chapterTime);
        const sec = getChapterStartSec(r, idx, chapters.length, ytDuration);
        span.textContent = sec !== null ? `· ${formatSeconds(sec)}` : "";
      });
    };

    const updateActiveVideoChapterUI = () => {
      const ch = chapters[state.videoChapterIndex];
      if (!ch) return;
      els.studio.querySelectorAll("[data-chapter-idx]").forEach((btn) => {
        btn.classList.toggle("is-active", Number(btn.dataset.chapterIdx) === state.videoChapterIndex);
      });
      const labelEl = document.getElementById("video-active-step-label");
      const textEl = document.getElementById("video-active-step-text");
      const actionsEl = document.getElementById("video-active-step-actions");
      if (labelEl) labelEl.textContent = `Paso ${ch.index + 1} de ${chapters.length}`;
      if (textEl) textEl.textContent = ch.text;
      if (actionsEl) {
        actionsEl.innerHTML = ch.timerMinutes
          ? `<button type="button" class="btn-step-timer" data-minutes="${ch.timerMinutes}" data-label="${escapeHtml(r.title)} · Paso ${ch.index + 1}">
              ⏱️ Timer (${ch.timerMinutes} min)
            </button>`
          : "";
        bindActiveStepTimer();
      }
    };

    const syncChapterFromPlaybackTime = (currentSec) => {
      if (!chapters.length) return;
      let matchedIdx = 0;
      for (let i = 0; i < chapters.length; i++) {
        const start = getChapterStartSec(r, i, chapters.length, ytDuration);
        if (start !== null && currentSec >= start) {
          matchedIdx = i;
        }
      }
      if (matchedIdx !== state.videoChapterIndex) {
        state.videoChapterIndex = matchedIdx;
        updateActiveVideoChapterUI();
      }
    };

    if (state.mediaTab === "video" && videoEmbed?.type === "youtube" && ytFrameEl) {
      bindActiveStepTimer();
      loadYouTubeIframeApi()
        .then((YT) => {
          if (!document.getElementById("yt-player-frame")) return;
          ytPlayer = new YT.Player("yt-player-frame", {
            events: {
              onReady: (ev) => {
                try {
                  const dur = ev.target.getDuration();
                  if (dur && dur > 0) {
                    ytDuration = dur;
                    refreshChapterTimesUI();
                  }
                } catch {}
              },
              onStateChange: (ev) => {
                try {
                  const dur = ev.target.getDuration();
                  if (dur && dur > 0 && dur !== ytDuration) {
                    ytDuration = dur;
                    refreshChapterTimesUI();
                  }
                } catch {}
                if (ev.data === YT.PlayerState.PLAYING) {
                  if (ytPollInterval) clearInterval(ytPollInterval);
                  ytPollInterval = setInterval(() => {
                    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") return;
                    try {
                      syncChapterFromPlaybackTime(ytPlayer.getCurrentTime());
                    } catch {}
                  }, 1000);
                } else if (ytPollInterval) {
                  clearInterval(ytPollInterval);
                  ytPollInterval = null;
                }
              }
            }
          });
        })
        .catch(() => {
          // Fallback: el iframe nativo sigue funcionando sin API
        });
    }

    document.getElementById("mark-chapter-time-btn")?.addEventListener("click", () => {
      if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") return;
      const sec = Math.max(0, Math.floor(ytPlayer.getCurrentTime()));
      const current = state.customMedia[r.id] || {};
      const nextTimes = { ...(current.chapterTimes || {}), [state.videoChapterIndex]: sec };
      state.customMedia[r.id] = { ...current, chapterTimes: nextTimes };
      saveJsonStorage(CUSTOM_MEDIA_KEY, state.customMedia);
      refreshChapterTimesUI();
      const markBtn = document.getElementById("mark-chapter-time-btn");
      if (markBtn) {
        markBtn.textContent = `✓ Guardado (${formatSeconds(sec)})`;
        setTimeout(() => {
          const btnNow = document.getElementById("mark-chapter-time-btn");
          if (btnNow) btnNow.textContent = "📍 Fijar momento aquí";
        }, 1600);
      }
      if (!document.getElementById("reset-chapter-times-btn")) {
        const tools = document.querySelector(".video-active-step-tools");
        if (tools) {
          const resetBtn = document.createElement("button");
          resetBtn.type = "button";
          resetBtn.id = "reset-chapter-times-btn";
          resetBtn.className = "btn-reset-times";
          resetBtn.title = "Restaurar tiempos automáticos";
          resetBtn.textContent = "↺";
          resetBtn.addEventListener("click", () => {
            const cur = state.customMedia[r.id] || {};
            delete cur.chapterTimes;
            state.customMedia[r.id] = cur;
            saveJsonStorage(CUSTOM_MEDIA_KEY, state.customMedia);
            refreshChapterTimesUI();
            resetBtn.remove();
          });
          tools.appendChild(resetBtn);
        }
      }
    });

    document.getElementById("reset-chapter-times-btn")?.addEventListener("click", () => {
      const current = state.customMedia[r.id] || {};
      delete current.chapterTimes;
      state.customMedia[r.id] = current;
      saveJsonStorage(CUSTOM_MEDIA_KEY, state.customMedia);
      refreshChapterTimesUI();
      document.getElementById("reset-chapter-times-btn")?.remove();
    });

    els.studio.querySelectorAll("[data-chapter-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextIdx = Number(btn.dataset.chapterIdx);
        state.videoChapterIndex = nextIdx;
        if (videoEmbed?.type === "youtube" && ytFrameEl) {
          updateActiveVideoChapterUI();
          let dur = ytDuration;
          if (!dur && ytPlayer && typeof ytPlayer.getDuration === "function") {
            try { dur = ytPlayer.getDuration() || 0; } catch {}
            if (dur > 0) {
              ytDuration = dur;
              refreshChapterTimesUI();
            }
          }
          const targetSec = getChapterStartSec(r, nextIdx, chapters.length, dur || 0);
          if (ytPlayer && typeof ytPlayer.seekTo === "function") {
            try {
              ytPlayer.seekTo(targetSec !== null ? targetSec : 0, true);
              if (typeof ytPlayer.playVideo === "function") ytPlayer.playVideo();
            } catch {}
          } else if (targetSec !== null) {
            const sep = videoEmbed.src.includes("?") ? "&" : "?";
            ytFrameEl.src = `${videoEmbed.src}${sep}start=${targetSec}&autoplay=1`;
          }
        } else {
          renderStudio();
        }
      });
    });

    // Carga personalizada de foto/video
    const addPhotoUrlBtn = document.getElementById("add-photo-url-btn");
    if (addPhotoUrlBtn) {
      addPhotoUrlBtn.addEventListener("click", () => {
        const urlInput = document.getElementById("custom-photo-url");
        const captionInput = document.getElementById("custom-photo-caption");
        const url = (urlInput?.value || "").trim();
        if (!isSafeUrl(url)) {
          state.mediaFeedback = "Ingresá una URL válida comenzando con https:// o http://";
          renderStudio();
          return;
        }
        const current = state.customMedia[r.id] || {};
        const nextPhotos = [
          { url, caption: (captionInput?.value || "").trim() || `Foto personalizada · ${r.title}` },
          ...(current.photos || [])
        ];
        state.customMedia[r.id] = { ...current, photos: nextPhotos };
        saveJsonStorage(CUSTOM_MEDIA_KEY, state.customMedia);
        state.activePhotoIndex = 0;
        state.mediaTab = "photos";
        state.mediaFeedback = "";
        renderStudio();
      });
    }

    const photoFileInput = document.getElementById("custom-photo-file");
    if (photoFileInput) {
      photoFileInput.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const dataUrl = await compressImageFile(file);
          const current = state.customMedia[r.id] || {};
          const nextPhotos = [
            { url: dataUrl, caption: file.name.replace(/\.[^/.]+$/, "") },
            ...(current.photos || [])
          ];
          state.customMedia[r.id] = { ...current, photos: nextPhotos };
          const saved = saveJsonStorage(CUSTOM_MEDIA_KEY, state.customMedia);
          state.activePhotoIndex = 0;
          state.mediaTab = "photos";
          state.mediaFeedback = saved ? "" : "Imagen cargada en sesión (espacio de almacenamiento lleno).";
          renderStudio();
        } catch (err) {
          state.mediaFeedback = err.message || "No se pudo procesar la foto.";
          renderStudio();
        }
      });
    }

    const saveVideoUrlBtn = document.getElementById("save-video-url-btn");
    if (saveVideoUrlBtn) {
      saveVideoUrlBtn.addEventListener("click", () => {
        const vInput = document.getElementById("custom-video-url");
        const url = (vInput?.value || "").trim();
        if (url && !isSafeUrl(url)) {
          state.mediaFeedback = "El enlace del video debe empezar con https:// o http://";
          renderStudio();
          return;
        }
        state.sessionVideoBlobUrl = "";
        const current = state.customMedia[r.id] || {};
        state.customMedia[r.id] = { ...current, videoUrl: url };
        saveJsonStorage(CUSTOM_MEDIA_KEY, state.customMedia);
        state.mediaTab = "video";
        state.mediaFeedback = "";
        renderStudio();
      });
    }

    const videoFileInput = document.getElementById("custom-video-file");
    if (videoFileInput) {
      videoFileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (state.sessionVideoBlobUrl) {
          URL.revokeObjectURL(state.sessionVideoBlobUrl);
        }
        state.sessionVideoBlobUrl = URL.createObjectURL(file);
        state.mediaTab = "video";
        state.mediaFeedback = "";
        renderStudio();
      });
    }

    const resetMediaBtn = document.getElementById("reset-custom-media-btn");
    if (resetMediaBtn) {
      resetMediaBtn.addEventListener("click", () => {
        if (state.sessionVideoBlobUrl) {
          URL.revokeObjectURL(state.sessionVideoBlobUrl);
          state.sessionVideoBlobUrl = "";
        }
        delete state.customMedia[r.id];
        saveJsonStorage(CUSTOM_MEDIA_KEY, state.customMedia);
        state.activePhotoIndex = 0;
        state.mediaTab = "photos";
        state.mediaFeedback = "";
        renderStudio();
      });
    }

    // Nutrición y dietas (sincronizado entre Ingredientes y Calorías)
    const handleDietPlanChange = (nextPlan) => {
      state.dietPlan = nextPlan;
      if (nextPlan !== "balanced") {
        state.adaptIngredients = true;
      }
      try {
        localStorage.setItem(DIET_PLAN_KEY, state.dietPlan);
      } catch {
        // Ignorar almacenamiento privado
      }
      renderStudio();
    };

    const dietSelect = document.getElementById("diet-plan-select");
    if (dietSelect) {
      dietSelect.addEventListener("change", (e) => handleDietPlanChange(e.target.value));
    }

    const ingDietSelect = document.getElementById("ing-diet-select");
    if (ingDietSelect) {
      ingDietSelect.addEventListener("change", (e) => handleDietPlanChange(e.target.value));
    }

    const ingAdaptToggle = document.getElementById("ing-adapt-toggle");
    if (ingAdaptToggle) {
      ingAdaptToggle.addEventListener("change", (e) => {
        state.adaptIngredients = e.target.checked;
        renderStudio();
      });
    }

    const nutriAdaptToggle = document.getElementById("nutri-adapt-toggle");
    if (nutriAdaptToggle) {
      nutriAdaptToggle.addEventListener("change", (e) => {
        state.adaptIngredients = e.target.checked;
        renderStudio();
      });
    }

    const lightToggle = document.getElementById("light-mode-toggle");
    if (lightToggle) {
      lightToggle.addEventListener("change", (e) => {
        state.lightMode = e.target.checked;
        renderStudio();
      });
    }

    // Panel derecho: 4 pestañas principales (1 sola visible a la vez) y porciones
    const switchRightTab = (nextTab) => {
      state.rightTab = nextTab;
      if (nextTab !== "steps") state.cookingStepIndex = null;
      renderStudio();
    };

    els.studio.querySelectorAll("[data-right-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchRightTab(btn.dataset.rightTab));
    });

    els.studio.querySelectorAll("[data-goto-right-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchRightTab(btn.dataset.gotoRightTab));
    });

    const minusBtn = document.getElementById("servings-minus");
    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        if (state.currentServings > 1) {
          state.currentServings -= 1;
          renderStudio();
        }
      });
    }

    const plusBtn = document.getElementById("servings-plus");
    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        if (state.currentServings < 24) {
          state.currentServings += 1;
          renderStudio();
        }
      });
    }

    // Ingredientes checklist & pasos
    els.studio.querySelectorAll(".recipe-ing-checkbox").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        state.checkedIngredients[e.target.dataset.ingIdx] = e.target.checked;
      });
    });

    const enterStepBtn = document.getElementById("enter-step-mode-btn");
    if (enterStepBtn) {
      enterStepBtn.addEventListener("click", () => {
        state.cookingStepIndex = 0;
        renderStudio();
      });
    }

    const exitStepBtn = document.getElementById("exit-step-mode-btn");
    if (exitStepBtn) {
      exitStepBtn.addEventListener("click", () => {
        state.cookingStepIndex = null;
        renderStudio();
      });
    }

    const prevStepBtn = document.getElementById("step-prev-btn");
    if (prevStepBtn) {
      prevStepBtn.addEventListener("click", () => {
        if (state.cookingStepIndex > 0) {
          state.cookingStepIndex -= 1;
          renderStudio();
        }
      });
    }

    const nextStepBtn = document.getElementById("step-next-btn");
    if (nextStepBtn) {
      nextStepBtn.addEventListener("click", () => {
        if (state.cookingStepIndex < r.steps.length - 1) {
          state.cookingStepIndex += 1;
        } else {
          state.cookingStepIndex = null;
        }
        renderStudio();
      });
    }

    // Timers
    els.studio.querySelectorAll(".btn-step-timer").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mins = Number(btn.dataset.minutes);
        timer.start(mins, btn.dataset.label);
      });
    });

    // Supermercados Mdeo
    const barrioSel = document.getElementById("market-barrio-select");
    if (barrioSel) {
      barrioSel.addEventListener("change", (e) => {
        state.selectedBarrio = e.target.value;
        state.userGpsCoords = null;
        state.gpsStatus = "";
        renderStudio();
      });
    }

    const gpsBtn = document.getElementById("market-gps-btn");
    if (gpsBtn) {
      gpsBtn.addEventListener("click", requestMontevideoGps);
    }

    els.studio.querySelectorAll("[data-market-sort]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.marketSortBy = btn.dataset.marketSort;
        renderStudio();
      });
    });

    els.studio.querySelectorAll(".market-chain-card").forEach((card) => {
      const selectChain = (e) => {
        if (e.target.closest("[data-stop-card]")) return;
        state.selectedChainId = card.dataset.chainId;
        renderStudio();
      };
      card.addEventListener("click", selectChain);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectChain(e);
        }
      });
    });

    els.studio.querySelectorAll(".market-own-checkbox").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        state.checkedIngredients[e.target.dataset.ingIdx] = e.target.checked;
        renderStudio();
      });
    });
  }

  function selectRecipeById(id, pushUrl = true, preferredMediaTab = null) {
    const found = state.recipes.find((r) => r.id === id) || state.recipes[0];
    if (!found) return;

    destroyYtPlayer();

    if (state.sessionVideoBlobUrl) {
      URL.revokeObjectURL(state.sessionVideoBlobUrl);
      state.sessionVideoBlobUrl = "";
    }

    state.activeRecipe = found;
    state.currentServings = found.servings || 2;
    state.activePhotoIndex = 0;
    state.videoChapterIndex = 0;
    if (preferredMediaTab) {
      state.mediaTab = preferredMediaTab;
    } else if (state.mediaTab === "video" && !found.videoUrl && !state.customMedia[found.id]?.videoUrl) {
      state.mediaTab = "photos";
    }
    state.cookingStepIndex = null;
    state.selectedChainId = null;
    state.checkedIngredients = {};
    state.lightMode = false;
    state.mediaFeedback = "";

    populateQuickSelect();

    if (pushUrl && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set("id", found.id);
      window.history.replaceState({}, "", url.toString());
    }

    renderStudio();
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

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && state.wakeLockActive) {
        releaseWakeLock();
      }
    });

    els.favBtn.addEventListener("click", () => {
      if (state.activeRecipe) toggleFavorite(state.activeRecipe.id);
    });

    els.quickSelect.addEventListener("change", (e) => {
      if (e.target.value) selectRecipeById(e.target.value, true);
    });

    window.addEventListener("storage", (e) => {
      if (e.key === FAVORITES_KEY) {
        state.favorites = loadJsonStorage(FAVORITES_KEY, []);
        populateQuickSelect();
        syncHeaderState();
      } else if (e.key === ACTIVE_FILTER_KEY && !hasUrlFilterParams()) {
        state.activeFilter = getActiveFilterContext();
        populateQuickSelect();
        syncHeaderState();
      } else if (e.key === THEME_KEY && e.newValue) {
        applyTheme(e.newValue);
      }
    });
  }

  async function init() {
    applyTheme(state.theme);
    const cbUser = getComerBienActiveUser();
    if (cbUser && typeof resolveDietPlanFromComerBienUser === "function") {
      const mapped = resolveDietPlanFromComerBienUser(cbUser);
      if (mapped && DIET_PLANS[mapped]) {
        state.dietPlan = mapped;
        state.adaptIngredients = true;
      }
    }
    bindGlobalEvents();

    try {
      const res = await fetch("./data/recipes.json");
      if (!res.ok) throw new Error("No se pudo cargar recipes.json");
      state.recipes = await res.json();
    } catch (err) {
      console.error(err);
      els.studio.innerHTML =
        '<div class="empty-state"><h3>No se pudo cargar la receta</h3><a href="./index.html" class="btn-primary">Volver al menú circular</a></div>';
      return;
    }

    state.activeFilter = getActiveFilterContext();
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("id");
    const requestedTab = params.get("tab");
    const preferredMedia = requestedTab === "video" ? "video" : null;
    const initialPool = getFilteredRecipesForSelect();
    const fallbackId = initialPool[0]?.id || state.recipes[0]?.id;
    selectRecipeById(requestedId || fallbackId, !requestedId, preferredMedia);
  }

  init();
})();
