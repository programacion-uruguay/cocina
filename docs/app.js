(() => {
  const STORAGE_RECIPES_KEY = "mirecetario_recipes_v1";
  const STORAGE_SHOPPING_KEY = "mirecetario_shopping_v1";
  const STORAGE_CLOUD_KEY = "mirecetario_supabase_cfg_v1";

  const MEAL_LABELS = {
    desayuno: "Desayuno",
    almuerzo: "Almuerzo",
    merienda: "Merienda",
    cena: "Cena",
    snack: "Snack",
    postre: "Postre",
  };

  const METHOD_LABELS = {
    freidora_aire: { label: "Freidora de Aire", short: "Air Fryer", defaultTemp: 180 },
    horno: { label: "Horno", short: "Horno", defaultTemp: 200 },
    cocina: { label: "Cocina / Hornalla", short: "Cocina" },
    microondas: { label: "Microondas", short: "Microondas" },
    sin_coccion: { label: "Sin cocción", short: "Sin cocción" },
  };

  const SEED_RECIPES = [
    {
      id: "receta-pollo-airfryer",
      title: "Pechuga de Pollo Crujiente con Papas Rústicas",
      description:
        "Receta rápida y alta en proteínas ideal para freidora de aire, con adaptación para horno tradicional.",
      calories: 485,
      servings: 2,
      prepTimeMinutes: 25,
      mealTimes: ["almuerzo", "cena"],
      cookingMethods: [
        { method: "freidora_aire", temperatureC: 190, timeMinutes: 18, notes: "Dar vuelta a mitad del tiempo." },
        { method: "horno", temperatureC: 210, timeMinutes: 30, notes: "Precalentar 10 minutos antes." },
      ],
      ingredients: [
        { id: "i1", name: "Pechuga de pollo", quantity: 400, unit: "g" },
        { id: "i2", name: "Papas", quantity: 350, unit: "g" },
        { id: "i3", name: "Aceite de oliva", quantity: 1, unit: "cucharada" },
      ],
      steps: [
        "Cortar las papas en gajos y el pollo en tiras.",
        "Condimentar con aceite de oliva, sal, pimentón y ajo.",
        "Cocinar en freidora de aire a 190°C por 18 minutos.",
      ],
      resources: [{ id: "r1", type: "web", title: "Referencia web", url: "https://www.bonappetit.com" }],
      sourceUrl: "https://www.bonappetit.com",
      isFavorite: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "receta-avena-desayuno",
      title: "Panqueques de Avena y Banana",
      description: "Desayuno energético sin azúcar agregada, listo en 10 minutos en sartén.",
      calories: 320,
      servings: 1,
      prepTimeMinutes: 10,
      mealTimes: ["desayuno", "merienda"],
      cookingMethods: [{ method: "cocina", timeMinutes: 6, notes: "Fuego medio-bajo." }],
      ingredients: [
        { id: "i4", name: "Banana madura", quantity: 1, unit: "unidad" },
        { id: "i5", name: "Huevo", quantity: 2, unit: "unidades" },
        { id: "i6", name: "Avena arrollada", quantity: 50, unit: "g" },
      ],
      steps: [
        "Pisar la banana y mezclar con huevos y avena.",
        "Cocinar en sartén caliente 2 minutos por lado.",
      ],
      resources: [],
      isFavorite: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // IndexedDB para almacenar videos y archivos locales sin límite de 5MB
  const MediaDB = {
    open() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open("MiRecetarioMediaDB", 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains("files")) {
            req.result.createObjectStore("files");
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },
    async save(id, blob) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put(blob, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
    async getUrl(id) {
      const db = await this.open();
      return new Promise((resolve) => {
        const tx = db.transaction("files", "readonly");
        const req = tx.objectStore("files").get(id);
        req.onsuccess = () => {
          if (req.result) resolve(URL.createObjectURL(req.result));
          else resolve(null);
        };
        req.onerror = () => resolve(null);
      });
    },
  };

  let state = {
    recipes: [],
    shopping: [],
    activeTab: "recetas",
    onlyFavs: false,
    selectedRecipeId: null,
    editingRecipeId: null,
    formState: null,
    supabase: null,
  };

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  }

  function getCloudConfig() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_CLOUD_KEY) || "null");
    } catch {
      return null;
    }
  }

  function initSupabase() {
    const cfg = getCloudConfig();
    const label = document.getElementById("storage-status-label");
    if (cfg?.url && cfg?.key && window.supabase) {
      state.supabase = window.supabase.createClient(cfg.url, cfg.key);
      label.textContent = "☁️ Nube Activa";
    } else {
      state.supabase = null;
      label.textContent = "💾 Local";
    }
  }

  async function loadData() {
    initSupabase();
    if (state.supabase) {
      const [{ data: rData }, { data: sData }] = await Promise.all([
        state.supabase.from("recipes").select("*").order("created_at", { ascending: false }),
        state.supabase.from("shopping_items").select("*").order("created_at", { ascending: false }),
      ]);
      if (rData) {
        state.recipes = rData.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description || "",
          calories: r.calories || 0,
          servings: r.servings || 1,
          prepTimeMinutes: r.prep_time_minutes || 15,
          mealTimes: r.meal_times || [],
          cookingMethods: r.cooking_methods || [],
          ingredients: r.ingredients || [],
          steps: r.steps || [],
          resources: r.resources || [],
          sourceUrl: r.source_url || "",
          isFavorite: Boolean(r.is_favorite),
          createdAt: r.created_at,
        }));
      }
      if (sData) {
        state.shopping = sData.map((s) => ({
          id: s.id,
          name: s.name,
          quantity: s.quantity,
          unit: s.unit,
          checked: s.checked,
          recipeTitle: s.recipe_title,
        }));
      }
    } else {
      const rawR = localStorage.getItem(STORAGE_RECIPES_KEY);
      if (rawR) {
        state.recipes = JSON.parse(rawR);
      } else {
        state.recipes = SEED_RECIPES;
        localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(state.recipes));
      }
      state.shopping = JSON.parse(localStorage.getItem(STORAGE_SHOPPING_KEY) || "[]");
    }
    render();
  }

  function saveLocalRecipes() {
    localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(state.recipes));
  }

  function saveLocalShopping() {
    localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(state.shopping));
  }

  function getYoutubeEmbed(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
        if (u.pathname.startsWith("/shorts/")) {
          return `https://www.youtube.com/embed/${u.pathname.split("/shorts/")[1].split("/")[0]}`;
        }
      }
      if (u.hostname === "youtu.be") {
        return `https://www.youtube.com/embed/${u.pathname.slice(1).split("/")[0]}`;
      }
    } catch {}
    return null;
  }

  function render() {
    document.getElementById("recipes-count").textContent = state.recipes.length;
    const pendingCount = state.shopping.filter((i) => !i.checked).length;
    document.getElementById("shopping-count").textContent = pendingCount;

    document.getElementById("view-recetas").classList.toggle("hidden", state.activeTab !== "recetas");
    document.getElementById("view-compras").classList.toggle("hidden", state.activeTab !== "compras");
    document.getElementById("tab-recetas").classList.toggle("active", state.activeTab === "recetas");
    document.getElementById("tab-compras").classList.toggle("active", state.activeTab === "compras");

    renderRecipes();
    renderShopping();
  }

  function renderRecipes() {
    const q = document.getElementById("filter-search").value.trim().toLowerCase();
    const meal = document.getElementById("filter-meal").value;
    const method = document.getElementById("filter-method").value;
    const kcal = document.getElementById("filter-kcal").value;

    const filtered = state.recipes.filter((r) => {
      if (state.onlyFavs && !r.isFavorite) return false;
      if (meal !== "todos" && !r.mealTimes.includes(meal)) return false;
      if (method !== "todos" && !r.cookingMethods.some((c) => c.method === method)) return false;
      if (kcal !== "todos" && r.calories > Number(kcal)) return false;
      if (q) {
        const match =
          r.title.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    document.getElementById("filter-summary").textContent = `Mostrando ${filtered.length} de ${state.recipes.length} recetas`;
    const hasFilters = q || meal !== "todos" || method !== "todos" || kcal !== "todos" || state.onlyFavs;
    document.getElementById("btn-clear-filters").classList.toggle("hidden", !hasFilters);

    const grid = document.getElementById("recipes-grid");
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No se encontraron recetas con esos filtros.</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((r) => {
        const mealsHtml = r.mealTimes
          .map((m) => `<span class="badge badge-meal">${MEAL_LABELS[m] || m}</span>`)
          .join("");
        const methodsHtml = r.cookingMethods
          .map((c) => {
            const info = METHOD_LABELS[c.method] || { short: c.method };
            const extra = [c.temperatureC ? `${c.temperatureC}°C` : "", c.timeMinutes ? `${c.timeMinutes}m` : ""]
              .filter(Boolean)
              .join(" · ");
            return `<span class="badge badge-method">${info.short}${extra ? " · " + extra : ""}</span>`;
          })
          .join("");

        const vCount = (r.resources || []).filter((x) => x.type === "video").length;
        const fCount = (r.resources || []).filter((x) => x.type === "archivo").length;
        const wCount = (r.resources || []).filter((x) => x.type === "web").length + (r.sourceUrl ? 1 : 0);

        return `
          <article class="recipe-card" data-id="${r.id}">
            <div>
              <div class="card-top">
                <div class="badges-row">${mealsHtml}</div>
                <button class="fav-btn" data-fav="${r.id}" type="button">${r.isFavorite ? "❤️" : "🤍"}</button>
              </div>
              <h3 class="recipe-title">${escapeHtml(r.title)}</h3>
              <p class="recipe-desc">${escapeHtml(r.description || "")}</p>
              <div class="badges-row">${methodsHtml}</div>
            </div>
            <div class="card-footer">
              <div>
                <span class="kcal-tag">🔥 ${r.calories} kcal</span> · ⏱️ ${r.prepTimeMinutes}m · 👥 ${r.servings}
              </div>
              <div>
                ${vCount ? `🎥 ${vCount} ` : ""}${fCount ? `📎 ${fCount} ` : ""}${wCount ? `🔗 ${wCount}` : ""}
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll(".recipe-card").forEach((el) => {
      el.addEventListener("click", (e) => {
        const favBtn = e.target.closest("[data-fav]");
        if (favBtn) {
          e.stopPropagation();
          toggleFavorite(favBtn.dataset.fav);
          return;
        }
        openDetailModal(el.dataset.id);
      });
    });
  }

  function renderShopping() {
    const pending = state.shopping.filter((i) => !i.checked);
    const checked = state.shopping.filter((i) => i.checked);
    document.getElementById("shopping-meta").textContent = `${pending.length} pendientes · ${checked.length} comprados`;
    document.getElementById("btn-clear-checked").classList.toggle("hidden", checked.length === 0);

    const listEl = document.getElementById("shopping-list");
    if (state.shopping.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Tu lista está vacía. Agrega productos o envíalos desde una receta.</div>`;
    } else {
      listEl.innerHTML = state.shopping
        .map(
          (item) => `
        <div class="shopping-item ${item.checked ? "checked" : ""}">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 1;">
            <input type="checkbox" data-toggle-shop="${item.id}" ${item.checked ? "checked" : ""} />
            <div>
              <strong>${item.quantity} ${escapeHtml(item.unit)}</strong> ${escapeHtml(item.name)}
              ${item.recipeTitle ? `<div style="font-size: 11px; color: var(--text-muted);">De: ${escapeHtml(item.recipeTitle)}</div>` : ""}
            </div>
          </label>
          <button class="btn btn-sm btn-danger" data-del-shop="${item.id}" type="button">✕</button>
        </div>`
        )
        .join("");
    }

    listEl.querySelectorAll("[data-toggle-shop]").forEach((cb) => {
      cb.addEventListener("change", () => toggleShopItem(cb.dataset.toggleShop));
    });
    listEl.querySelectorAll("[data-del-shop]").forEach((btn) => {
      btn.addEventListener("click", () => deleteShopItem(btn.dataset.delShop));
    });

    // Comparador demo de supermercados
    const offersEl = document.getElementById("supermarket-offers");
    const savingsEl = document.getElementById("supermarket-savings");
    if (pending.length === 0) {
      savingsEl.classList.add("hidden");
      offersEl.innerHTML = `<div class="empty-state">Agrega ingredientes pendientes para comparar precios estimados.</div>`;
      return;
    }

    const supers = [
      { name: "Supermercados Día", factor: 0.94, color: "#ea580c" },
      { name: "Carrefour", factor: 0.98, color: "#1d4ed8" },
      { name: "Coto", factor: 1.0, color: "#dc2626" },
      { name: "Jumbo", factor: 1.07, color: "#15803d" },
    ];

    const baseSum = pending.reduce((acc, item) => acc + 2100 * Math.max(1, Math.min(item.quantity, 3) * 0.5), 0);
    const offers = supers
      .map((s) => ({ ...s, total: Math.round(baseSum * s.factor) }))
      .sort((a, b) => a.total - b.total);

    const diff = offers[offers.length - 1].total - offers[0].total;
    savingsEl.classList.remove("hidden");
    savingsEl.innerHTML = `✨ Mejor opción estimada: <strong>${offers[0].name}</strong> (ahorro de <strong>$${diff.toLocaleString("es-AR")}</strong>).`;

    offersEl.innerHTML = offers
      .map(
        (o, idx) => `
      <div class="offer-card ${idx === 0 ? "best" : ""}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${o.color}; display: inline-block;"></span>
          <strong>${o.name}</strong>
          ${idx === 0 ? `<span class="badge" style="background: #059669; color: #fff;">Mejor precio</span>` : ""}
        </div>
        <strong>$${o.total.toLocaleString("es-AR")}</strong>
      </div>`
      )
      .join("");
  }

  async function toggleFavorite(id) {
    const r = state.recipes.find((x) => x.id === id);
    if (!r) return;
    r.isFavorite = !r.isFavorite;
    if (state.supabase) {
      await state.supabase.from("recipes").update({ is_favorite: r.isFavorite }).eq("id", id);
    } else {
      saveLocalRecipes();
    }
    if (state.selectedRecipeId === id) {
      document.getElementById("detail-fav").textContent = r.isFavorite ? "❤️" : "🤍";
    }
    renderRecipes();
  }

  async function openDetailModal(id) {
    const r = state.recipes.find((x) => x.id === id);
    if (!r) return;
    state.selectedRecipeId = id;
    let currentServings = r.servings || 1;

    document.getElementById("detail-title").textContent = r.title;
    document.getElementById("detail-fav").textContent = r.isFavorite ? "❤️" : "🤍";
    document.getElementById("detail-meals").innerHTML = r.mealTimes
      .map((m) => `<span class="badge badge-meal">${MEAL_LABELS[m] || m}</span>`)
      .join("");

    const renderDetailBody = async () => {
      const scale = currentServings / (r.servings || 1);
      const methodsHtml = r.cookingMethods
        .map((c) => {
          const info = METHOD_LABELS[c.method] || { label: c.method };
          return `<div class="metric-box">
            <strong>${info.label}</strong>
            <div style="font-size: 13px; margin-top: 4px;">
              ${c.temperatureC ? `${c.temperatureC}°C` : ""} ${c.timeMinutes ? `· ${c.timeMinutes} min` : ""}
            </div>
            ${c.notes ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${escapeHtml(c.notes)}</div>` : ""}
          </div>`;
        })
        .join("");

      const ingsHtml = r.ingredients
        .map(
          (i) => `<li style="margin-bottom: 6px;">
          <strong>${Number((i.quantity * scale).toFixed(2))} ${escapeHtml(i.unit)}</strong> ${escapeHtml(i.name)}
        </li>`
        )
        .join("");

      const stepsHtml = r.steps.map((s) => `<li style="margin-bottom: 6px;">${escapeHtml(s)}</li>`).join("");

      // Resolver recursos (incluyendo IndexedDB)
      const resourceBlocks = [];
      for (const res of r.resources || []) {
        let resolvedUrl = res.url;
        if (res.localBlobId) {
          resolvedUrl = (await MediaDB.getUrl(res.localBlobId)) || "";
        }
        if (res.type === "video") {
          const yt = getYoutubeEmbed(resolvedUrl);
          if (yt) {
            resourceBlocks.push(`<div class="section-box"><strong>🎥 ${escapeHtml(res.title)}</strong><iframe class="video-player" src="${yt}" allowfullscreen style="margin-top:8px;"></iframe></div>`);
          } else if (resolvedUrl) {
            resourceBlocks.push(`<div class="section-box"><strong>🎥 ${escapeHtml(res.title)}</strong><video class="video-player" src="${resolvedUrl}" controls style="margin-top:8px;"></video></div>`);
          }
        } else if (resolvedUrl) {
          resourceBlocks.push(`<a class="btn btn-sm" href="${resolvedUrl}" target="_blank" download="${escapeHtml(res.title)}">${res.type === "archivo" ? "📎" : "🔗"} ${escapeHtml(res.title)}</a>`);
        }
      }
      if (r.sourceUrl) {
        resourceBlocks.push(`<a class="btn btn-sm" href="${r.sourceUrl}" target="_blank">🌐 Página original</a>`);
      }

      document.getElementById("detail-body").innerHTML = `
        ${r.description ? `<p style="margin-top: 0; color: var(--text-muted);">${escapeHtml(r.description)}</p>` : ""}
        <div class="metrics-grid">
          <div class="metric-box">
            <div style="font-size: 12px; color: var(--text-muted);">Calorías / porción</div>
            <strong style="font-size: 18px; color: #ea580c;">${r.calories} kcal</strong>
            <div style="font-size: 11px; color: var(--text-muted);">Total: ${Math.round(r.calories * currentServings)} kcal</div>
          </div>
          <div class="metric-box">
            <div style="font-size: 12px; color: var(--text-muted);">Tiempo total</div>
            <strong style="font-size: 18px;">${r.prepTimeMinutes} min</strong>
          </div>
          <div class="metric-box" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px; color: var(--text-muted);">Porciones</div>
              <strong style="font-size: 18px;">${currentServings}</strong>
            </div>
            <div style="display: flex; gap: 4px;">
              <button id="srv-minus" class="btn btn-sm" type="button">-</button>
              <button id="srv-plus" class="btn btn-sm" type="button">+</button>
            </div>
          </div>
        </div>

        ${methodsHtml ? `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 16px;">${methodsHtml}</div>` : ""}

        <div class="two-col">
          <div class="section-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <strong>Ingredientes (${r.ingredients.length})</strong>
              <button id="btn-send-to-shop" class="btn btn-primary btn-sm" type="button">🛒 Todo a Compras</button>
            </div>
            <ul style="padding-left: 18px; margin: 0; font-size: 13px;">${ingsHtml || "<li>Sin ingredientes</li>"}</ul>
          </div>
          <div class="section-box">
            <strong style="display: block; margin-bottom: 10px;">Preparación</strong>
            <ol style="padding-left: 18px; margin: 0; font-size: 13px;">${stepsHtml || "<li>Sin pasos</li>"}</ol>
          </div>
        </div>

        ${resourceBlocks.length ? `<div style="margin-top: 16px; display: grid; gap: 10px;"><strong>Videos, Archivos y Enlaces</strong>${resourceBlocks.join("")}</div>` : ""}
      `;

      document.getElementById("srv-minus").onclick = () => {
        if (currentServings > 1) {
          currentServings--;
          renderDetailBody();
        }
      };
      document.getElementById("srv-plus").onclick = () => {
        currentServings++;
        renderDetailBody();
      };
      document.getElementById("btn-send-to-shop").onclick = async () => {
        const items = r.ingredients.map((i) => ({
          id: uid(),
          name: i.name,
          quantity: Number((i.quantity * scale).toFixed(2)),
          unit: i.unit,
          checked: false,
          recipeTitle: r.title,
        }));
        await addShoppingItems(items);
        document.getElementById("btn-send-to-shop").textContent = "✓ Agregados";
      };
    };

    await renderDetailBody();
    document.getElementById("modal-detail").classList.remove("hidden");
  }

  function openFormModal(recipe = null) {
    state.editingRecipeId = recipe ? recipe.id : null;
    document.getElementById("form-modal-title").textContent = recipe ? "Editar Receta" : "Nueva Receta";

    state.formState = {
      mealTimes: recipe ? [...recipe.mealTimes] : ["almuerzo"],
      cookingMethods: recipe ? JSON.parse(JSON.stringify(recipe.cookingMethods)) : [{ method: "freidora_aire", temperatureC: 180, timeMinutes: 15 }],
      ingredients: recipe ? JSON.parse(JSON.stringify(recipe.ingredients)) : [{ id: uid(), name: "", quantity: 1, unit: "g" }],
      steps: recipe && recipe.steps.length ? [...recipe.steps] : [""],
      resources: recipe ? JSON.parse(JSON.stringify(recipe.resources || [])) : [],
    };

    document.getElementById("f-title").value = recipe ? recipe.title : "";
    document.getElementById("f-desc").value = recipe ? recipe.description : "";
    document.getElementById("f-kcal").value = recipe ? recipe.calories : 350;
    document.getElementById("f-servings").value = recipe ? recipe.servings : 2;
    document.getElementById("f-time").value = recipe ? recipe.prepTimeMinutes : 20;
    document.getElementById("f-source").value = recipe ? recipe.sourceUrl || "" : "";

    renderFormDynamicParts();
    document.getElementById("modal-form").classList.remove("hidden");
  }

  function renderFormDynamicParts() {
    const fs = state.formState;

    // Momentos del día
    const mealsEl = document.getElementById("f-meals");
    mealsEl.innerHTML = Object.entries(MEAL_LABELS)
      .map(
        ([k, label]) =>
          `<button type="button" class="chip-btn ${fs.mealTimes.includes(k) ? "selected" : ""}" data-f-meal="${k}">${label}</button>`
      )
      .join("");
    mealsEl.querySelectorAll("[data-f-meal]").forEach((btn) => {
      btn.onclick = () => {
        const k = btn.dataset.fMeal;
        fs.mealTimes = fs.mealTimes.includes(k) ? fs.mealTimes.filter((x) => x !== k) : [...fs.mealTimes, k];
        renderFormDynamicParts();
      };
    });

    // Medios de cocción
    const methodsEl = document.getElementById("f-methods");
    methodsEl.innerHTML = Object.entries(METHOD_LABELS)
      .map(
        ([k, info]) =>
          `<button type="button" class="chip-btn ${fs.cookingMethods.some((c) => c.method === k) ? "selected" : ""}" data-f-method="${k}">${info.label}</button>`
      )
      .join("");
    methodsEl.querySelectorAll("[data-f-method]").forEach((btn) => {
      btn.onclick = () => {
        const k = btn.dataset.fMethod;
        if (fs.cookingMethods.some((c) => c.method === k)) {
          fs.cookingMethods = fs.cookingMethods.filter((c) => c.method !== k);
        } else {
          fs.cookingMethods.push({ method: k, temperatureC: METHOD_LABELS[k].defaultTemp, timeMinutes: 15, notes: "" });
        }
        renderFormDynamicParts();
      };
    });

    const detailsEl = document.getElementById("f-methods-details");
    detailsEl.innerHTML = fs.cookingMethods
      .map(
        (cm, idx) => `
      <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr 1.5fr; gap: 6px; background: var(--surface-alt); padding: 8px; border-radius: 10px;">
        <strong style="font-size: 12px; align-self: center;">${METHOD_LABELS[cm.method].label}</strong>
        <input class="input" type="number" placeholder="°C" value="${cm.temperatureC || ""}" data-cm-temp="${idx}" />
        <input class="input" type="number" placeholder="Min" value="${cm.timeMinutes || ""}" data-cm-min="${idx}" />
        <input class="input" type="text" placeholder="Nota" value="${escapeHtml(cm.notes || "")}" data-cm-note="${idx}" />
      </div>`
      )
      .join("");
    detailsEl.querySelectorAll("[data-cm-temp]").forEach((inp) => {
      inp.oninput = () => (fs.cookingMethods[inp.dataset.cmTemp].temperatureC = inp.value ? Number(inp.value) : undefined);
    });
    detailsEl.querySelectorAll("[data-cm-min]").forEach((inp) => {
      inp.oninput = () => (fs.cookingMethods[inp.dataset.cmMin].timeMinutes = inp.value ? Number(inp.value) : undefined);
    });
    detailsEl.querySelectorAll("[data-cm-note]").forEach((inp) => {
      inp.oninput = () => (fs.cookingMethods[inp.dataset.cmNote].notes = inp.value);
    });

    // Ingredientes
    const ingEl = document.getElementById("f-ingredients");
    ingEl.innerHTML = fs.ingredients
      .map(
        (ing, idx) => `
      <div style="display: grid; grid-template-columns: 3fr 1fr 1.3fr auto; gap: 6px;">
        <input class="input" type="text" placeholder="Ingrediente" value="${escapeHtml(ing.name)}" data-ing-name="${idx}" />
        <input class="input" type="number" step="any" value="${ing.quantity}" data-ing-qty="${idx}" />
        <input class="input" type="text" placeholder="Unidad" value="${escapeHtml(ing.unit)}" data-ing-unit="${idx}" />
        <button class="btn btn-sm btn-danger" type="button" data-ing-del="${idx}">✕</button>
      </div>`
      )
      .join("");
    ingEl.querySelectorAll("[data-ing-name]").forEach((i) => (i.oninput = () => (fs.ingredients[i.dataset.ingName].name = i.value)));
    ingEl.querySelectorAll("[data-ing-qty]").forEach((i) => (i.oninput = () => (fs.ingredients[i.dataset.ingQty].quantity = Number(i.value))));
    ingEl.querySelectorAll("[data-ing-unit]").forEach((i) => (i.oninput = () => (fs.ingredients[i.dataset.ingUnit].unit = i.value)));
    ingEl.querySelectorAll("[data-ing-del]").forEach((b) => {
      b.onclick = () => {
        fs.ingredients.splice(Number(b.dataset.ingDel), 1);
        renderFormDynamicParts();
      };
    });

    // Pasos
    const stepsEl = document.getElementById("f-steps");
    stepsEl.innerHTML = fs.steps
      .map(
        (s, idx) => `
      <div style="display: flex; gap: 6px; align-items: center;">
        <span style="font-size: 12px; font-weight: 700;">${idx + 1}.</span>
        <input class="input" type="text" value="${escapeHtml(s)}" data-step-idx="${idx}" placeholder="Describe el paso..." />
        <button class="btn btn-sm btn-danger" type="button" data-step-del="${idx}">✕</button>
      </div>`
      )
      .join("");
    stepsEl.querySelectorAll("[data-step-idx]").forEach((i) => (i.oninput = () => (fs.steps[i.dataset.stepIdx] = i.value)));
    stepsEl.querySelectorAll("[data-step-del]").forEach((b) => {
      b.onclick = () => {
        fs.steps.splice(Number(b.dataset.stepDel), 1);
        renderFormDynamicParts();
      };
    });

    // Recursos
    const resEl = document.getElementById("f-resources");
    resEl.innerHTML = fs.resources
      .map(
        (r, idx) => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--border); font-size: 12px;">
        <span>${r.type === "video" ? "🎥" : r.type === "archivo" ? "📎" : "🔗"} ${escapeHtml(r.title)}</span>
        <button class="btn btn-sm btn-danger" type="button" data-res-del="${idx}">✕</button>
      </div>`
      )
      .join("");
    resEl.querySelectorAll("[data-res-del]").forEach((b) => {
      b.onclick = () => {
        fs.resources.splice(Number(b.dataset.resDel), 1);
        renderFormDynamicParts();
      };
    });
  }

  async function addShoppingItems(newItems) {
    if (state.supabase) {
      const rows = newItems.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        checked: false,
        recipe_title: i.recipeTitle || null,
      }));
      await state.supabase.from("shopping_items").insert(rows);
    } else {
      state.shopping.unshift(...newItems);
      saveLocalShopping();
    }
    state.shopping = state.supabase ? (await state.supabase.from("shopping_items").select("*").order("created_at", { ascending: false })).data || state.shopping : state.shopping;
    render();
  }

  async function toggleShopItem(id) {
    const item = state.shopping.find((i) => i.id === id);
    if (!item) return;
    item.checked = !item.checked;
    if (state.supabase) {
      await state.supabase.from("shopping_items").update({ checked: item.checked }).eq("id", id);
    } else {
      saveLocalShopping();
    }
    renderShopping();
    document.getElementById("shopping-count").textContent = state.shopping.filter((i) => !i.checked).length;
  }

  async function deleteShopItem(id) {
    state.shopping = state.shopping.filter((i) => i.id !== id);
    if (state.supabase) {
      await state.supabase.from("shopping_items").delete().eq("id", id);
    } else {
      saveLocalShopping();
    }
    render();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Event Listeners
  document.getElementById("tab-recetas").onclick = () => {
    state.activeTab = "recetas";
    render();
  };
  document.getElementById("tab-compras").onclick = () => {
    state.activeTab = "compras";
    render();
  };

  ["filter-search", "filter-meal", "filter-method", "filter-kcal"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderRecipes);
  });

  document.getElementById("filter-fav").onclick = (e) => {
    state.onlyFavs = !state.onlyFavs;
    e.currentTarget.classList.toggle("active", state.onlyFavs);
    renderRecipes();
  };

  document.getElementById("btn-clear-filters").onclick = () => {
    document.getElementById("filter-search").value = "";
    document.getElementById("filter-meal").value = "todos";
    document.getElementById("filter-method").value = "todos";
    document.getElementById("filter-kcal").value = "todos";
    state.onlyFavs = false;
    document.getElementById("filter-fav").classList.remove("active");
    renderRecipes();
  };

  document.getElementById("btn-new-recipe").onclick = () => openFormModal(null);
  document.getElementById("form-close").onclick = () => document.getElementById("modal-form").classList.add("hidden");
  document.getElementById("form-cancel").onclick = () => document.getElementById("modal-form").classList.add("hidden");
  document.getElementById("detail-close").onclick = () => document.getElementById("modal-detail").classList.add("hidden");
  document.getElementById("detail-fav").onclick = () => toggleFavorite(state.selectedRecipeId);
  document.getElementById("detail-edit").onclick = () => {
    const r = state.recipes.find((x) => x.id === state.selectedRecipeId);
    document.getElementById("modal-detail").classList.add("hidden");
    if (r) openFormModal(r);
  };
  document.getElementById("detail-delete").onclick = async () => {
    const id = state.selectedRecipeId;
    state.recipes = state.recipes.filter((x) => x.id !== id);
    if (state.supabase) {
      await state.supabase.from("recipes").delete().eq("id", id);
    } else {
      saveLocalRecipes();
    }
    document.getElementById("modal-detail").classList.add("hidden");
    render();
  };

  document.getElementById("btn-add-ing").onclick = () => {
    state.formState.ingredients.push({ id: uid(), name: "", quantity: 1, unit: "g" });
    renderFormDynamicParts();
  };
  document.getElementById("btn-add-step").onclick = () => {
    state.formState.steps.push("");
    renderFormDynamicParts();
  };
  document.getElementById("btn-add-link").onclick = () => {
    const type = document.getElementById("f-link-type").value;
    const title = document.getElementById("f-link-title").value.trim();
    const url = document.getElementById("f-link-url").value.trim();
    if (!url) return;
    state.formState.resources.push({ id: uid(), type, title: title || url, url });
    document.getElementById("f-link-title").value = "";
    document.getElementById("f-link-url").value = "";
    renderFormDynamicParts();
  };

  document.getElementById("f-file-upload").onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    if (state.supabase) {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await state.supabase.storage.from("recipe-media").upload(path, file);
      if (!error) {
        const { data } = state.supabase.storage.from("recipe-media").getPublicUrl(path);
        state.formState.resources.push({ id: uid(), type: isVideo ? "video" : "archivo", title: file.name, url: data.publicUrl });
      }
    } else {
      const blobId = uid();
      await MediaDB.save(blobId, file);
      state.formState.resources.push({ id: uid(), type: isVideo ? "video" : "archivo", title: file.name, url: "", localBlobId: blobId });
    }
    e.target.value = "";
    renderFormDynamicParts();
  };

  document.getElementById("recipe-form").onsubmit = async (e) => {
    e.preventDefault();
    const fs = state.formState;
    const payload = {
      id: state.editingRecipeId || uid(),
      title: document.getElementById("f-title").value.trim(),
      description: document.getElementById("f-desc").value.trim(),
      calories: Number(document.getElementById("f-kcal").value) || 0,
      servings: Math.max(1, Number(document.getElementById("f-servings").value) || 1),
      prepTimeMinutes: Math.max(1, Number(document.getElementById("f-time").value) || 15),
      sourceUrl: document.getElementById("f-source").value.trim(),
      mealTimes: fs.mealTimes,
      cookingMethods: fs.cookingMethods,
      ingredients: fs.ingredients.filter((i) => i.name.trim()),
      steps: fs.steps.map((s) => s.trim()).filter(Boolean),
      resources: fs.resources,
      isFavorite: state.editingRecipeId
        ? state.recipes.find((x) => x.id === state.editingRecipeId)?.isFavorite || false
        : false,
      createdAt: new Date().toISOString(),
    };

    if (state.supabase) {
      const dbRow = {
        id: payload.id,
        title: payload.title,
        description: payload.description,
        calories: payload.calories,
        servings: payload.servings,
        prep_time_minutes: payload.prepTimeMinutes,
        meal_times: payload.mealTimes,
        cooking_methods: payload.cookingMethods,
        ingredients: payload.ingredients,
        steps: payload.steps,
        resources: payload.resources,
        source_url: payload.sourceUrl || null,
        is_favorite: payload.isFavorite,
      };
      if (state.editingRecipeId) {
        await state.supabase.from("recipes").update(dbRow).eq("id", payload.id);
      } else {
        await state.supabase.from("recipes").insert(dbRow);
      }
    }

    if (state.editingRecipeId) {
      state.recipes = state.recipes.map((r) => (r.id === payload.id ? payload : r));
    } else {
      state.recipes.unshift(payload);
    }
    if (!state.supabase) saveLocalRecipes();
    document.getElementById("modal-form").classList.add("hidden");
    render();
  };

  document.getElementById("shopping-form").onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("shop-name").value.trim();
    if (!name) return;
    await addShoppingItems([
      {
        id: uid(),
        name,
        quantity: Number(document.getElementById("shop-qty").value) || 1,
        unit: document.getElementById("shop-unit").value.trim() || "unidad",
        checked: false,
      },
    ]);
    document.getElementById("shop-name").value = "";
  };

  document.getElementById("btn-clear-checked").onclick = async () => {
    state.shopping = state.shopping.filter((i) => !i.checked);
    if (state.supabase) {
      await state.supabase.from("shopping_items").delete().eq("checked", true);
    } else {
      saveLocalShopping();
    }
    render();
  };

  // Cloud & Export/Import
  document.getElementById("btn-cloud").onclick = () => {
    const cfg = getCloudConfig();
    document.getElementById("cfg-sb-url").value = cfg?.url || "";
    document.getElementById("cfg-sb-key").value = cfg?.key || "";
    document.getElementById("modal-cloud").classList.remove("hidden");
  };
  document.getElementById("cloud-close").onclick = () => document.getElementById("modal-cloud").classList.add("hidden");
  document.getElementById("btn-save-cloud").onclick = () => {
    const url = document.getElementById("cfg-sb-url").value.trim();
    const key = document.getElementById("cfg-sb-key").value.trim();
    if (url && key) {
      localStorage.setItem(STORAGE_CLOUD_KEY, JSON.stringify({ url, key }));
      document.getElementById("modal-cloud").classList.add("hidden");
      loadData();
    }
  };
  document.getElementById("btn-clear-cloud").onclick = () => {
    localStorage.removeItem(STORAGE_CLOUD_KEY);
    document.getElementById("modal-cloud").classList.add("hidden");
    loadData();
  };
  document.getElementById("btn-export-json").onclick = () => {
    const blob = new Blob([JSON.stringify({ recipes: state.recipes, shopping: state.shopping }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mirecetario-respaldo.json";
    a.click();
  };
  document.getElementById("btn-import-json").onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data.recipes)) {
      state.recipes = data.recipes;
      saveLocalRecipes();
    }
    if (Array.isArray(data.shopping)) {
      state.shopping = data.shopping;
      saveLocalShopping();
    }
    document.getElementById("modal-cloud").classList.add("hidden");
    render();
  };

  loadData();
})();
