/**
 * Módulo de Control de Calorías, Dietas, Sustitución de Ingredientes y Estudio Multimedia.
 * - Calcula calorías y macronutrientes reales por ingrediente para todo el catálogo (302+ recetas).
 * - Sincroniza objetivos deportivos/calóricos y dietas clínicas de COMER BIEN (Sin TACC, Sin lactosa,
 *   Sin azúcar / Diabetes, Vegana, Vegetariana, Baja en sodio, Keto, Déficit, Masa muscular).
 * - Sugiere y aplica sustituciones concretas de ingredientes accesibles en Uruguay.
 */

const DIET_PLANS = {
  balanced: {
    key: "balanced",
    label: "Equilibrada (MSP)",
    shortLabel: "🌿 Equilibrada (2000 kcal)",
    kcal: 2000,
    proteinG: 100,
    carbsG: 240,
    fatG: 65,
    description: "Distribución armónica de energía basada en la Guía Alimentaria de Uruguay."
  },
  deficit: {
    key: "deficit",
    label: "Déficit calórico",
    shortLabel: "🔥 Déficit calórico (1600 kcal)",
    kcal: 1600,
    proteinG: 110,
    carbsG: 150,
    fatG: 50,
    description: "Prioriza platos livianos con alta saciedad y recortes de grasas/cremas."
  },
  muscle: {
    key: "muscle",
    label: "Masa muscular",
    shortLabel: "💪 Masa muscular (2500 kcal)",
    kcal: 2500,
    proteinG: 165,
    carbsG: 290,
    fatG: 75,
    description: "Enfocada en alto aporte proteico y energía sostenida."
  },
  keto: {
    key: "keto",
    label: "Keto / Low-Carb",
    shortLabel: "🥑 Keto / Low-Carb (≤40g carb)",
    kcal: 1850,
    proteinG: 120,
    carbsG: 40,
    fatG: 135,
    description: "Control estricto de harinas, azúcares y almidones priorizando proteínas y grasas buenas."
  },
  sin_gluten: {
    key: "sin_gluten",
    label: "Sin gluten (Sin TACC)",
    shortLabel: "🌾 Sin gluten (Celiaquía)",
    kcal: 2000,
    proteinG: 95,
    carbsG: 230,
    fatG: 65,
    description: "Sustituye trigo, avena común, cebada y centeno por premezclas y pastas certificadas Sin TACC."
  },
  sin_lactosa: {
    key: "sin_lactosa",
    label: "Sin lactosa",
    shortLabel: "🥛 Sin lactosa",
    kcal: 2000,
    proteinG: 95,
    carbsG: 235,
    fatG: 65,
    description: "Reemplaza leche, crema, manteca y quesos comunes por opciones deslactosadas o vegetales."
  },
  sin_azucar: {
    key: "sin_azucar",
    label: "Sin azúcar / Control glucémico",
    shortLabel: "🍯 Sin azúcar / Diabetes",
    kcal: 1800,
    proteinG: 100,
    carbsG: 180,
    fatG: 60,
    description: "Elimina azúcares simples y prioriza harinas/pastas integrales al dente con más fibra."
  },
  vegana: {
    key: "vegana",
    label: "100% Vegetal (Vegana)",
    shortLabel: "🌱 100% Vegetal (Vegana)",
    kcal: 2000,
    proteinG: 85,
    carbsG: 250,
    fatG: 65,
    description: "Reemplaza carnes, huevos y lácteos por legumbres, tofu, semillas y bebidas vegetales."
  },
  vegetariana: {
    key: "vegetariana",
    label: "Vegetariana",
    shortLabel: "🥬 Vegetariana",
    kcal: 2000,
    proteinG: 90,
    carbsG: 245,
    fatG: 65,
    description: "Sustituye carnes, fiambres y pescados por hongos, legumbres, huevos y quesos."
  },
  bajo_sodio: {
    key: "bajo_sodio",
    label: "Baja en sodio (Hipertensión)",
    shortLabel: "🧂 Baja en sodio",
    kcal: 1950,
    proteinG: 95,
    carbsG: 235,
    fatG: 60,
    description: "Elimina sal agregada, fiambres, caldos comerciales y encurtidos priorizando hierbas y limón."
  }
};

// Valores curados para las 24 recetas fundacionales
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
    dietTags: ["Vegana", "Sin TACC", "Baja en calorías", "Sin azúcar agregada"],
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

// Mapear el perfil de COMER BIEN al plan nutricional equivalente
function resolveDietPlanFromComerBienUser(user) {
  if (!user) return null;
  const pattern = String(user.dietPattern || "").toLowerCase();
  const restrictions = (user.restrictions || []).map((r) => String(r).toLowerCase());
  const has = (kw) => restrictions.some((r) => r.includes(kw));

  if (pattern === "sin_gluten" || has("gluten") || has("celiaqu")) return "sin_gluten";
  if (pattern === "vegana" || has("vegano")) return "vegana";
  if (pattern === "vegetariana" || has("vegetariano")) return "vegetariana";
  if (pattern === "sin_lactosa" || has("lactosa")) return "sin_lactosa";
  if (pattern === "sin_azucar" || has("azúcar") || has("azucar")) return "sin_azucar";
  if (pattern === "bajo_sodio" || has("sodio") || has("hipertens")) return "bajo_sodio";
  if (pattern === "equilibrada") return "balanced";
  return null;
}

