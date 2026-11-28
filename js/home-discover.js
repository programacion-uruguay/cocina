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

  const selectedFridgeIds = new Set();
  let customFridgeQuery = "";

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
                  💬
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
                  <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="daily-btn-wa" data-stop-card title="Enviar por WhatsApp">💬 WhatsApp</a>
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

  function getFridgeMatches(recipes) {
    const activeTerms = [];
    selectedFridgeIds.forEach((id) => {
      const item = FRIDGE_ITEMS.find((f) => f.id === id);
      if (item) activeTerms.push(item.terms);
    });
    const extra = normalizeText(customFridgeQuery)
      .split(/[,;\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);
    extra.forEach((word) => activeTerms.push([word]));

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

  function renderFridgePanel() {
    const panel = document.getElementById("home-panel-fridge");
    const app = window.QCHApp;
    if (!panel || !app) return;

    const recipes = app.getRecipes();
    if (!recipes.length) return;

    const { activeCount, matches } = getFridgeMatches(recipes);

    const chipsHtml = FRIDGE_ITEMS.map((item) => {
      const active = selectedFridgeIds.has(item.id);
      return `
        <button type="button" class="fridge-chip ${active ? "is-active" : ""}" data-fridge-id="${item.id}" aria-pressed="${active}">
          <span>${item.emoji}</span> ${item.label}
        </button>
      `;
    }).join("");

    let resultsHtml = "";
    if (activeCount === 0) {
      resultsHtml = `
        <div class="fridge-empty">
          <p>👆 Tocá 2 o 3 ingredientes que tengas hoy en tu cocina y te mostramos qué podés preparar sin salir a comprar.</p>
        </div>
      `;
    } else if (matches.length === 0) {
      resultsHtml = `
        <div class="fridge-empty">
          <p>No encontramos recetas con esa combinación exacta. Probá quitar algún ingrediente.</p>
        </div>
      `;
    } else {
      const top = matches.slice(0, 8);
      resultsHtml = `
        <div class="fridge-results-head">
          <span>Encontramos <strong>${matches.length}</strong> recetas con lo que tenés</span>
          <button type="button" id="fridge-clear-btn" class="fridge-clear-btn">Limpiar selección</button>
        </div>
        <div class="fridge-results-grid">
          ${top
            .map(({ recipe: r, hits, total }) => {
              const photo = getRecipePhotoUrl(r);
              const totalMin = (Number(r.prepMinutes) || 0) + (Number(r.cookMinutes) || 0);
              const kcal = app.getRecipeCalories(r);
              const fav = app.isFavorite(r.id);
              const waHref = getWhatsappShareHref(r, kcal);
              return `
                <article class="discover-card fridge-result-card" data-discover-recipe="${escapeHtml(r.id)}">
                  <div class="discover-card-media">
                    <img src="${escapeHtml(photo)}" alt="${escapeHtml(r.title)}" loading="lazy" decoding="async" />
                    <span class="fridge-match-pill">✓ ${hits}/${total} ingred.</span>
                    <div class="discover-card-actions">
                      <button type="button" class="discover-icon-btn ${fav ? "is-fav" : ""}" data-discover-fav="${escapeHtml(r.id)}" aria-label="Guardar en favoritos">
                        ${fav ? "♥" : "♡"}
                      </button>
                      <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="discover-icon-btn discover-wa-btn" data-stop-card aria-label="Compartir por WhatsApp" title="Compartir por WhatsApp">
                        💬
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
      `;
    }

    panel.innerHTML = `
      <div class="fridge-box">
        <div class="fridge-header">
          <div>
            <h2>🧊 ¿Qué tenés en la heladera?</h2>
            <p>Marcá ingredientes que tenés a mano y cociná hoy sin ir al súper</p>
          </div>
        </div>
        <div class="fridge-chips-wrap">
          ${chipsHtml}
        </div>
        <div class="fridge-extra-row">
          <input type="text" id="fridge-custom-input" class="fridge-custom-input" value="${escapeHtml(customFridgeQuery)}" placeholder="¿Tenés algo más? Ej: lentejas, brócoli, choclo..." />
        </div>
        ${resultsHtml}
      </div>
    `;

    panel.querySelectorAll("[data-fridge-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.fridgeId;
        if (selectedFridgeIds.has(id)) selectedFridgeIds.delete(id);
        else selectedFridgeIds.add(id);
        renderFridgePanel();
      });
    });

    const customInput = panel.querySelector("#fridge-custom-input");
    if (customInput) {
      let timer = null;
      customInput.addEventListener("input", (e) => {
        customFridgeQuery = e.target.value;
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
      renderFridgePanel();
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
      el.addEventListener("click", () => {
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
    getWhatsappShareHref
  };
})();
