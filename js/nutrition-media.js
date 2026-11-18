/**
 * Módulo de Control de Calorías, Dietas y Estudio Multimedia (Fotos y Videos).
 * Provee metas diarias por objetivo, macros por receta, compatibilidad dietética
 * y galería visual / soporte de video por capítulos + carga personalizada.
 */

const DIET_PLANS = {
  balanced: {
    key: "balanced",
    label: "Equilibrada",
    shortLabel: "Equilibrada (2000 kcal)",
    kcal: 2000,
    proteinG: 100,
    carbsG: 240,
    fatG: 65,
    description: "Distribución armónica de energía para mantenimiento diario."
  },
  deficit: {
    key: "deficit",
    label: "Déficit calórico",
    shortLabel: "Déficit (1600 kcal)",
    kcal: 1600,
    proteinG: 110,
    carbsG: 150,
    fatG: 50,
    description: "Prioriza platos livianos con alta saciedad y calorías controladas."
  },
  muscle: {
    key: "muscle",
    label: "Masa muscular",
    shortLabel: "Masa muscular (2500 kcal)",
    kcal: 2500,
    proteinG: 165,
    carbsG: 290,
    fatG: 75,
    description: "Enfocada en alcanzar alto aporte proteico y energía sostenida."
  },
  keto: {
    key: "keto",
    label: "Keto / Low-Carb",
    shortLabel: "Keto / Low-Carb (≤40g carb)",
    kcal: 1850,
    proteinG: 120,
    carbsG: 40,
    fatG: 135,
    description: "Control estricto de carbohidratos priorizando grasas saludables y proteínas."
  }
};