// Conversión aproximada de cantidad + unidad a gramos comestibles
function estimateGramsForIngredient(ing) {
  const amt = Math.max(0, Number(ing.amount) || 1);
  const u = String(ing.unit || "").toLowerCase().trim();
  const item = String(ing.item || "").toLowerCase();

  if (u === "kg") return amt * 1000;
  if (u === "g" || u === "gr") return amt;
  if (u === "mg") return amt / 1000;
  if (u === "l" || u === "litro" || u === "litros") return amt * 1000;
  if (u === "ml" || u === "cc") return amt;
  if (u.startsWith("taza")) return /harina|avena|azúcar|maicena|fécula|pan rallado/.test(item) ? amt * 130 : amt * 220;
  if (u === "cda" || u === "cdas" || u.startsWith("cucharada")) return /aceite|manteca|miel|mayonesa|crema|queso/.test(item) ? amt * 13 : amt * 12;
  if (u === "cdta" || u === "cdtas" || u === "cdita" || u === "cditas" || u.startsWith("cucharadita")) return amt * 4.5;
  if (u.startsWith("pizca") || u === "a gusto" || u.startsWith("hoja")) return 2;
  if (u.startsWith("diente")) return amt * 5;
  if (u.startsWith("feta") || u.startsWith("lonja")) return amt * 20;
  if (u.startsWith("rebanada") || u.startsWith("rodaja")) return amt * 30;
  if (u.startsWith("lámina") || u.startsWith("lamina")) return amt * 25;
  if (u.startsWith("lata")) return /atún/.test(item) ? amt * 120 : amt * 350;
  if (u.startsWith("atado") || u.startsWith("manojo") || u.startsWith("puñado")) return /albahaca|perejil|cilantro|menta|rúcula/.test(item) ? amt * 35 : amt * 240;
  if (u.startsWith("rama") || u.startsWith("tallo")) return amt * 30;
  if (u.startsWith("filete")) return /anchoa/.test(item) ? amt * 5 : amt * 150;
  if (u.startsWith("sobre")) return amt * 10;

  // Unidades ("u", "unidad", "unidades") según alimento
  if (/huevo|clara|yema/.test(item)) return /clara/.test(item) ? amt * 33 : /yema/.test(item) ? amt * 18 : amt * 55;
  if (/panqueque|tortilla|tapa/.test(item)) return /copetín/.test(item) ? amt * 12 : amt * 35;
  if (/pan |miñón|baguette|árabe/.test(item)) return amt * 60;
  if (/chorizo/.test(item)) return amt * 95;
  if (/pechuga|suprema|muslo|bife|hamburguesa/.test(item)) return amt * 180;
  if (/papa|boniato|manzana|naranja|pomelo|cebolla|tomate|morrón|zanahoria|zapallito|zucchini|berenjena|pepino|palta|banana|choclo/.test(item)) {
    if (/cherry/.test(item)) return amt * 14;
    if (/aceituna/.test(item)) return amt * 4;
    return amt * 135;
  }
  if (/champiñ/.test(item)) return amt * 18;
  if (/limón/.test(item)) return amt * 35;
  return amt * 65;
}

