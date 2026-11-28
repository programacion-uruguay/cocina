/* =========================================================
   ¿Qué Cocino Hoy? — Ruleta Giratoria "¡A la suerte!"
   Gira con desaceleración real respetando Horario, Estación,
   Calorías y Dieta del panel izquierdo.
   ========================================================= */
(function () {
  "use strict";

  const SLICE_COLORS = [
    "#f97316",
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#ef4444"
  ];

  const CATEGORY_EMOJIS = {
    pollo: "🍗",
    carnes: "🥩",
    pescados: "🐟",
    verduras: "🥗",
    pastas: "🍝",
    dulces: "🍰"
  };

  let currentSlices = [];
  let currentRotation = 0;
  let isSpinning = false;
  let lastWinner = null;
  let lastPoolSignature = "";

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

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function shortLabel(title) {
    const clean = String(title || "")
      .replace(/\([^)]*\)/g, "")
      .replace(/Sin Gluten|Sin TACC/gi, "")
      .trim();
    if (clean.length <= 18) return clean;
    return clean.slice(0, 17).trim() + "…";
  }

  function getCompatiblePool() {
    const app = window.QCHApp;
    if (!app) return [];
    const filtered = app.getFilteredPoolForHome();
    if (filtered.length >= 2) return filtered;
    return app.getRecipes();
  }

  function pickSlices(forceRefresh = false) {
    const pool = getCompatiblePool();
    if (!pool.length) {
      currentSlices = [];
      return;
    }
    const sig = `${pool.length}:${pool[0]?.id || ""}:${pool[pool.length - 1]?.id || ""}`;
    if (!forceRefresh && sig === lastPoolSignature && currentSlices.length >= 2) {
      return;
    }
    lastPoolSignature = sig;
    // Priorizar recetas con video/foto real
    const preferred = pool.filter((r) => r.videoUrl || r.imageUrl);
    const source = preferred.length >= 8 ? preferred : pool;
    const count = Math.min(8, source.length);
    currentSlices = shuffleArray(source).slice(0, count);
    lastWinner = null;
  }

  function buildWheelSvg(slices) {
    const n = slices.length;
    if (!n) return "";
    const cx = 180;
    const cy = 180;
    const r = 168;
    const sliceAngle = 360 / n;

    const paths = slices
      .map((recipe, i) => {
        const startDeg = i * sliceAngle - 90;
        const endDeg = startDeg + sliceAngle;
        const startRad = (startDeg * Math.PI) / 180;
        const endRad = (endDeg * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const largeArc = sliceAngle > 180 ? 1 : 0;
        const color = SLICE_COLORS[i % SLICE_COLORS.length];

        const midDeg = startDeg + sliceAngle / 2;
        const emoji = CATEGORY_EMOJIS[recipe.categoria] || "🍽️";
        const label = shortLabel(recipe.title);

        return `
          <g>
            <path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z"
                  fill="${color}" stroke="#ffffff" stroke-width="2.5" />
            <g transform="translate(${cx}, ${cy}) rotate(${midDeg.toFixed(2)})">
              <text x="${r * 0.62}" y="-3" fill="#ffffff" font-size="11.5" font-weight="800" text-anchor="middle" dominant-baseline="middle" style="text-shadow: 0 1px 2px rgba(0,0,0,0.45);">
                ${escapeHtml(label)}
              </text>
              <text x="${r * 0.62}" y="13" fill="#ffffff" font-size="14" text-anchor="middle" dominant-baseline="middle">
                ${emoji}
              </text>
            </g>
          </g>
        `;
      })
      .join("");

    return `
      <svg viewBox="0 0 360 360" class="roulette-svg" aria-hidden="true">
        <circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="rgba(15,23,42,0.08)" />
        ${paths}
      </svg>
    `;
  }

  function renderResultCard() {
    const resultEl = document.getElementById("roulette-result-slot");
    const app = window.QCHApp;
    if (!resultEl || !app) return;

    const pool = getCompatiblePool();

    if (isSpinning) {
      resultEl.innerHTML = `
        <div class="roulette-placeholder is-spinning">
          <div class="roulette-big-emoji">🎰</div>
          <h3>Girando la ruleta…</h3>
          <p>Buscando el plato ideal para vos respetando tus filtros actuales.</p>
        </div>
      `;
      return;
    }

    if (!lastWinner) {
      resultEl.innerHTML = `
        <div class="roulette-placeholder">
          <div class="roulette-big-emoji">🎲</div>
          <h3>¿No sabés qué cocinar?</h3>
          <p>Tocá <strong>Girar</strong> y dejá que la ruleta elija un plato al azar entre <strong>${pool.length} opciones</strong> compatibles con tu horario, estación, calorías y dieta.</p>
          <button type="button" class="roulette-cta-primary" data-roulette-spin>🎰 Girar la ruleta</button>
        </div>
      `;
      resultEl.querySelector("[data-roulette-spin]")?.addEventListener("click", spin);
      return;
    }

    const r = lastWinner;
    const photo = getRecipePhotoUrl(r);
    const totalMin = (Number(r.prepMinutes) || 0) + (Number(r.cookMinutes) || 0);
    const kcal = app.getRecipeCalories(r);
    const fav = app.isFavorite(r.id);
    const waHref = window.QCHHomeDiscover?.getWhatsappShareHref
      ? window.QCHHomeDiscover.getWhatsappShareHref(r, kcal)
      : "";

    resultEl.innerHTML = `
      <article class="roulette-winner-card">
        <div class="roulette-winner-media">
          <img src="${escapeHtml(photo)}" alt="${escapeHtml(r.title)}" />
          <span class="roulette-winner-badge">🎉 ¡Te tocó esta receta!</span>
        </div>
        <div class="roulette-winner-body">
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.description || "Una excelente opción casera lista para preparar hoy.")}</p>
          <div class="roulette-winner-meta">
            <span>⏱️ ${totalMin} min</span>
            <span>🔥 ${kcal} kcal</span>
            <span>🍽️ ${r.servings || 2} porc.</span>
            ${r.videoUrl ? `<span>🎬 Con video</span>` : ""}
          </div>
          <div class="roulette-winner-actions">
            <button type="button" class="roulette-cta-primary" id="roulette-accept-btn">✅ Me gusta, ver receta →</button>
            <button type="button" class="roulette-cta-secondary" data-roulette-spin>🔄 Girar de nuevo</button>
          </div>
          <div class="roulette-winner-subactions">
            <button type="button" class="daily-btn-icon ${fav ? "is-fav" : ""}" id="roulette-fav-btn">${fav ? "♥ Guardada" : "♡ Guardar"}</button>
            ${waHref ? `<a href="${waHref}" target="_blank" rel="noopener noreferrer" class="daily-btn-wa">${window.QCHHomeDiscover?.WA_ICON_SVG || ""}<span>WhatsApp</span></a>` : ""}
          </div>
        </div>
      </article>
    `;

    resultEl.querySelector("#roulette-accept-btn")?.addEventListener("click", () => {
      app.openRecipePage(r.id);
    });
    resultEl.querySelector("[data-roulette-spin]")?.addEventListener("click", spin);
    resultEl.querySelector("#roulette-fav-btn")?.addEventListener("click", () => {
      app.toggleFavorite(r.id);
      renderResultCard();
    });
  }

  function spin() {
    if (isSpinning || currentSlices.length === 0) return;

    const wheelEl = document.getElementById("roulette-wheel-rotor");
    const spinBtns = document.querySelectorAll("[data-roulette-spin]");
    if (!wheelEl) return;

    isSpinning = true;
    spinBtns.forEach((b) => (b.disabled = true));
    renderResultCard();

    const n = currentSlices.length;
    const sliceAngle = 360 / n;
    const winnerIndex = Math.floor(Math.random() * n);

    // El puntero está arriba (0 deg en coordenadas visuales).
    // El centro del gajo i está en (i + 0.5) * sliceAngle desde las 12 en punto.
    // Para que ese gajo quede justo arriba, la rotación final mod 360 debe ser:
    // (360 - (winnerIndex + 0.5) * sliceAngle) mod 360 (con un pequeño jitter natural dentro del gajo).
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.55);
    const targetMod = (360 - ((winnerIndex + 0.5) * sliceAngle) + jitter + 360) % 360;
    const currentMod = ((currentRotation % 360) + 360) % 360;
    const deltaToTarget = (targetMod - currentMod + 360) % 360;
    const extraSpins = (4 + Math.floor(Math.random() * 2)) * 360;

    currentRotation += extraSpins + deltaToTarget;
    wheelEl.style.transition = "transform 3.6s cubic-bezier(0.14, 0.85, 0.22, 1)";
    wheelEl.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
      isSpinning = false;
      lastWinner = currentSlices[winnerIndex];
      spinBtns.forEach((b) => (b.disabled = false));
      renderResultCard();
    }, 3650);
  }

  function render(forceRefresh = false) {
    const panel = document.getElementById("home-panel-roulette");
    if (!panel || !window.QCHApp) return;

    pickSlices(forceRefresh);
    if (!currentSlices.length) {
      panel.innerHTML = `<div class="fridge-empty"><p>No hay recetas disponibles con esa combinación de filtros. Probá ampliar algún filtro del panel izquierdo.</p></div>`;
      return;
    }

    const pool = getCompatiblePool();

    panel.innerHTML = `
      <div class="roulette-stage">
        <div class="roulette-wheel-col">
          <div class="roulette-wheel-head">
            <h2>🎰 Ruleta "¡A la suerte!"</h2>
            <p>Elegí al azar entre <strong>${pool.length}</strong> platos filtrados según tu horario y dieta</p>
          </div>
          <div class="roulette-wheel-wrap">
            <div class="roulette-pointer" aria-hidden="true">▼</div>
            <div class="roulette-rotor" id="roulette-wheel-rotor" style="transform: rotate(${currentRotation}deg);">
              ${buildWheelSvg(currentSlices)}
            </div>
            <button type="button" class="roulette-center-btn" data-roulette-spin aria-label="Girar la ruleta">
              GIRAR
            </button>
          </div>
          <div class="roulette-wheel-controls">
            <button type="button" class="roulette-cta-primary" data-roulette-spin>🎰 Girar ahora</button>
            <button type="button" class="roulette-cta-ghost" id="roulette-shuffle-btn">🔀 Cambiar los 8 platos</button>
          </div>
        </div>

        <div class="roulette-result-col" id="roulette-result-slot"></div>
      </div>
    `;

    panel.querySelectorAll("[data-roulette-spin]").forEach((btn) => {
      btn.addEventListener("click", spin);
    });
    panel.querySelector("#roulette-shuffle-btn")?.addEventListener("click", () => {
      if (isSpinning) return;
      render(true);
    });

    renderResultCard();
  }

  window.QCHRoulette = {
    render,
    spin
  };
})();