// Valores nutricionales estimados POR PORCIÓN base de cada receta
const RECIPE_NUTRITION_DATA = {
  "freidora-pollo-crujiente": {
    kcal: 335, protein: 46, carbs: 14, fat: 10, fiber: 2,
    dietTags: ["Alta en proteína", "Fit", "Baja en grasa"],
    lightTip: "Reemplazá el pan rallado por avena extra fina o salvado y usá rocío vegetal."
  },
  "freidora-papas-rusticas": {
    kcal: 245, protein: 5, carbs: 42, fat: 7, fiber: 5,
    dietTags: ["Vegana", "Sin TACC", "Económica"],
    lightTip: "Reducí el aceite a 1 cdta con pulverizador para bajar ~60 kcal por porción."
  },
  "freidora-salmon-limon": {
    kcal: 365, protein: 37, carbs: 2, fat: 23, fiber: 0,
    dietTags: ["Alta en proteína", "Keto / Low-Carb", "Sin TACC", "Omega-3"],
    lightTip: "Omití la cucharadita de aceite adicional; el salmón ya aporta grasas saludables."
  },
  "freidora-tostada-huevo": {
    kcal: 415, protein: 26, carbs: 28, fat: 22, fiber: 4,
    dietTags: ["Vegetariana", "Rica en proteína", "Express"],
    lightTip: "Usá queso magro rallado y 1 sola rebanada de pan integral finita."
  },
  "freidora-manzanas-canela": {
    kcal: 98, protein: 1, carbs: 25, fat: 0, fiber: 4,
    dietTags: ["Vegana", "Sin TACC", "Baja en calorías", "Sin azúcar añadido"],
    lightTip: "Ya es naturalmente ultra liviana; acompañala con 1 cda de yogur descremado."
  },
  "horno-pollo-limon": {
    kcal: 340, protein: 30, carbs: 3, fat: 23, fiber: 1,
    dietTags: ["Alta en proteína", "Keto / Low-Carb", "Sin TACC"],
    lightTip: "Retirá la piel del muslo antes de hornear y usá solo 1 cda de aceite."
  },
  "horno-lasagna-verduras": {
    kcal: 445, protein: 24, carbs: 46, fat: 18, fiber: 5,
    dietTags: ["Vegetariana", "Rica en calcio"],
    lightTip: "Elegí ricota magra y mozzarella light o intercalá láminas de zucchini."
  },
  "horno-budin-banana": {
    kcal: 195, protein: 6, carbs: 34, fat: 4, fiber: 4,
    dietTags: ["Vegetariana", "Sin azúcar refinada", "Snack saludable"],
    lightTip: "Aportá volumen batiendo las claras aparte y serví porciones finas."
  },
  "horno-colita-cuadril": {
    kcal: 430, protein: 48, carbs: 2, fat: 25, fiber: 0,
    dietTags: ["Alta en proteína", "Keto / Low-Carb", "Sin TACC"],
    lightTip: "Recortá la grasa externa visible de la colita y pincelá solo con 1 cda de aceite."
  },
  "cocina-arroz-pollo": {
    kcal: 425, protein: 28, carbs: 61, fat: 7, fiber: 3,
    dietTags: ["Sin TACC", "Energética", "Económica"],
    lightTip: "Aumentá la proporción de morrón/cebolla y ajustá el arroz a 60 g por persona."
  },
  "cocina-pasta-ajo-oliva": {
    kcal: 510, protein: 13, carbs: 72, fat: 19, fiber: 3,
    dietTags: ["Vegana", "Vegetariana", "Express"],
    lightTip: "Usá 1.5 cdas de aceite de oliva emulsionado con más agua de cocción y sumá brócoli."
  },
  "cocina-revuelto-zapallitos": {
    kcal: 205, protein: 13, carbs: 9, fat: 13, fiber: 3,
    dietTags: ["Vegetariana", "Low-Carb", "Sin TACC", "Baja en calorías"],
    lightTip: "Salteá en sartén antiadherente con rocío vegetal y usá 2 claras + 1 huevo entero."
  },
  "cocina-panqueques-avena": {
    kcal: 275, protein: 11, carbs: 38, fat: 8, fiber: 5,
    dietTags: ["Vegetariana", "Sin azúcar refinada", "Fibra alta"],
    lightTip: "Utilizá 1 huevo entero + 2 claras para subir proteína bajando grasas."
  },
  "cocina-bifes-criolla": {
    kcal: 395, protein: 38, carbs: 26, fat: 15, fiber: 3,
    dietTags: ["Alta en proteína", "Sin TACC", "Clásica"],
    lightTip: "Pedí bife de nalga bien magro y reducí levemente las rodajas de papa."
  },
  "parrilla-bife-chorizo": {
    kcal: 520, protein: 52, carbs: 2, fat: 33, fiber: 0,
    dietTags: ["Alta en proteína", "Keto / Low-Carb", "Sin TACC"],
    lightTip: "Retirá el cordón lateral de grasa al servir y escurrí el exceso de aceite del chimichurri."
  },
  "parrilla-verduras-asadas": {
    kcal: 175, protein: 4, carbs: 14, fat: 12, fiber: 5,
    dietTags: ["Vegana", "Sin TACC", "Baja en calorías", "Low-Carb"],
    lightTip: "Pincelá los vegetales con solo 1 cdta de aceite de oliva y extra aceto."
  },
  "parrilla-merluza-plancha": {
    kcal: 225, protein: 32, carbs: 2, fat: 10, fiber: 0,
    dietTags: ["Alta en proteína", "Keto / Low-Carb", "Sin TACC", "Baja en calorías"],
    lightTip: "Excelente opción liviana; usá plancha bien caliente con apenas gotas de oliva."
  },
  "parrilla-pechuga-mariposa": {
    kcal: 265, protein: 40, carbs: 1, fat: 11, fiber: 0,
    dietTags: ["Alta en proteína", "Keto / Low-Carb", "Sin TACC", "Fit"],
    lightTip: "Cociná con limón y hierbas en plancha antiadherente usando la mitad de aceite."
  },
  "microondas-mugcake-cacao": {
    kcal: 365, protein: 7, carbs: 50, fat: 15, fiber: 3,
    dietTags: ["Vegetariana", "Express 2 min"],
    lightTip: "Sustituí el azúcar por edulcorante apto cocción y el aceite por 1 cda de puré de manzana."
  },
  "microondas-omelette-taza": {
    kcal: 260, protein: 20, carbs: 3, fat: 19, fiber: 1,
    dietTags: ["Vegetariana", "Keto / Low-Carb", "Sin TACC", "Baja en calorías"],
    lightTip: "Elegí queso port salut magro o ricota para bajar grasas saturadas."
  },
  "microondas-papas-rellenas": {
    kcal: 295, protein: 11, carbs: 43, fat: 9, fiber: 4,
    dietTags: ["Vegetariana", "Sin TACC", "Económica"],
    lightTip: "Usá queso crema descremado o yogur griego natural con ciboulette."
  },
  "sin-coccion-overnight-oats": {
    kcal: 345, protein: 12, carbs: 54, fat: 9, fiber: 9,
    dietTags: ["Vegetariana", "Rica en fibra", "Sin cocción"],
    lightTip: "Usá bebida de almendras sin azúcar o leche descremada y reducí la miel a la mitad."
  },
  "sin-coccion-ensalada-cesar": {
    kcal: 380, protein: 29, carbs: 25, fat: 19, fiber: 8,
    dietTags: ["Alta en proteína", "Sin TACC", "Rica en fibra"],
    lightTip: "Usá 1/2 palta chica y 1 cda rasa de aceite de oliva + abundante jugo de limón."
  },
  "sin-coccion-trufas-datiles": {
    kcal: 230, protein: 7, carbs: 28, fat: 11, fiber: 4,
    dietTags: ["Vegetariana", "Pre-entreno", "Sin cocción"],
    lightTip: "Formá bolitas más chicas o sustituí parte de la miel por pasta de dátiles."
  }
};