// Densidad nutricional por cada 100 g de ingrediente [kcal, prot, carbs, fat, fiber]
function getMacroDensityPer100g(itemText) {
  const s = String(itemText || "").toLowerCase();

  if (/agua|hielo|té |infusión|sal\b|sin sal|pimienta|orégano|laurel|tomillo|romero|comino|nuez moscada|vinagre|edulcorante|eritritol|stevia|levadura\b|polvo de hornear|bicarbonato|esencia|ralladura/.test(s) && !/aceite|pan|harina|queso|caldo|salsa/.test(s)) {
    return [5, 0.2, 1, 0, 0.2];
  }
  if (/zoodles|cintas de zucchini|láminas.*zucchini|láminas.*berenjena|coliflor al vapor/.test(s)) {
    return [24, 1.8, 4.2, 0.3, 2.2];
  }
  if (/bebida vegetal/.test(s)) return [38, 1.8, 4.5, 1.4, 0.6];
  if (/crema vegetal/.test(s)) return [145, 2, 7, 12, 0.8];
  if (/queso vegetal|levadura nutricional/.test(s)) return [240, 8, 12, 18, 2];
  if (/aceite/.test(s) && !/atún|tomates? secos?/.test(s)) return [884, 0, 0, 100, 0];
  if (/manteca|margarina/.test(s) && !/maní|papel/.test(s)) return [717, 0.8, 0.5, 81, 0];
  if (/mayonesa/.test(s)) return /vegana|vegetal|zanahoria/.test(s) ? [160, 2, 10, 12, 2] : [680, 1, 1, 75, 0];
  if (/fideo|espagueti|fettuccini|tallar|cintas|penne|mostachol|macarr|rigatoni|caracol|moñito|tirabuz|codito|láminas.*lasaña|placas.*lasaña/.test(s)) {
    return [355, 12.5, 72, 1.8, /integral/.test(s) ? 7 : 3];
  }
  if (/panqueque|tapa.*copetín|tapa.*empanada|masa.*fresca|masa.*lasaña|tortilla/.test(s)) {
    return [275, 8, 46, 6, 2];
  }
  if (/harina de almendra/.test(s)) return [575, 21, 10, 50, 10];
  if (/harina|sémola|maicena|fécula|polenta|avena|trigo burgol|salvado|premezcla|rebozador/.test(s)) {
    return [350, 11, 73, 2, /integral|avena|salvado|burgol/.test(s) ? 9 : 2.8];
  }
  if (/tofu|seitán|soja texturizada/.test(s)) return /hidratada/.test(s) ? [125, 18, 10, 0.8, 4.5] : /texturizada/.test(s) ? [330, 50, 30, 1.5, 12] : [110, 12, 2, 6, 1];
  if (/nuez|nueces|almendra|avellana|castaña|piñon/.test(s)) return [620, 16, 14, 58, 8];
  if (/maní|pasta de maní|semilla|sésamo|chía|lino|girasol/.test(s)) return [560, 22, 18, 48, 9];
  if (/champiñ|portobello|hongo/.test(s)) return [28, 3.1, 3.3, 0.4, 1.2];
  if (/panceta|chorizo|salame|pepperoni|jamón crudo/.test(s)) return [360, 18, 2, 31, 0];
  if (/jamón cocido|jamón magro|lomito/.test(s)) return [125, 19, 2, 4.5, 0];
  if (/crema de leche/.test(s)) return [310, 2.2, 3, 32, 0];
  if (/queso crema|untable/.test(s)) return /descremad|magr|avena/.test(s) ? [130, 9, 5, 8, 0] : [255, 6, 4, 24, 0];
  if (/ricota/.test(s)) return /magra/.test(s) ? [135, 12, 3.5, 8, 0] : [174, 11, 3, 13, 0];
  if (/mozzarella|muzzarella|port salut|queso fresco|queso blanco|feta/.test(s)) return /magr|semidescrem/.test(s) ? [225, 24, 2.5, 13, 0] : [280, 22, 2.2, 21, 0];
  if (/parmesano|sardo|provolone|gruyere|colonia|dambo|cheddar|queso azul|roquefort|queso rallado|mix 4 quesos/.test(s)) return [375, 27, 2, 29, 0];
  if (/leche/.test(s) && !/dulce de leche|coco/.test(s)) return /descremada/.test(s) ? [35, 3.4, 5, 0.2, 0] : [61, 3.2, 4.8, 3.3, 0];
  if (/yogur/.test(s)) return /descremad/.test(s) ? [46, 4.5, 6, 0.4, 0] : [65, 3.8, 5.5, 3, 0];
  if (/salsa blanca|bechamel/.test(s)) return [115, 3.8, 10, 6.5, 0.2];
  if (/pesto/.test(s)) return [390, 6, 6, 38, 2];
  if (/pechuga|suprema|pollo/.test(s) && !/caldo/.test(s)) return [155, 29, 0, 4, 0];
  if (/carne.*magra|nalga|peceto|cuadril|lomo|bife/.test(s) && !/caldo/.test(s)) return [185, 27, 0, 8, 0];
  if (/carne|cerdo|costill/.test(s) && !/caldo/.test(s)) return [235, 24, 0, 15, 0];
  if (/salmón|salmon/.test(s)) return [208, 20, 0, 13, 0];
  if (/atún|merluza|corvina|brótola|pescado|camar|mejill|anchoa/.test(s) && !/caldo/.test(s)) return [120, 24, 0, 2.5, 0];
  if (/clara/.test(s)) return [52, 11, 0.7, 0.2, 0];
  if (/yema/.test(s)) return [322, 16, 3.6, 27, 0];
  if (/huevo/.test(s)) return [143, 12.6, 0.8, 9.5, 0];
  if (/arroz/.test(s)) return /cocido|pasado/.test(s) ? [130, 2.7, 28, 0.3, 0.6] : [360, 7, 79, 0.7, 1.3];
  if (/quinoa/.test(s)) return [368, 14, 64, 6, 7];
  if (/pan rallado/.test(s)) return [375, 12, 72, 4, /integral/.test(s) ? 7 : 3.5];
  if (/pan |miñón|baguette|lactal|tostad/.test(s)) return [265, 9, 49, 3.2, /integral/.test(s) ? 6.5 : 2.7];
  if (/poroto|lenteja|garbanzo/.test(s)) return /cocid|lata|escurr/.test(s) ? [125, 8.5, 21, 0.8, 7.5] : [335, 22, 60, 1.8, 15];
  if (/arveja|choclo/.test(s)) return [86, 4.5, 16, 0.8, 4.2];
  if (/papa|boniato|mandioca/.test(s)) return [82, 2, 18.5, 0.1, 2.2];
  if (/calabaza|zapallo\b/.test(s)) return [34, 1, 8, 0.1, 1.8];
  if (/palta/.test(s)) return [160, 2, 8.5, 15, 6.7];
  if (/aceituna/.test(s)) return [145, 1, 4, 15, 3];
  if (/tomate seco/.test(s)) return [250, 11, 44, 3, 10];
  if (/azúcar|miel|dulce de leche|membrillo|mermelada/.test(s)) {
    if (/diet|sin azúcar/.test(s)) return [85, 0.5, 20, 0, 1];
    return /dulce de leche/.test(s) ? [315, 7, 55, 7, 0] : [385, 0, 99, 0, 0];
  }
  if (/chocolate|cacao/.test(s)) return /amargo.*polvo|cacao/.test(s) ? [228, 20, 58, 14, 33] : [530, 6, 58, 31, 7];
  if (/vino|coñac|cerveza/.test(s)) return [82, 0.1, 2.6, 0, 0];
  if (/caldo/.test(s)) return [12, 0.8, 1.2, 0.4, 0];
  if (/extracto.*tomate/.test(s)) return [82, 4.3, 19, 0.5, 4];
  if (/salsa de tomate|puré de tomate|pulpa de tomate|tomate/.test(s)) return [26, 1.2, 5.2, 0.3, 1.4];
  if (/banana/.test(s)) return [89, 1.1, 23, 0.3, 2.6];
  if (/manzana|pera|durazno|ciruela|kiwi|uva|frutilla|frambuesa|arándano|naranja|pomelo|sandía|ananá|limón/.test(s)) {
    return [48, 0.7, 11.5, 0.2, 2.2];
  }
  // Verduras de hoja, crucíferas, cebolla, morrón, hongos, etc.
  return [28, 2, 5, 0.3, 2.4];
}

