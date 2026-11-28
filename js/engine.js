window.CB_ENGINE = (() => {
  const { RECIPES, MOMENTS_ORDER, MOMENT_LABELS, FOOD_GROUP_META } = window.CB_DATA;

  function isRecipeCompatible(recipe, profile) {
    const pattern = (profile.dietPattern || 'equilibrada').toLowerCase();
    const restrictions = (profile.restrictions || []).map((r) => r.toLowerCase());
    const has = (kw) => restrictions.some((r) => r.includes(kw));

    if (pattern === 'sin_gluten' || has('gluten') || has('celiaqu')) {
      if (recipe.allergens.includes('gluten')) return false;
    }
    if (pattern === 'sin_lactosa' || has('lactosa') || has('lácteo') || has('lacteo')) {
      if (recipe.allergens.includes('lactosa')) return false;
    }
    if (has('huevo') && recipe.allergens.includes('huevo')) return false;
    if ((has('pescado') || has('marisco')) && recipe.allergens.includes('pescado')) return false;
    if ((has('frutos secos') || has('maní') || has('mani')) && recipe.allergens.includes('frutos_secos')) return false;

    if (pattern === 'bajo_sodio' || has('sodio') || has('hipertens')) {
      const hasCanned = recipe.ingredients.some((i) => /lata|enlatad|fiambre|jamón|panceta/i.test(i.name));
      if (hasCanned) return false;
    }

    if (pattern === 'vegana' || has('vegano')) {
      if (
        recipe.foodGroups.includes('proteinas_animales') ||
        recipe.foodGroups.includes('lacteos') ||
        recipe.allergens.includes('huevo') ||
        recipe.allergens.includes('lactosa') ||
        recipe.allergens.includes('pescado')
      ) {
        return false;
      }
    } else if (pattern === 'vegetariana' || has('vegetariano')) {
      const meatOrFish = recipe.ingredients.some((i) =>
        /pollo|carne|merluza|brótola|atún|pescado|cerdo|jamón/i.test(i.name)
      );
      if (meatOrFish) return false;
    }
    return true;
  }

  function generateWeeklyMenu(profile) {
    const compatible = RECIPES.filter((r) => isRecipeCompatible(r, profile));
    const poolSource = compatible.length >= 4 ? compatible : RECIPES;
    const slots = [];
    const tightBudget = (profile.weeklyBudgetUyu || 3500) / Math.max(1, profile.householdSize || 1) < 2500;

    for (const moment of MOMENTS_ORDER) {
      let pool = poolSource.filter((r) => r.moment === moment);
      if (pool.length === 0) pool = poolSource;
      pool = tightBudget
        ? [...pool].sort((a, b) => a.estimatedCostUyu - b.estimatedCostUyu)
        : [...pool].sort(() => Math.random() - 0.5);

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const chosen = pool[dayIndex % pool.length];
        slots.push({
          dayIndex,
          moment,
          recipeId: chosen.id,
          customTitle: null,
          servings: profile.householdSize || 2,
          status: 'planned',
        });
      }
    }
    return slots.sort((a, b) => a.dayIndex - b.dayIndex);
  }

  function getTodayDayIndex() {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }

  function getCurrentUruguaySeason(date = new Date()) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    if ((m === 12 && d >= 21) || m === 1 || m === 2 || (m === 3 && d < 21)) {
      return { key: 'verano', emoji: '☀️', label: 'Verano' };
    }
    if ((m === 3 && d >= 21) || m === 4 || m === 5 || (m === 6 && d < 21)) {
      return { key: 'otono', emoji: '🍂', label: 'Otoño' };
    }
    if ((m === 6 && d >= 21) || m === 7 || m === 8 || (m === 9 && d < 21)) {
      return { key: 'invierno', emoji: '❄️', label: 'Invierno' };
    }
    return { key: 'primavera', emoji: '🌸', label: 'Primavera' };
  }

  function getRecipeSeasonScore(recipe, seasonKey) {
    const txt = `${recipe.title || ''} ${recipe.description || ''} ${(recipe.tags || []).join(' ')} ${(recipe.ingredients || []).map((i) => i.name || '').join(' ')}`.toLowerCase();
    const coldRe = /(ensalada|gazpacho|licuado|smoothie|helad|fr[ií]o|fresc|palta|sand[ií]a|mel[oó]n|frutilla|ceviche|wrap|tostada|yogur|hummus)/;
    const warmRe = /(guiso|sopa|cazuela|estofado|puchero|locro|lentejas|polenta|caldo|crema de|al horno|lasa[ñn]a|pastel de|chocolate caliente|avena tibia)/;
    const isCold = coldRe.test(txt);
    const isWarm = warmRe.test(txt);

    if (seasonKey === 'verano') return isCold ? 2 : isWarm ? 0 : 1;
    if (seasonKey === 'invierno') return isWarm ? 2 : isCold ? 0 : 1;
    if (seasonKey === 'primavera') return isCold ? 2 : isWarm ? 1 : 2;
    // otoño
    return isWarm ? 2 : isCold ? 1 : 2;
  }

  function matchesActiveDiet(recipe, profile) {
    if (!isRecipeCompatible(recipe, profile)) return false;
    const dietKey = profile?.dietPattern;
    if (!dietKey || dietKey === 'equilibrada' || dietKey === 'balanced') return true;
    const mapToMediaKey = {
      sin_tacc: 'sin_gluten',
      sin_gluten: 'sin_gluten',
      vegetariana: 'vegetariana',
      vegana: 'vegana',
      sin_lactosa: 'sin_lactosa',
      sin_azucar: 'sin_azucar',
      bajo_sodio: 'bajo_sodio',
      keto: 'keto',
      deficit: 'deficit',
      masa_muscular: 'muscle',
      muscle: 'muscle',
      colesterol: 'colesterol',
      digestiva: 'digestiva',
      sin_huevo: 'sin_huevo',
      alta_proteina: 'alta_proteina',
      rica_fibra: 'rica_fibra',
      familiar: 'familiar',
      higado_graso: 'higado_graso',
      baja_fodmap: 'baja_fodmap',
    };
    const mediaKey = mapToMediaKey[dietKey] || dietKey;
    if (typeof getRecipeNutritionAndMedia === 'function' && typeof evaluateDietCompatibility === 'function') {
      try {
        const fakeRadial = {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          servings: recipe.servings || 2,
          ingredients: (recipe.ingredients || []).map((i) => ({
            amount: i.amount || 1,
            unit: i.unit || 'u',
            item: i.name || i.item || '',
          })),
        };
        const base = getRecipeNutritionAndMedia(fakeRadial);
        const adapt =
          typeof adaptRecipeIngredientsForDiet === 'function'
            ? adaptRecipeIngredientsForDiet(fakeRadial, mediaKey, null, false)
            : null;
        const ev = evaluateDietCompatibility(base.nutrition, mediaKey, false, adapt);
        return ev.status === 'optimal' || ev.status === 'good';
      } catch {
        return true;
      }
    }
    return true;
  }

  function analyzeDayAndSuggest(todayLogs, todaySlots, profile, disabledMoments = [], dayWord = 'hoy') {
    const coveredSet = new Set();
    const plannedByMoment = {};
    const foodGroupSet = new Set();
    let eatenCount = 0;

    for (const log of todayLogs) {
      coveredSet.add(log.moment);
      if (!plannedByMoment[log.moment]) {
        const rec = log.recipeId ? RECIPES.find((r) => r.id === log.recipeId) : null;
        plannedByMoment[log.moment] = { status: log.status, recipe: rec, title: log.title };
      }
      if (log.status === 'eaten') eatenCount++;
      (log.foodGroups || []).forEach((fg) => foodGroupSet.add(fg));
    }

    for (const slot of todaySlots) {
      if (slot.status !== 'skipped' && (slot.recipeId || slot.customTitle)) {
        const rec = slot.recipeId ? RECIPES.find((r) => r.id === slot.recipeId) : null;
        if (!coveredSet.has(slot.moment)) {
          coveredSet.add(slot.moment);
          if (slot.status === 'eaten') eatenCount++;
        }
        if (!plannedByMoment[slot.moment]) {
          plannedByMoment[slot.moment] = { status: slot.status || 'planned', recipe: rec, title: slot.customTitle || rec?.title };
        }
        rec?.foodGroups.forEach((fg) => foodGroupSet.add(fg));
      }
    }

    const coveredMoments = MOMENTS_ORDER.filter((m) => coveredSet.has(m));
    const availableMoments = MOMENTS_ORDER.filter((m) => !disabledMoments.includes(m));
    const missingMoments = availableMoments.filter((m) => !coveredSet.has(m));
    const priorityGroups = ['verduras', 'frutas', 'legumbres', 'cereales_tuberculos'];
    const missingKeyGroups = priorityGroups.filter((fg) => !foodGroupSet.has(fg));

    const season = getCurrentUruguaySeason();
    const dietCompatible = RECIPES.filter((r) => matchesActiveDiet(r, profile));
    const compatible = dietCompatible.length > 0 ? dietCompatible : RECIPES.filter((r) => isRecipeCompatible(r, profile));
    const pool = compatible.length > 0 ? compatible : RECIPES;

    const suggestions = availableMoments.map((moment) => {
      const mPool = pool.filter((r) => r.moment === moment);
      const seasonalPool = mPool.filter((r) => getRecipeSeasonScore(r, season.key) > 0);
      const finalPool = seasonalPool.length >= 3 ? seasonalPool : mPool;
      const scored = [...finalPool].sort((a, b) => {
        const aSeason = getRecipeSeasonScore(a, season.key);
        const bSeason = getRecipeSeasonScore(b, season.key);
        const aS = a.foodGroups.filter((g) => missingKeyGroups.includes(g)).length;
        const bS = b.foodGroups.filter((g) => missingKeyGroups.includes(g)).length;
        return bSeason - aSeason || bS - aS || a.estimatedCostUyu - b.estimatedCostUyu;
      });
      const plannedInfo = plannedByMoment[moment] || null;
      const rec = scored[0] || null;
      const missingNames = missingKeyGroups
        .slice(0, 2)
        .map((g) => FOOD_GROUP_META[g].shortLabel.toLowerCase())
        .join(' y ');

      return {
        moment,
        recipe: rec,
        candidates: scored.slice(0, 15),
        plannedInfo,
        isPlanned: Boolean(plannedInfo),
        season,
        reason: plannedInfo
          ? `Ya tenés planificado este momento para ${dayWord}. Podés dejarlo o tocar Cambiar para ver otra idea de ${season.label.toLowerCase()}.`
          : missingNames
          ? `Ideal para ${season.label.toLowerCase()}: suma ${missingNames} y respeta tu dieta.`
          : `Opción de ${season.label.toLowerCase()} compatible con tu dieta para tu ${MOMENT_LABELS[moment].label.toLowerCase()} de ${dayWord}.`,
      };
    });

    let headline = dayWord === 'mañana' ? '¡Mañana completa y variada!' : '¡Día completo y variado!';
    let encouragement =
      dayWord === 'mañana'
        ? 'Ya dejaste organizados los cuatro momentos de mañana.'
        : 'Tenés los momentos disponibles cubiertos. Recordá tomar agua durante la jornada.';

    if (missingMoments.length > 0) {
      const list = missingMoments.map((m) => MOMENT_LABELS[m].label.toLowerCase()).join(', ');
      headline = `Para ${dayWord} te falta: ${list}`;
      if (missingKeyGroups.length > 0) {
        const grp = missingKeyGroups.slice(0, 2).map((g) => FOOD_GROUP_META[g].shortLabel.toLowerCase()).join(' y ');
        encouragement = `Para sumar variedad ${dayWord}, vendría bárbaro incorporar ${grp}.`;
      }
    }

    return {
      coveredMoments,
      missingMoments,
      eatenCount,
      suggestions,
      headline,
      encouragement,
    };
  }

  function getRecipeMarketInfo(recipe, servings = recipe.servings, chainId = null) {
    const mult = Math.max(1, servings || recipe.servings || 1) / Math.max(1, recipe.servings || 1);
    if (typeof window.estimateRecipeSupermarketSummary === 'function') {
      const info = window.estimateRecipeSupermarketSummary(recipe, mult, chainId);
      return {
        costUyu: info.cheapestTotalUYU,
        chainName: info.cheapestChainName,
        chainId: info.cheapestChainId,
      };
    }
    return {
      costUyu: Math.round((recipe.estimatedCostUyu || 150) * mult),
      chainName: 'Estimado',
      chainId: null,
    };
  }

  function buildShoppingListFromMenu(slots, preferredChainId = null) {
    const map = new Map();
    for (const slot of slots) {
      if (slot.status === 'skipped' || !slot.recipeId) continue;
      const recipe = RECIPES.find((r) => r.id === slot.recipeId);
      if (!recipe) continue;

      const factor = (slot.servings || 2) / Math.max(1, recipe.servings);

      for (const ing of recipe.ingredients) {
        const key = `${ing.name.toLowerCase()}__${ing.unit.toLowerCase()}`;
        const qty = Math.round(ing.amount * factor * 10) / 10;
        if (map.has(key)) {
          const ex = map.get(key);
          ex.quantity = Math.round((ex.quantity + qty) * 10) / 10;
        } else {
          map.set(key, {
            id: 'menu-' + key,
            name: ing.name,
            quantity: qty,
            unit: ing.unit,
            category: ing.category,
            estimatedUyu: 0,
            checked: false,
            fromMenu: true,
          });
        }
      }
    }

    return Array.from(map.values()).map((item) => {
      if (typeof window.estimateItemSupermarketUYU === 'function') {
        const est = window.estimateItemSupermarketUYU(item.name, item.quantity, item.unit, preferredChainId);
        return {
          ...item,
          estimatedUyu: est.priceUYU,
          chainName: est.chainName,
          gondolaUrl: est.gondolaUrl,
        };
      }
      return { ...item, estimatedUyu: 50 };
    });
  }

  return {
    isRecipeCompatible,
    generateWeeklyMenu,
    getTodayDayIndex,
    analyzeDayAndSuggest,
    getRecipeMarketInfo,
    buildShoppingListFromMenu,
  };
})();