function buildRecipeIllustrationSvg(recipe, accentColor, variant) {
  const safeTitle = (recipe.title || "Receta")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const cat = typeof getMenuItemById === "function" ? getMenuItemById("categoria", recipe.categoria) : null;
  const met = typeof getMenuItemById === "function" ? getMenuItemById("metodo", recipe.metodo) : null;
  const mainEmoji = cat?.emoji || "🍽️";
  const methodEmoji = met?.emoji || "🔥";
  const totalMin = (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0);

  let headline = recipe.title;
  let subline = `${met?.label || recipe.metodo} · ${totalMin} min`;
  let centerVisual = `
    <circle cx="400" cy="245" r="128" fill="#ffffff" fill-opacity="0.16"/>
    <circle cx="400" cy="245" r="102" fill="#ffffff" fill-opacity="0.94"/>
    <circle cx="400" cy="245" r="88" fill="none" stroke="${accentColor}" stroke-width="4" stroke-dasharray="10 8" stroke-opacity="0.45"/>
    <text x="400" y="256" text-anchor="middle" font-size="88" dominant-baseline="central">${mainEmoji}</text>
  `;

  if (variant === "ingredients") {
    headline = "Mise en place e ingredientes";
    subline = `${recipe.ingredients.length} ingredientes · ${recipe.servings} porciones base`;
    const ingNames = recipe.ingredients.slice(0, 4).map((i) => i.item);
    centerVisual = `
      <rect x="130" y="130" width="540" height="230" rx="26" fill="#ffffff" fill-opacity="0.92"/>
      <text x="400" y="175" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="22" font-weight="800" fill="#0f172a">🧺 Base de ingredientes</text>
      ${ingNames
        .map((txt, idx) => {
          const short = txt.length > 36 ? txt.slice(0, 34) + "…" : txt;
          return `<text x="400" y="${218 + idx * 34}" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" font-weight="600" fill="#334155">• ${short.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`;
        })
        .join("")}
    `;
  } else if (variant === "method") {
    headline = `Técnica: ${met?.label || recipe.metodo}`;
    subline = recipe.temperatureC
      ? `Temperatura sugerida: ${recipe.temperatureC} °C · Dificultad ${recipe.difficulty || "Fácil"}`
      : `Cocción estimada: ${recipe.cookMinutes} min · Dificultad ${recipe.difficulty || "Fácil"}`;
    centerVisual = `
      <rect x="190" y="135" width="420" height="215" rx="28" fill="#ffffff" fill-opacity="0.16" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>
      <text x="400" y="218" text-anchor="middle" font-size="76" dominant-baseline="central">${methodEmoji}</text>
      <text x="400" y="302" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="24" font-weight="800" fill="#ffffff">${recipe.temperatureC ? `${recipe.temperatureC} °C · ` : ""}${totalMin} min totales</text>
    `;
  }

  const safeHead = headline.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeSub = subline.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accentColor}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="500" fill="url(#bg)"/>
      <rect width="800" height="500" fill="url(#glow)"/>
      ${centerVisual}
      <text x="400" y="425" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="25" font-weight="800" fill="#ffffff">${safeHead.length > 44 ? safeTitle.slice(0, 42) + "…" : safeHead}</text>
      <text x="400" y="460" text-anchor="middle" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#e2e8f0">${safeSub}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getRecipeNutritionAndMedia(recipe) {
  const met = typeof getMenuItemById === "function" ? getMenuItemById("metodo", recipe.metodo) : null;
  const accentColor = met?.color || "#4f46e5";
  const baseNutrition = RECIPE_NUTRITION_DATA[recipe.id] || {
    kcal: 320,
    protein: 22,
    carbs: 28,
    fat: 12,
    fiber: 3,
    dietTags: ["Casera"],
    lightTip: "Moderá el aceite de cocción y acompañá con vegetales frescos."
  };

  const photos = [
    {
      url: buildRecipeIllustrationSvg(recipe, accentColor, "plate"),
      caption: `Presentación sugerida · ${recipe.title}`,
      isCustom: false
    },
    {
      url: buildRecipeIllustrationSvg(recipe, accentColor, "ingredients"),
      caption: `Ingredientes base (${recipe.ingredients.length} ítems)`,
      isCustom: false
    },
    {
      url: buildRecipeIllustrationSvg(recipe, accentColor, "method"),
      caption: `Preparación en ${met?.label || recipe.metodo}`,
      isCustom: false
    }
  ];

  const videoChapters = (recipe.steps || []).map((step, idx) => ({
    index: idx,
    title: `Paso ${idx + 1}`,
    text: step.text,
    timerMinutes: step.timerMinutes || null
  }));

  return {
    nutrition: { ...baseNutrition },
    lightFactor: 0.82,
    photos,
    videoUrl: recipe.videoUrl || "",
    videoChapters
  };
}

function getAdjustedNutrition(baseNutrition, lightMode) {
  if (!lightMode) {
    return {
      kcal: baseNutrition.kcal,
      protein: baseNutrition.protein,
      carbs: baseNutrition.carbs,
      fat: baseNutrition.fat,
      fiber: baseNutrition.fiber
    };
  }
  const kcal = Math.round(baseNutrition.kcal * 0.82);
  const carbs = Math.max(0, Math.round(baseNutrition.carbs * 0.88));
  const fat = Math.max(0, Math.round(baseNutrition.fat * 0.7));
  const protein = baseNutrition.protein;
  return {
    kcal,
    protein,
    carbs,
    fat,
    fiber: baseNutrition.fiber
  };
}

function evaluateDietCompatibility(nutrition, dietPlanKey, lightMode) {
  const plan = DIET_PLANS[dietPlanKey] || DIET_PLANS.balanced;
  const perServing = getAdjustedNutrition(nutrition, lightMode);

  const kcalPct = Math.round((perServing.kcal / plan.kcal) * 100);
  const proteinPct = Math.round((perServing.protein / plan.proteinG) * 100);
  const carbsPct = Math.round((perServing.carbs / plan.carbsG) * 100);
  const fatPct = Math.round((perServing.fat / plan.fatG) * 100);

  let status = "good";
  let message = "Aporte balanceado dentro de tu objetivo seleccionado.";

  if (plan.key === "keto") {
    if (perServing.carbs <= 12) {
      status = "optimal";
      message = `Excelente para Keto: solo ${perServing.carbs} g de carbohidratos por porción.`;
    } else if (perServing.carbs <= 25) {
      status = "good";
      message = `Apto para Low-Carb moderado (${perServing.carbs} g de carbos / porc.).`;
    } else {
      status = "warning";
      message = `Carbohidratos altos (${perServing.carbs} g) para dieta cetogénica estricta.`;
    }
  } else if (plan.key === "deficit") {
    if (perServing.kcal <= 360) {
      status = "optimal";
      message = `Ideal para déficit calórico (${perServing.kcal} kcal · ${kcalPct}% del día).`;
    } else if (perServing.kcal <= 470) {
      status = "good";
      message = `Encaja bien como comida principal (${perServing.kcal} kcal · ${kcalPct}% del día).`;
    } else {
      status = "warning";
      message = `Porción calórica exigente (${perServing.kcal} kcal); activá el ajuste liviano o ajustá la guarnición.`;
    }
  } else if (plan.key === "muscle") {
    if (perServing.protein >= 28) {
      status = "optimal";
      message = `Excelente densidad proteica (${perServing.protein} g de proteína por porción).`;
    } else if (perServing.protein >= 14) {
      status = "good";
      message = `Buen aporte (${perServing.protein} g prot.); ideal combinada con otra fuente proteica.`;
    } else {
      status = "warning";
      message = `Baja en proteína por sí sola (${perServing.protein} g); recomendada como colación o guarnición.`;
    }
  } else {
    if (kcalPct <= 28) {
      status = "optimal";
      message = `Plato equilibrado y liviano (${kcalPct}% de tus 2000 kcal diarias).`;
    } else if (kcalPct <= 38) {
      status = "good";
      message = `Aporte calórico moderado (${kcalPct}% de la meta diaria).`;
    } else {
      status = "warning";
      message = `Plato contundente (${kcalPct}% de tu día); acompañalo con vegetales frescos.`;
    }
  }

  return {
    plan,
    perServing,
    kcalPct,
    proteinPct,
    carbsPct,
    fatPct,
    status,
    message
  };
}