// Calcula calorías, macros, etiquetas dietéticas y consejo liviano reales para cualquier receta
function computeDynamicNutritionForRecipe(recipe, customIngredients) {
  const ings = customIngredients || recipe.ingredients || [];
  const servings = Math.max(1, Number(recipe.servings) || 2);

  let totalKcal = 0;
  let totalProt = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  for (const rawIng of ings) {
    const ingObj = typeof rawIng === "string" ? { amount: 1, unit: "u", item: rawIng } : rawIng;
    const grams = estimateGramsForIngredient(ingObj);
    const [k100, p100, c100, f100, fb100] = getMacroDensityPer100g(ingObj.item);
    const factor = grams / 100;
    totalKcal += k100 * factor;
    totalProt += p100 * factor;
    totalCarbs += c100 * factor;
    totalFat += f100 * factor;
    totalFiber += fb100 * factor;
  }

  let kcal = Math.round(totalKcal / servings);
  let protein = Math.round(totalProt / servings);
  let carbs = Math.round(totalCarbs / servings);
  let fat = Math.round(totalFat / servings);
  let fiber = Math.max(0, Math.round(totalFiber / servings));

  // Cotas razonables (ej. aguas infusionadas vs platos principales)
  if (kcal < 15) kcal = 15;
  if (kcal > 980) {
    const scale = 920 / kcal;
    kcal = 920;
    protein = Math.round(protein * scale);
    carbs = Math.round(carbs * scale);
    fat = Math.round(fat * scale);
  }

  const fullText = [
    recipe.id || "",
    recipe.title || "",
    ...ings.map((i) => (typeof i === "string" ? i : i.item || ""))
  ]
    .join(" ")
    .toLowerCase();

  const hasAnimalMeat = /(pollo|pechuga|suprema|muslo|carne|vacun|res|bife|cuadril|nalga|peceto|cerdo|chorizo|panceta|jamón|pepperoni|salame|salmón|salmon|atún|merluza|corvina|pescado|camar|mejill|anchoa)/.test(fullText);
  const hasDairyOrEgg = /(leche|queso|ricota|mozzarella|muzzarella|parmesano|sardo|provolone|cheddar|colonia|dambo|gruyere|roquefort|crema de leche|manteca|yogur|huevo|clara|yema|miel|mayonesa\b)/.test(fullText) && !/vegano|vegana/.test(recipe.title.toLowerCase());
  const hasGlutenSource = /(harina de trigo|harina 000|harina común|harina integral|harina para pan|\bharina\b|sémola|trigo|burgol|salvado|avena|fideo|espagueti|fettuccini|tallar|penne|mostachol|macarr|rigatoni|caracol|moñito|codito|lasaña|panqueque|tapa.*copetín|pan |miñón|baguette|lactal)/.test(fullText) && !/sin tacc|sin gluten|premezcla sin tacc|harina de arroz|harina de maíz|harina de garbanzo|harina de almendra/.test(fullText);
  const hasAddedSugar = /(\bazúcar\b|miel|dulce de leche|membrillo)/.test(fullText) && !/sin azúcar/.test(fullText);

  const dietTags = [];
  if (!hasAnimalMeat && !hasDairyOrEgg) dietTags.push("Vegana");
  else if (!hasAnimalMeat) dietTags.push("Vegetariana");
  if (!hasGlutenSource || /celiaco-|sin tacc|sin gluten/i.test(recipe.id + " " + recipe.title)) dietTags.push("Sin TACC");
  if (/diabetes-|sin azúcar/i.test(recipe.id + " " + recipe.title) || (!hasAddedSugar && recipe.categoria === "dulces")) {
    dietTags.push("Sin azúcar agregada");
  }
  if (protein >= 24) dietTags.push("Alta en proteína");
  if (carbs <= 18 && kcal >= 120) dietTags.push("Keto / Low-Carb");
  if (kcal <= 280) dietTags.push("Baja en calorías");
  if (fiber >= 5) dietTags.push("Rica en fibra");
  if (dietTags.length === 0) dietTags.push("Casera equilibrada");

  let lightTip = "Acompañá con ensalada fresca de hojas verdes y moderá el aceite al emplatar.";
  if (/crema de leche/.test(fullText)) {
    lightTip = "Reemplazá mitad o toda la crema de leche por queso crema magro o leche descremada espesada.";
  } else if (/panceta|chorizo/.test(fullText)) {
    lightTip = "Dorá el embutido en sartén seca retirando toda la grasa fundida o usá la mitad de cantidad.";
  } else if (/manteca/.test(fullText)) {
    lightTip = "Sustituí la mitad de la manteca por 1 cucharadita de aceite de oliva o caldo vegetal.";
  } else if (/mozzarella|cheddar|cuatro quesos|queso rallado/.test(fullText)) {
    lightTip = "Elegí mozzarella magra / ricota magra y medí el queso rallado con cuchara al servir.";
  } else if (/azúcar|miel/.test(fullText)) {
    lightTip = "Sustituí el azúcar por edulcorante apto cocción para recortar calorías y carga glucémica.";
  } else if (/pasta|fideo|espagueti|ñoqui|raviol|lasaña|canel/.test(fullText)) {
    lightTip = "Cociná la pasta bien al dente y sumá el doble de vegetales salteados al plato para mayor saciedad.";
  }

  return {
    kcal,
    protein,
    carbs,
    fat,
    fiber,
    dietTags: dietTags.slice(0, 4),
    lightTip
  };
}

