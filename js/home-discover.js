/* =========================================================
   ¿Qué Cocino Hoy? — Descubrimiento Visual del Inicio
   1. Carrusel con fotos reales según el horario
   2. Receta destacada del día (según fecha y estación)
   3. Accesos por "situación del día" (Moods)
   4. "¿Qué tenés en la heladera?" (Buscador por ingredientes)
   5. Compartir por WhatsApp en cada tarjeta
   ========================================================= */
(function () {
  "use strict";

  const FRIDGE_ITEMS = [
    { id: "huevo", label: "Huevo", emoji: "🥚", terms: ["huevo", "huevos", "clara", "yema"] },
    { id: "pollo", label: "Pollo", emoji: "🍗", terms: ["pollo", "pechuga", "pata", "muslo", "suprema"] },
    { id: "papa", label: "Papa", emoji: "🥔", terms: ["papa", "papas", "patata"] },
    { id: "arroz", label: "Arroz", emoji: "🍚", terms: ["arroz"] },
    { id: "fideos", label: "Fideos / Pasta", emoji: "🍝", terms: ["fideo", "pasta", "tallarin", "spaghetti", "ñoqui", "raviol", "macarron"] },
    { id: "queso", label: "Queso", emoji: "🧀", terms: ["queso", "muzzarella", "mozzarella", "parmesano", "ricota", "cheddar", "cremoso"] },
    { id: "tomate", label: "Tomate", emoji: "🍅", terms: ["tomate", "tomates", "pulpa de tomate", "salsa de tomate"] },
    { id: "cebolla", label: "Cebolla", emoji: "🧅", terms: ["cebolla", "cebollas", "verdeo"] },
    { id: "atun", label: "Atún", emoji: "🐟", terms: ["atun", "atún"] },
    { id: "zapallo", label: "Zapallo", emoji: "🎃", terms: ["zapallo", "calabaza", "cabutia", "calabacin"] },
    { id: "carne", label: "Carne", emoji: "🥩", terms: ["carne", "bife", "picada", "nalga", "cuadril", "asado", "colita", "lomo"] },
    { id: "leche", label: "Leche", emoji: "🥛", terms: ["leche", "yogur"] },
    { id: "avena", label: "Avena", emoji: "🌾", terms: ["avena"] },
    { id: "banana", label: "Banana", emoji: "🍌", terms: ["banana", "bananas", "platano"] },
    { id: "espinaca", label: "Espinaca / Acelga", emoji: "🥬", terms: ["espinaca", "acelga"] },
    { id: "zanahoria", label: "Zanahoria", emoji: "🥕", terms: ["zanahoria", "zanahorias"] }
  ];

  const WA_ICON_SVG = `<svg class="wa-svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.49 0 .14 5.35.14 11.92c0 2.1.55 4.15 1.59 5.96L0 24l6.29-1.65a11.86 11.86 0 0 0 5.77 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.47-8.42ZM12.07 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.73.98 1-3.64-.24-.37a9.84 9.84 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"/></svg>`;

  const MAX_FRIDGE_INGREDIENTS = 4;
  const FRIDGE_PAGE_SIZE = 6;
  const selectedFridgeIds = new Set();
  let customFridgeQuery = "";
  let fridgeHitsFilter = "auto"; // "auto" | "all" | number (1..4)
  let fridgePage = 1;

  function normalizeText(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function extractYouTubeId(url) {
    if (!url) return "";
    const m = String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  }

  function getRecipePhotoUrl(r) {
    const ytId = extractYouTubeId(r.videoUrl);
    if (ytId) return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    if (r.imageUrl) return r.imageUrl;
    return "./img/logo-og.jpg";
  }

  function getRecipeShareUrl(r) {
    const origin =
      window.location.origin && window.location.origin.startsWith("http")
        ? window.location.origin
        : "https://que-cocino-hoy-4lz.pages.dev";
    return `${origin}/recetas/${encodeURIComponent(r.id)}/`;
  }

  function getWhatsappShareHref(r, kcal) {
    const totalMin = (Number(r.prepMinutes) || 0) + (Number(r.cookMinutes) || 0);
    const url = getRecipeShareUrl(r);
    const msg = `¿Cocinamos esto hoy? 🍳 *${r.title}* (${totalMin} min · ~${kcal} kcal)\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  function getCurrentUruguaySeason() {
    const month = new Date().getMonth() + 1;
    if (month === 12 || month <= 2) return { key: "verano", label: "Verano" };
    if (month >= 3 && month <= 5) return { key: "otono", label: "Otoño" };
    if (month >= 6 && month <= 8) return { key: "invierno", label: "Invierno" };
    return { key: "primavera", label: "Primavera" };
  }

  function pickDailyRecipe(recipes) {
    if (!recipes || !recipes.length) return null;
    const now = new Date();
    const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const withVideo = recipes.filter((r) => r.videoUrl && r.description);
    const pool = withVideo.length ? withVideo : recipes;
    const idx = dateSeed % pool.length;
    return pool[idx];
  }

  function getGreetingByHour() {
    const h = new Date().getHours();
    if (h < 10) return "¡Buen día!<br />¿Qué desayunamos hoy?";
    if (h < 14) return "¡Buen mediodía!<br />¿Qué almorzamos hoy?";
    if (h < 18) return "¡Buenas tardes!<br />¿Qué merendamos hoy?";
    return "¡Buenas noches!<br />¿Qué cenamos hoy?";
  }

  function renderDiscoverStrip() {
    const container = document.getElementById("home-discover-strip");
    const app = window.QCHApp;
    if (!container || !app) return;

    const allRecipes = app.getRecipes();
    if (!allRecipes.length) return;

    const pool = app.getFilteredPoolForHome();
    const momentKey = app.getCurrentMomentKey();
    const autoTime = app.getAutoMomentByTime();

    const carouselTitles = {
      desayuno: { emoji: "☀️", title: "Para arrancar el desayuno", sub: "Opciones tentadoras con foto para esta mañana" },
      almuerzo: { emoji: "🍽️", title: "Almuerzos recomendados para hoy", sub: "Elegí con los ojos y cociná en minutos" },
      merienda: { emoji: "☕", title: "Algo rico para la merienda", sub: "Dulces, salados y clásicos para la tarde" },
      cena: { emoji: "🌙", title: "Ideas para cenar esta noche", sub: "Recetas prácticas y ricas para cerrar el día" }
    };
    const meta = autoTime
      ? carouselTitles[momentKey] || carouselTitles.almuerzo
      : { emoji: "🍽️", title: "Recomendados de hoy", sub: "Recetas de todos los momentos listas para cocinar" };

    // Priorizar recetas con foto propia o video
    const carouselSource = pool.length ? pool : allRecipes;
    const sortedForCarousel = [...carouselSource].sort((a, b) => {
      const scoreA = (a.imageUrl ? 2 : 0) + (a.videoUrl ? 2 : 0);
      const scoreB = (b.imageUrl ? 2 : 0) + (b.videoUrl ? 2 : 0);
      return scoreB - scoreA;
    });

    // Rotar suavemente según la hora del día para que siempre se vea fresco
    const hourOffset = (new Date().getDate() + new Date().getHours()) % Math.max(1, Math.min(sortedForCarousel.length, 24));
    const rotated = [
      ...sortedForCarousel.slice(hourOffset),
      ...sortedForCarousel.slice(0, hourOffset)
    ].slice(0, 14);

    const carouselCardsHtml = rotated
      .map((r) => {
        const photo = getRecipePhotoUrl(r);
        const totalMin = (Number(r.prepMinutes) || 0) + (Number(r.cookMinutes) || 0);
        const kcal = app.getRecipeCalories(r);
        const fav = app.isFavorite(r.id);
        const waHref = getWhatsappShareHref(r, kcal);
        return `
          <article class="discover-card" data-discover-recipe="${escapeHtml(r.id)}">
            <div class="discover-card-media">
              <img src="${escapeHtml(photo)}" alt="${escapeHtml(r.title)}" loading="lazy" decoding="async" />
              <span class="discover-time-pill">⏱️ ${totalMin}m</span>
              ${r.videoUrl ? `<span class="discover-video-pill">🎬 Video</span>` : ""}
              <div class="discover-card-actions">
                <button type="button" class="discover-icon-btn ${fav ? "is-fav" : ""}" data-discover-fav="${escapeHtml(r.id)}" aria-label="${fav ? "Quitar de favoritos" : "Guardar en favoritos"}" title="Guardar en favoritos">
                  ${fav ? "♥" : "♡"}
                </button>
                <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="discover-icon-btn discover-wa-btn" data-stop-card aria-label="Compartir por WhatsApp" title="Compartir por WhatsApp">
                  ${WA_ICON_SVG}
                </a>
              </div>
            </div>
            <div class="discover-card-body">
              <h3 class="discover-card-title">${escapeHtml(r.title)}</h3>
              <div class="discover-card-meta">
                <span>🔥 ${kcal} kcal</span>
                <span>🍽️ ${r.servings || 2} porc.</span>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    // Receta destacada del día
    const daily = pickDailyRecipe(allRecipes);
    const season = getCurrentUruguaySeason();
    const dailyHtml = daily
      ? (() => {
          const photo = getRecipePhotoUrl(daily);
          const totalMin = (Number(daily.prepMinutes) || 0) + (Number(daily.cookMinutes) || 0);
          const kcal = app.getRecipeCalories(daily);
          const fav = app.isFavorite(daily.id);
          const waHref = getWhatsappShareHref(daily, kcal);
          return `
            <article class="daily-featured-card" data-discover-recipe="${escapeHtml(daily.id)}">
              <div class="daily-featured-media">
                <img src="${escapeHtml(photo)}" alt="${escapeHtml(daily.title)}" loading="lazy" decoding="async" />
                <span class="daily-featured-badge">⭐ Receta del día · ${season.label}</span>
              </div>
              <div class="daily-featured-body">
                <h3>${escapeHtml(daily.title)}</h3>
                <p>${escapeHtml(daily.description || "Una propuesta casera, rica y fácil para resolver tu comida de hoy.")}</p>
                <div class="daily-featured-meta">
                  <span>⏱️ ${totalMin} min</span>
                  <span>🔥 ${kcal} kcal</span>
                  <span>🍽️ ${daily.servings || 2} porc.</span>
                  ${daily.videoUrl ? `<span>🎬 Con video</span>` : ""}
                </div>
                <div class="daily-featured-cta">
                  <button type="button" class="daily-btn-primary" data-discover-recipe="${escapeHtml(daily.id)}">Ver receta →</button>
                  <button type="button" class="daily-btn-icon ${fav ? "is-fav" : ""}" data-discover-fav="${escapeHtml(daily.id)}" title="Guardar en favoritos">${fav ? "♥ Guardada" : "♡ Guardar"}</button>
                  <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="daily-btn-wa" data-stop-card title="Enviar por WhatsApp">${WA_ICON_SVG}<span>WhatsApp</span></a>
                </div>
              </div>
            </article>
          `;
        })()
      : "";

    container.innerHTML = `
      <div class="home-info-banner">
        <div class="home-info-copy">
          <h2>${getGreetingByHour()}</h2>
          <p>Explorá <strong>${allRecipes.length} recetas</strong> con fotos reales, videos paso a paso, <strong>18 dietas</strong> y precios en supermercados de Uruguay.</p>
        </div>
        <div class="home-info-actions">
          <button type="button" class="home-info-btn-primary" id="jump-to-wheel-btn">🎡 Abrir Ruleta de Recetas</button>
          <button type="button" class="home-info-btn-secondary" id="jump-to-fridge-hero-btn">🧊 Mi Heladera</button>
        </div>
      </div>

      <div class="discover-carousel-block">
        <div class="discover-head">
          <div>
            <h2>${meta.emoji} ${meta.title}</h2>
            <p>${meta.sub} · Tocá cualquier plato para ver ingredientes y precios</p>
          </div>
          <div class="discover-nav-btns">
            <button type="button" class="discover-arrow" id="discover-prev-btn" aria-label="Anterior">‹</button>
            <button type="button" class="discover-arrow" id="discover-next-btn" aria-label="Siguiente">›</button>
          </div>
        </div>
        <div class="discover-track" id="discover-carousel-track">
          ${carouselCardsHtml}
        </div>
      </div>

      <div class="discover-lower-grid">
        <div class="discover-daily-col">
          ${dailyHtml}
        </div>

        <div class="discover-moods-col">
          <div class="moods-card">
            <div class="moods-head">
              <h3>⚡ ¿Cómo venís hoy?</h3>
              <p>Elegí tu situación y te mostramos recetas listas en 1 clic</p>
            </div>
            <div class="moods-grid">
              <button type="button" class="mood-btn" data-mood-key="fast">
                <span class="mood-emoji">⚡</span>
                <div>
                  <strong>Llego sin tiempo</strong>
                  <span>Listas en menos de 15 min</span>
                </div>
              </button>
              <button type="button" class="mood-btn" data-mood-key="budget">
                <span class="mood-emoji">💰</span>
                <div>
                  <strong>Fin de mes</strong>
                  <span>Económicas y rendidoras</span>
                </div>
              </button>
              <button type="button" class="mood-btn" data-mood-key="comfort">
                <span class="mood-emoji">🍲</span>
                <div>
                  <strong>Clásicos de olla y horno</strong>
                  <span>Comida casera que abraza</span>
                </div>
              </button>
              <button type="button" class="mood-btn" data-mood-key="light">
                <span class="mood-emoji">🥗</span>
                <div>
                  <strong>Liviano para cuidarme</strong>
                  <span>Opciones frescas ≤ 300 kcal</span>
                </div>
              </button>
            </div>
            <button type="button" class="mood-fridge-link" id="jump-to-fridge-btn">
              🧊 ¿Preferís cocinar con lo que ya tenés en la heladera? <strong>Ir a Mi Heladera →</strong>
            </button>
          </div>
        </div>
      </div>
    `;

    // Flechas del carrusel
    const track = container.querySelector("#discover-carousel-track");
    container.querySelector("#discover-prev-btn")?.addEventListener("click", () => {
      track?.scrollBy({ left: -320, behavior: "smooth" });
    });
    container.querySelector("#discover-next-btn")?.addEventListener("click", () => {
      track?.scrollBy({ left: 320, behavior: "smooth" });
    });

    // Moods
    container.querySelectorAll("[data-mood-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        app.applyMoodFilter(btn.dataset.moodKey);
      });
    });

    // Ir al Buscador Circular o a Mi Heladera desde el inicio
    container.querySelector("#jump-to-wheel-btn")?.addEventListener("click", () => {
      document.querySelector('[data-home-tab="wheel"]')?.click();
    });
    const openFridge = () => {
      const fridgeTabBtn = document.querySelector('[data-home-tab="fridge"]');
      if (fridgeTabBtn) {
        fridgeTabBtn.click();
        fridgeTabBtn.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    container.querySelector("#jump-to-fridge-btn")?.addEventListener("click", openFridge);
    container.querySelector("#jump-to-fridge-hero-btn")?.addEventListener("click", openFridge);

    bindCardInteractions(container);
  }

  function getActiveFridgeTerms() {
    const activeTerms = [];
    selectedFridgeIds.forEach((id) => {
      if (activeTerms.length >= MAX_FRIDGE_INGREDIENTS) return;
      const item = FRIDGE_ITEMS.find((f) => f.id === id);
      if (item) activeTerms.push(item.terms);
    });
    const extra = normalizeText(customFridgeQuery)
      .split(/[,;\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);
    for (const word of extra) {
      if (activeTerms.length >= MAX_FRIDGE_INGREDIENTS) break;
      activeTerms.push([word]);
    }
    return activeTerms;
  }

  function getFridgeMatches(recipes) {
    const activeTerms = getActiveFridgeTerms();
    if (!activeTerms.length) return { activeCount: 0, matches: [] };

    const scored = [];
    for (const r of recipes) {
      const ingText = normalizeText(
        (r.ingredients || []).map((i) => (typeof i === "string" ? i : i.item || "")).join(" ") + " " + (r.title || "")
      );
      let hits = 0;
      for (const termGroup of activeTerms) {
        if (termGroup.some((t) => ingText.includes(normalizeText(t)))) {
          hits++;
        }
      }
      if (hits > 0) {
        scored.push({ recipe: r, hits, total: activeTerms.length });
      }
    }

    scored.sort((a, b) => {
      if (b.hits !== a.hits) return b.hits - a.hits;
      const tA = (a.recipe.prepMinutes || 0) + (a.recipe.cookMinutes || 0);
      const tB = (b.recipe.prepMinutes || 0) + (b.recipe.cookMinutes || 0);
      return tA - tB;
    });

    return { activeCount: activeTerms.length, matches: scored };
  }

  function buildPaginationPages(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = new Set([1, total, current, current - 1, current + 1]);
    const sorted = Array.from(pages)
      .filter((p) => p >= 1 && p <= total)
      .sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
      out.push(sorted[i]);
    }
    return out;
  }

  function renderFridgePanel() {
    const panel = document.getElementById("home-panel-fridge");
    const app = window.QCHApp;
    if (!panel || !app) return;

    const recipes = app.getRecipes();
    if (!recipes.length) return;

    const { activeCount, matches } = getFridgeMatches(recipes);
    const atLimit = activeCount >= MAX_FRIDGE_INGREDIENTS;

    const chipsHtml = FRIDGE_ITEMS.map((item) => {
      const active = selectedFridgeIds.has(item.id);
      const disabled = !active && atLimit;
      return `
        <button type="button" class="fridge-chip ${active ? "is-active" : ""}" data-fridge-id="${item.id}" aria-pressed="${active}" ${disabled ? "disabled" : ""}>
          <span>${item.emoji}</span> ${item.label}
        </button>
      `;
    }).join("");

    let resultsHtml = "";
    if (activeCount === 0) {
      resultsHtml = `
        <div class="fridge-empty">
          <p>👆 Elegí hasta <strong>${MAX_FRIDGE_INGREDIENTS} ingredientes</strong> que tengas hoy en tu cocina y te mostramos qué podés preparar sin salir a comprar.</p>
        </div>
      `;
    } else if (matches.length === 0) {
      resultsHtml = `
        <div class="fridge-empty">
          <p>No encontramos recetas con esa combinación exacta. Probá quitar algún ingrediente.</p>
        </div>
      `;
    } else {
      // Conteo por nivel de coincidencia (ej: 4/4, 3/4, 2/4, 1/4)
      const countByHits = {};
      for (let h = activeCount; h >= 1; h--) countByHits[h] = 0;
      matches.forEach((m) => {
        if (countByHits[m.hits] !== undefined) countByHits[m.hits]++;
      });

      // Si está en "auto" o el nivel elegido ya no existe, elegir el mayor nivel con resultados
      if (
        fridgeHitsFilter === "auto" ||
        (fridgeHitsFilter !== "all" && (!countByHits[fridgeHitsFilter] || fridgeHitsFilter > activeCount))
      ) {
        let best = "all";
        for (let h = activeCount; h >= 1; h--) {
          if (countByHits[h] > 0) {
            best = h;
            break;
          }
        }
        fridgeHitsFilter = best;
        fridgePage = 1;
      }

      const visibleMatches =
        fridgeHitsFilter === "all" ? matches : matches.filter((m) => m.hits === fridgeHitsFilter);

      const totalPages = Math.max(1, Math.ceil(visibleMatches.length / FRIDGE_PAGE_SIZE));
      if (fridgePage > totalPages) fridgePage = totalPages;
      if (fridgePage < 1) fridgePage = 1;

      const startIdx = (fridgePage - 1) * FRIDGE_PAGE_SIZE;
      const pageItems = visibleMatches.slice(startIdx, startIdx + FRIDGE_PAGE_SIZE);

      // Sub-pestañas por coincidencia
      const tierTabs = [];
      for (let h = activeCount; h >= 1; h--) {
        if (countByHits[h] === 0) continue;
        const icon = h === activeCount ? "✅" : h >= 2 ? "🟡" : "⚪";
        const label =
          h === activeCount
            ? activeCount === 1
              ? "Con 1 ingrediente"
              : `Con los ${activeCount}`
            : `Con ${h} de ${activeCount}`;
        tierTabs.push(`
          <button type="button" class="fridge-tier-btn ${fridgeHitsFilter === h ? "is-active" : ""}" data-fridge-tier="${h}">
            ${icon} ${label} <span class="fridge-tier-count">${countByHits[h]}</span>
          </button>
        `);
      }
      if (activeCount > 1) {
        tierTabs.push(`
          <button type="button" class="fridge-tier-btn ${fridgeHitsFilter === "all" ? "is-active" : ""}" data-fridge-tier="all">
            📋 Todas <span class="fridge-tier-count">${matches.length}</span>
          </button>
        `);
      }

      // Mapa de rangos de páginas cuando está en "Todas"
      let rangeMapHtml = "";
      if (fridgeHitsFilter === "all" && activeCount > 1) {
        const ranges = [];
        let cursor = 0;
        for (let h = activeCount; h >= 1; h--) {
          const cnt = countByHits[h];
          if (!cnt) continue;
          const firstPage = Math.floor(cursor / FRIDGE_PAGE_SIZE) + 1;
          const lastPage = Math.floor((cursor + cnt - 1) / FRIDGE_PAGE_SIZE) + 1;
          const pageLabel = firstPage === lastPage ? `pág. ${firstPage}` : `pág. ${firstPage}–${lastPage}`;
          ranges.push(
            `<button type="button" class="fridge-range-pill" data-fridge-page="${firstPage}"><strong>${h}/${activeCount} ingred.:</strong> ${pageLabel} (${cnt})</button>`
          );
          cursor += cnt;
        }
        rangeMapHtml = `<div class="fridge-range-map">${ranges.join("")}</div>`;
      }

      const pagesList = buildPaginationPages(fridgePage, totalPages);
      const paginationHtml =
        totalPages > 1
          ? `
        <div class="fridge-pagination" aria-label="Paginación de recetas de Mi Heladera">
          <button type="button" class="fridge-page-btn" data-fridge-page="${fridgePage - 1}" ${fridgePage <= 1 ? "disabled" : ""}>← Anterior</button>
          <div class="fridge-page-nums">
            ${pagesList
              .map((p) =>
                p === "…"
                  ? `<span class="fridge-page-ellipsis">…</span>`
                  : `<button type="button" class="fridge-page-num ${p === fridgePage ? "is-active" : ""}" data-fridge-page="${p}">${p}</button>`
              )
              .join("")}
          </div>
          <button type="button" class="fridge-page-btn" data-fridge-page="${fridgePage + 1}" ${fridgePage >= totalPages ? "disabled" : ""}>Siguiente →</button>
        </div>`
          : "";

      resultsHtml = `
        <div class="fridge-results-head">
          <span>Encontramos <strong>${matches.length}</strong> recetas · Mostrando <strong>${startIdx + 1}–${Math.min(startIdx + pageItems.length, visibleMatches.length)}</strong> de <strong>${visibleMatches.length}</strong></span>
          <button type="button" id="fridge-clear-btn" class="fridge-clear-btn">Limpiar selección</button>
        </div>
        <div class="fridge-tier-tabs" role="tablist" aria-label="Filtrar por cantidad de ingredientes coincidentes">
          ${tierTabs.join("")}
        </div>
        ${rangeMapHtml}
        <div class="fridge-results-grid">
          ${pageItems
            .map(({ recipe: r, hits, total }) => {
              const photo = getRecipePhotoUrl(r);
              const totalMin = (Number(r.prepMinutes) || 0) + (Number(r.cookMinutes) || 0);
              const kcal = app.getRecipeCalories(r);
              const fav = app.isFavorite(r.id);
              const waHref = getWhatsappShareHref(r, kcal);
              const matchClass = hits === total ? "is-full" : hits >= 2 ? "is-mid" : "is-low";
              return `
                <article class="discover-card fridge-result-card" data-discover-recipe="${escapeHtml(r.id)}">
                  <div class="discover-card-media">
                    <img src="${escapeHtml(photo)}" alt="${escapeHtml(r.title)}" loading="lazy" decoding="async" />
                    <span class="fridge-match-pill ${matchClass}">✓ ${hits}/${total} ingred.</span>
                    <div class="discover-card-actions">
                      <button type="button" class="discover-icon-btn ${fav ? "is-fav" : ""}" data-discover-fav="${escapeHtml(r.id)}" aria-label="Guardar en favoritos">
                        ${fav ? "♥" : "♡"}
                      </button>
                      <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="discover-icon-btn discover-wa-btn" data-stop-card aria-label="Compartir por WhatsApp" title="Compartir por WhatsApp">
                        ${WA_ICON_SVG}
                      </a>
                    </div>
                  </div>
                  <div class="discover-card-body">
                    <h3 class="discover-card-title">${escapeHtml(r.title)}</h3>
                    <div class="discover-card-meta">
                      <span>⏱️ ${totalMin}m</span>
                      <span>🔥 ${kcal} kcal</span>
                    </div>
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
        ${paginationHtml}
      `;
    }

    panel.innerHTML = `
      <div class="fridge-box">
        <div class="fridge-header">
          <div>
            <h2>🧊 ¿Qué tenés en la heladera?</h2>
            <p>Elegí hasta <strong>${MAX_FRIDGE_INGREDIENTS} ingredientes</strong> y cociná hoy sin ir al súper</p>
          </div>
          <span class="fridge-counter-pill ${atLimit ? "is-limit" : ""}">${activeCount} / ${MAX_FRIDGE_INGREDIENTS} ingredientes</span>
        </div>
        <div class="fridge-chips-wrap">
          ${chipsHtml}
        </div>
        <div class="fridge-extra-row">
          <input type="text" id="fridge-custom-input" class="fridge-custom-input" value="${escapeHtml(customFridgeQuery)}" placeholder="${atLimit && !customFridgeQuery ? "Ya elegiste el máximo de 4 ingredientes (desmarcá uno para agregar otro)" : "¿Tenés algo más? Ej: lentejas, brócoli, choclo..."}" ${atLimit && !customFridgeQuery ? "disabled" : ""} />
        </div>
        ${resultsHtml}
      </div>
    `;

    panel.querySelectorAll("[data-fridge-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.fridgeId;
        if (selectedFridgeIds.has(id)) {
          selectedFridgeIds.delete(id);
        } else if (getActiveFridgeTerms().length < MAX_FRIDGE_INGREDIENTS) {
          selectedFridgeIds.add(id);
        }
        fridgeHitsFilter = "auto";
        fridgePage = 1;
        renderFridgePanel();
      });
    });

    const customInput = panel.querySelector("#fridge-custom-input");
    if (customInput) {
      let timer = null;
      customInput.addEventListener("input", (e) => {
        customFridgeQuery = e.target.value;
        fridgeHitsFilter = "auto";
        fridgePage = 1;
        clearTimeout(timer);
        timer = setTimeout(() => {
          const pos = customInput.selectionStart;
          renderFridgePanel();
          const nextInput = document.getElementById("fridge-custom-input");
          if (nextInput) {
            nextInput.focus();
            try {
              nextInput.setSelectionRange(pos, pos);
            } catch {}
          }
        }, 320);
      });
    }

    panel.querySelector("#fridge-clear-btn")?.addEventListener("click", () => {
      selectedFridgeIds.clear();
      customFridgeQuery = "";
      fridgeHitsFilter = "auto";
      fridgePage = 1;
      renderFridgePanel();
    });

    panel.querySelectorAll("[data-fridge-tier]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.fridgeTier;
        fridgeHitsFilter = val === "all" ? "all" : Number(val);
        fridgePage = 1;
        renderFridgePanel();
      });
    });

    panel.querySelectorAll("[data-fridge-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = Number(btn.dataset.fridgePage);
        if (Number.isFinite(p) && p >= 1) {
          fridgePage = p;
          renderFridgePanel();
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    bindCardInteractions(panel);
  }

  function bindCardInteractions(root) {
    const app = window.QCHApp;
    if (!root || !app) return;

    root.querySelectorAll("[data-stop-card]").forEach((el) => {
      el.addEventListener("click", (e) => e.stopPropagation());
    });

    root.querySelectorAll("[data-discover-fav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        app.toggleFavorite(btn.dataset.discoverFav);
      });
    });

    root.querySelectorAll("[data-discover-recipe]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        app.openRecipePage(el.dataset.discoverRecipe);
      });
    });
  }

  function renderAll() {
    renderDiscoverStrip();
    renderFridgePanel();
  }

  window.QCHHomeDiscover = {
    render: renderAll,
    getWhatsappShareHref,
    WA_ICON_SVG
  };
})();
