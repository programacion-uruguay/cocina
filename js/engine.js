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

  function analyzeDayAndSuggest(todayLogs, todaySlots, profile, disabledMoments = [], dayWord = 'hoy') {
    const coveredSet = new Set();
    const foodGroupSet = new Set();
    let eatenCount = 0;

    for (const log of todayLogs) {
      coveredSet.add(log.moment);
      if (log.status === 'eaten') eatenCount++;
      (log.foodGroups || []).forEach((fg) => foodGroupSet.add(fg));
    }

    for (const slot of todaySlots) {
      if (slot.status !== 'skipped' && (slot.recipeId || slot.customTitle)) {
        if (!coveredSet.has(slot.moment)) {
          coveredSet.add(slot.moment);
          if (slot.status === 'eaten') eatenCount++;
        }
        if (slot.recipeId) {
          const rec = RECIPES.find((r) => r.id === slot.recipeId);
          rec?.foodGroups.forEach((fg) => foodGroupSet.add(fg));
        }
      }
    }

    const coveredMoments = MOMENTS_ORDER.filter((m) => coveredSet.has(m));
    const missingMoments = MOMENTS_ORDER.filter((m) => !coveredSet.has(m) && !disabledMoments.includes(m));
    const priorityGroups = ['verduras', 'frutas', 'legumbres', 'cereales_tuberculos'];
    const missingKeyGroups = priorityGroups.filter((fg) => !foodGroupSet.has(fg));

    const compatible = RECIPES.filter((r) => isRecipeCompatible(r, profile));
    const pool = compatible.length > 0 ? compatible : RECIPES;

    const suggestions = missingMoments.map((moment) => {
      const mPool = pool.filter((r) => r.moment === moment);
      const scored = [...mPool].sort((a, b) => {
        const aS = a.foodGroups.filter((g) => missingKeyGroups.includes(g)).length;
        const bS = b.foodGroups.filter((g) => missingKeyGroups.includes(g)).length;
        return bS - aS || a.estimatedCostUyu - b.estimatedCostUyu;
      });
      const rec = scored[0] || null;
      const missingNames = missingKeyGroups
        .slice(0, 2)
        .map((g) => FOOD_GROUP_META[g].shortLabel.toLowerCase())
        .join(' y ');

      return {
        moment,
        recipe: rec,
        reason: missingNames
          ? `Te falta el ${MOMENT_LABELS[moment].label.toLowerCase()} de ${dayWord}. Esta opción suma ${missingNames} y respeta tu perfil.`
          : `Completá tu ${MOMENT_LABELS[moment].label.toLowerCase()} de ${dayWord} con una opción práctica.`,
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