// Reglas de sustitución de ingredientes por dieta (100% productos conseguibles en Uruguay)
function substituteSingleIngredient(ing, dietKey, restrictionsList = []) {
  const rawItem = String(ing.item || "");
  const low = rawItem.toLowerCase();
  const hasRestr = (kw) => restrictionsList.some((r) => r.includes(kw));

  const wantsGlutenFree = dietKey === "sin_gluten" || hasRestr("gluten") || hasRestr("celiaqu");
  const wantsLactoseFree = dietKey === "sin_lactosa" || hasRestr("lactosa");
  const wantsSugarFree = dietKey === "sin_azucar" || hasRestr("azúcar") || hasRestr("azucar");
  const wantsVegan = dietKey === "vegana" || hasRestr("vegano");
  const wantsVegetarian = !wantsVegan && (dietKey === "vegetariana" || hasRestr("vegetariano"));
  const wantsLowSodium = dietKey === "bajo_sodio" || hasRestr("sodio") || hasRestr("hipertens");
  const wantsKeto = dietKey === "keto";
  const wantsDeficit = dietKey === "deficit";
  const wantsNutFree = hasRestr("frutos secos");

  const changes = [];
  let nextItem = rawItem;

  // 1. Vegana / Vegetariana (proteínas animales)
  if (wantsVegan || wantsVegetarian) {
    if (/carne.*picada|cerdo.*picad/.test(low)) {
      nextItem = "soja texturizada hidratada o lentejas cocidas al pimentón";
      changes.push(wantsVegan ? "Vegana" : "Vegetariana");
    } else if (/chorizo|panceta|pepperoni|salame/.test(low)) {
      nextItem = "champiñones fileteados dorados con pimentón ahumado";
      changes.push(wantsVegan ? "Vegana" : "Vegetariana");
    } else if (/jamón/.test(low)) {
      nextItem = "tomates secos o láminas de berenjena grillada";
      changes.push(wantsVegan ? "Vegana" : "Vegetariana");
    } else if (/pechuga|suprema|muslo|pollo|bife|cuadril|carne|costill/.test(low) && !/caldo/.test(low)) {
      nextItem = wantsVegan ? "tofu firme dorado o garbanzos crocantes" : "champiñones portobello y cubos de queso firme";
      changes.push(wantsVegan ? "Vegana" : "Vegetariana");
    } else if (/salmón|salmon|atún|merluza|corvina|pescado|camar/.test(low)) {
      nextItem = "garbanzos aplastados al limón y algas/perejil";
      changes.push(wantsVegan ? "Vegana" : "Vegetariana");
    } else if (/anchoa/.test(low)) {
      nextItem = "aceitunas negras picadas y alcaparras";
      changes.push(wantsVegan ? "Vegana" : "Vegetariana");
    } else if (/caldo de (pollo|ave|carne|pescado)/.test(low)) {
      nextItem = "caldo casero de verduras";
      changes.push("Vegetal");
    }
  }

  // 2. Vegana (huevos y lácteos) o Sin Lactosa
  if (wantsVegan) {
    if (/(fettuccini|tallar|cinta|fideo|masa).*huevo/.test(low)) {
      nextItem = "fideos secos de sémola de trigo candeal (sin huevo)";
      changes.push("Vegana");
    } else if (/huevo|clara|yema/.test(low)) {
      nextItem = "tofu blando procesado con cúrcuma (o lino hidratado para ligar)";
      changes.push("Sin huevo");
    } else if (/crema de leche/.test(low)) {
      nextItem = "crema vegetal de avena o soja para cocinar";
      changes.push("Vegana");
    } else if (/leche/.test(low) && !/vegetal|almendra|soja|avena|coco/.test(low)) {
      nextItem = "bebida vegetal de avena o soja sin azúcar";
      changes.push("Vegana");
    } else if (/manteca/.test(low) && !/maní/.test(low)) {
      nextItem = "aceite de oliva suave";
      changes.push("Vegana");
    } else if (/ricota|queso crema/.test(low)) {
      nextItem = "tofu firme pisado con limón, oliva y pizca de sal";
      changes.push("Vegana");
    } else if (/mozzarella|muzzarella|parmesano|sardo|provolone|colonia|dambo|gruyere|cheddar|queso|roquefort/.test(low) && !/vegano|vegetal/.test(low)) {
      nextItem = "queso vegetal fundible o levadura nutricional";
      changes.push("Vegana");
    } else if (/miel/.test(low)) {
      nextItem = "miel de caña o pasta de dátiles";
      changes.push("Vegana");
    } else if (/mayonesa/.test(low) && !/vegana/.test(low)) {
      nextItem = "mayonesa vegetal (lactonesa de soja o zanahoria)";
      changes.push("Vegana");
    }
  } else if (wantsLactoseFree) {
    if (/crema de leche/.test(low)) {
      nextItem = "crema de leche deslactosada (o crema vegetal)";
      changes.push("Sin lactosa");
    } else if (/leche/.test(low) && !/deslactosad|vegetal|sin lactosa/.test(low)) {
      nextItem = rawItem.replace(/leche/i, "leche deslactosada");
      changes.push("Sin lactosa");
    } else if (/manteca/.test(low) && !/maní/.test(low)) {
      nextItem = "aceite de oliva o margarina vegetal sin lactosa";
      changes.push("Sin lactosa");
    } else if (/ricota|queso crema/.test(low)) {
      nextItem = "queso crema / untable deslactosado";
      changes.push("Sin lactosa");
    } else if (/mozzarella|muzzarella|colonia|dambo|cheddar|queso/.test(low) && !/deslactosad|sin lactosa/.test(low)) {
      nextItem = `${rawItem} (versión sin lactosa o estacionado >12 meses)`;
      changes.push("Sin lactosa");
    } else if (/yogur/.test(low)) {
      nextItem = "yogur natural deslactosado";
      changes.push("Sin lactosa");
    }
  }

  // 3. Sin Gluten (Celiaquía / Sin TACC)
  if (wantsGlutenFree && !/sin tacc|sin gluten/.test(low)) {
    if (/harina de trigo|harina 0000|harina 000|harina común|harina integral|harina para pan|\bharina\b/.test(low) && !/maíz|arroz|garbanzo|almendra/.test(low)) {
      nextItem = "premezcla certificada Sin TACC (o harina de arroz + fécula)";
      changes.push("Sin TACC");
    } else if (/sémola|trigo burgol|salvado/.test(low)) {
      nextItem = "polenta fina / sémola de maíz Sin TACC";
      changes.push("Sin TACC");
    } else if (/avena/.test(low)) {
      nextItem = "avena certificada Sin TACC o trigo sarraceno en copos";
      changes.push("Sin TACC");
    } else if (/fideo|espagueti|fettuccini|tallar|penne|mostachol|macarr|rigatoni|caracol|moñito|tirabuz|codito/.test(low)) {
      nextItem = `${rawItem} secos certificados Sin TACC (maíz/arroz)`;
      changes.push("Sin TACC");
    } else if (/láminas.*lasaña|placas.*lasaña|masa.*lasaña|masa.*pastas/.test(low)) {
      nextItem = "láminas para lasaña Sin TACC o láminas de berenjena/zucchini";
      changes.push("Sin TACC");
    } else if (/panqueque/.test(low)) {
      nextItem = "panqueques caseros de maicena Sin TACC";
      changes.push("Sin TACC");
    } else if (/tapa.*copetín|tapa.*empanada/.test(low)) {
      nextItem = "tapas de empanada certificadas Sin TACC";
      changes.push("Sin TACC");
    } else if (/pan rallado/.test(low)) {
      nextItem = "rebozador certificado Sin TACC o polenta";
      changes.push("Sin TACC");
    } else if (/\bpan\b|miñón|miñones|baguette|lactal|pan árabe/.test(low)) {
      nextItem = "pan de molde casero o comercial certificado Sin TACC";
      changes.push("Sin TACC");
    }
  }

  // 4. Keto / Low-Carb
  if (wantsKeto) {
    if (/fideo|espagueti|fettuccini|tallar|penne|mostachol|macarr|rigatoni|caracol|moñito|codito/.test(low)) {
      nextItem = "cintas de zucchini salteadas al dente (zoodles) o corazones de alcaucil/repollo";
      changes.push("Keto");
    } else if (/láminas.*lasaña|placas.*lasaña|panqueque/.test(low)) {
      nextItem = "láminas finas de zucchini o berenjena grilladas (o crepes de huevo y queso)";
      changes.push("Keto");
    } else if (/papa|boniato|calabaza|arroz|poroto|lenteja|garbanzo|choclo|arveja/.test(low)) {
      nextItem = "coliflor al vapor/asado o brócoli picado (bajo en carbohidratos)";
      changes.push("Keto");
    } else if (/harina|maicena|fécula|sémola|pan rallado|avena/.test(low)) {
      nextItem = "harina de almendras o queso parmesano fino (para ligar/rebozar)";
      changes.push("Keto");
    } else if (/azúcar|miel/.test(low)) {
      nextItem = "eritritol o stevia apta cocción";
      changes.push("Keto");
    }
  }

  // 5. Sin Azúcar / Control glucémico (Diabetes)
  if (wantsSugarFree && !wantsKeto) {
    if (/\bazúcar\b|miel/.test(low) && !/sin azúcar/.test(low)) {
      nextItem = "edulcorante apto cocción o stevia (equivalente sin azúcar)";
      changes.push("Sin azúcar");
    } else if (/fideo|espagueti|tallar|penne|mostachol|macarr/.test(low) && !/integral|sin tacc/.test(low)) {
      nextItem = `${rawItem} integrales cocidos bien al dente (menor índice glucémico)`;
      changes.push("Bajo IG");
    } else if (/harina de trigo|harina común|harina 000/.test(low) && !/integral|sin tacc/.test(low)) {
      nextItem = "harina integral fina (mayor aporte de fibra)";
      changes.push("Con fibra");
    }
  }

  // 6. Baja en sodio (Hipertensión)
  if (wantsLowSodium) {
    if (/\bsal\b|sal fina|sal gruesa/.test(low)) {
      nextItem = rawItem.replace(/sal( fina| gruesa)?/gi, "hierbas frescas, ajo y jugo de limón (sin sal)");
      changes.push("Sin sal");
    } else if (/panceta|chorizo|jamón crudo|anchoa|alcaparra|aceituna/.test(low)) {
      nextItem = "champiñones dorados o pechuga/lomo casero con pimentón (bajo sodio)";
      changes.push("Bajo sodio");
    } else if (/caldo/.test(low) && !/casero|sin sal/.test(low)) {
      nextItem = `${rawItem} casero sin sal agregada`;
      changes.push("Bajo sodio");
    }
  }

  // 7. Déficit calórico
  if (wantsDeficit && changes.length === 0) {
    if (/crema de leche/.test(low)) {
      nextItem = "queso crema descremado aligerado con leche descremada";
      changes.push("Liviano");
    } else if (/panceta|chorizo/.test(low)) {
      nextItem = "jamón cocido magro en cubitos (menos grasa)";
      changes.push("Liviano");
    } else if (/ricota\b/.test(low) && !/magra/.test(low)) {
      nextItem = rawItem.replace(/ricota/i, "ricota magra");
      changes.push("Liviano");
    } else if (/leche entera|\bleche\b/.test(low) && !/descrem|vegetal/.test(low)) {
      nextItem = rawItem.replace(/leche( entera)?/i, "leche descremada");
      changes.push("Liviano");
    }
  }

  // 8. Alergia a frutos secos
  if (wantsNutFree && /nuez|nueces|almendra|maní|avellana|castaña/.test(low)) {
    nextItem = "semillas de girasol o zapallo tostadas (sin frutos secos)";
    changes.push("Sin frutos secos");
  }

  if (nextItem !== rawItem) {
    return {
      ...ing,
      item: nextItem,
      originalItem: rawItem,
      isAdapted: true,
      adaptBadge: changes[0] || "Adaptado"
    };
  }

  return {
    ...ing,
    isAdapted: false
  };
}

function adaptRecipeIngredientsForDiet(recipe, dietKey, activeUser, adaptEnabled = true) {
  const baseIngs = recipe.ingredients || [];
  const restrictions = activeUser
    ? (activeUser.restrictions || []).map((r) => String(r).toLowerCase())
    : [];

  const previewAdapted = baseIngs.map((ing) => substituteSingleIngredient(ing, dietKey, restrictions));
  const changedCount = previewAdapted.filter((i) => i.isAdapted).length;

  return {
    ingredients: adaptEnabled ? previewAdapted : baseIngs.map((i) => ({ ...i, isAdapted: false })),
    previewAdapted,
    changedCount,
    hasAvailableAdaptations: changedCount > 0
  };
}

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
    const ingNames = recipe.ingredients.slice(0, 4).map((i) => i.item || String(i));
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

function extractYouTubeThumbUrl(videoUrl) {
  if (!videoUrl || typeof videoUrl !== "string") return "";
  const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : "";
}

function getRecipeNutritionAndMedia(recipe, adaptedIngredients = null) {
  const met = typeof getMenuItemById === "function" ? getMenuItemById("metodo", recipe.metodo) : null;
  const accentColor = met?.color || "#4f46e5";

  const hasAdaptedChanges = Array.isArray(adaptedIngredients) && adaptedIngredients.some((i) => i.isAdapted);
  const baseNutrition =
    !hasAdaptedChanges && RECIPE_NUTRITION_DATA[recipe.id]
      ? RECIPE_NUTRITION_DATA[recipe.id]
      : computeDynamicNutritionForRecipe(recipe, adaptedIngredients || recipe.ingredients);

  const fallbackSvg = buildRecipeIllustrationSvg(recipe, accentColor, "plate");
  const primaryPhotoUrl = recipe.imageUrl || extractYouTubeThumbUrl(recipe.videoUrl) || fallbackSvg;

  const photos = [
    {
      url: primaryPhotoUrl,
      fallbackUrl: fallbackSvg,
      caption: recipe.title,
      isCustom: false
    }
  ];

  const videoChapters = (recipe.steps || []).map((step, idx) => ({
    index: idx,
    title: `Paso ${idx + 1}`,
    text: typeof step === "string" ? step : step.text,
    timerMinutes: (typeof step === "object" && step.timerMinutes) || null,
    videoStartSec: (typeof step === "object" && typeof step.videoStartSec === "number") ? step.videoStartSec : null
  }));

  return {
    nutrition: { ...baseNutrition },
    lightFactor: 0.82,
    photos,
    videoUrl: recipe.videoUrl || "",
    videoTitle: recipe.videoTitle || "",
    videoChannel: recipe.videoChannel || "",
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

function evaluateDietCompatibility(nutrition, dietPlanKey, lightMode, adaptationInfo = null) {
  const plan = DIET_PLANS[dietPlanKey] || DIET_PLANS.balanced;
  const perServing = getAdjustedNutrition(nutrition, lightMode);

  const kcalPct = Math.round((perServing.kcal / plan.kcal) * 100);
  const proteinPct = Math.round((perServing.protein / plan.proteinG) * 100);
  const carbsPct = Math.round((perServing.carbs / plan.carbsG) * 100);
  const fatPct = Math.round((perServing.fat / plan.fatG) * 100);

  let status = "good";
  let message = "Aporte balanceado dentro de tu objetivo seleccionado.";

  const adaptedActive = Boolean(adaptationInfo && adaptationInfo.changedCount > 0 && adaptationInfo.isAdaptedActive);
  const needsAdaptation = Boolean(adaptationInfo && adaptationInfo.changedCount > 0 && !adaptationInfo.isAdaptedActive);

  if (["sin_gluten", "sin_lactosa", "vegana", "vegetariana", "bajo_sodio", "sin_azucar"].includes(plan.key)) {
    if (!adaptationInfo || adaptationInfo.changedCount === 0) {
      status = "optimal";
      message = `100% apta originalmente para dieta ${plan.label} (${perServing.kcal} kcal / porción).`;
    } else if (adaptedActive) {
      status = "optimal";
      message = `Receta adaptada a ${plan.label}: se sustituyeron ${adaptationInfo.changedCount} ${adaptationInfo.changedCount === 1 ? "ingrediente" : "ingredientes"} automáticamente.`;
    } else if (needsAdaptation) {
      status = "warning";
      message = `Contiene ${adaptationInfo.changedCount} ${adaptationInfo.changedCount === 1 ? "ingrediente" : "ingredientes"} a sustituir para ${plan.label}. Activá «Adaptar ingredientes» arriba.`;
    }
  } else if (plan.key === "keto") {
    if (perServing.carbs <= 14) {
      status = "optimal";
      message = `Excelente para Keto: solo ${perServing.carbs} g de carbohidratos por porción.`;
    } else if (perServing.carbs <= 26) {
      status = "good";
      message = `Apto para Low-Carb moderado (${perServing.carbs} g de carbos / porc.).`;
    } else {
      status = "warning";
      message = adaptedActive
        ? `Versión reducida en carbos (${perServing.carbs} g / porc.); moderá el tamaño de la porción.`
        : `Carbohidratos altos (${perServing.carbs} g) para Keto; activá la adaptación de ingredientes para usar base low-carb.`;
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
      message = `Porción calórica exigente (${perServing.kcal} kcal); activá el ajuste liviano (-18%) o acompañá con ensalada.`;
    }
  } else if (plan.key === "muscle") {
    if (perServing.protein >= 26) {
      status = "optimal";
      message = `Excelente densidad proteica (${perServing.protein} g de proteína por porción).`;
    } else if (perServing.protein >= 14) {
      status = "good";
      message = `Buen aporte (${perServing.protein} g prot.); ideal combinada con huevo, pollo o legumbres.`;
    } else {
      status = "warning";
      message = `Moderada en proteína (${perServing.protein} g); sumá una fuente proteica al plato.`;
    }
  } else {
    if (kcalPct <= 28) {
      status = "optimal";
      message = `Plato equilibrado y liviano (${perServing.kcal} kcal · ${kcalPct}% de 2000 kcal diarias).`;
    } else if (kcalPct <= 38) {
      status = "good";
      message = `Aporte calórico moderado (${perServing.kcal} kcal · ${kcalPct}% de la meta diaria).`;
    } else {
      status = "warning";
      message = `Plato contundente (${perServing.kcal} kcal · ${kcalPct}% del día); acompañalo con vegetales frescos.`;
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
