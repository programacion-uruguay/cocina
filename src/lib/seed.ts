import type { Recipe } from "@/types/recipe";

export const SEED_RECIPES: Recipe[] = [
  {
    id: "receta-pollo-airfryer",
    title: "Pechuga de Pollo Crujiente con Papas Rústicas",
    description:
      "Receta rápida y alta en proteínas ideal para freidora de aire, aunque también incluye adaptación para horno tradicional.",
    calories: 485,
    servings: 2,
    prepTimeMinutes: 25,
    mealTimes: ["almuerzo", "cena"],
    cookingMethods: [
      {
        method: "freidora_aire",
        temperatureC: 190,
        timeMinutes: 18,
        notes: "Dar vuelta a la mitad del tiempo para que quede dorado parejo.",
      },
      {
        method: "horno",
        temperatureC: 210,
        timeMinutes: 30,
        notes: "Precalentar 10 minutos antes en bandeja con papel manteca.",
      },
    ],
    ingredients: [
      { id: "ing-1", name: "Pechuga de pollo", quantity: 400, unit: "g" },
      { id: "ing-2", name: "Papas", quantity: 350, unit: "g" },
      { id: "ing-3", name: "Aceite de oliva", quantity: 1, unit: "cucharada" },
      { id: "ing-4", name: "Pimentón dulce y ajo en polvo", quantity: 1, unit: "cucharadita" },
    ],
    steps: [
      "Cortar las papas en gajos medianos y el pollo en tiras o cubos parejos.",
      "Mezclar todo en un bowl con el aceite de oliva, sal, pimentón y ajo en polvo.",
      "Cocinar en la freidora de aire a 190°C durante 18 minutos, agitando la canasta a los 9 minutos.",
    ],
    resources: [
      {
        id: "res-1",
        type: "web",
        title: "Receta original de referencia",
        url: "https://www.bonappetit.com",
      },
    ],
    sourceUrl: "https://www.bonappetit.com",
    isFavorite: true,
    createdAt: "2026-11-10T12:00:00.000Z",
    updatedAt: "2026-11-10T12:00:00.000Z",
  },
  {
    id: "receta-avena-desayuno",
    title: "Panqueques de Avena y Banana",
    description:
      "Desayuno energético sin azúcar agregada, listo en 10 minutos en sartén.",
    calories: 320,
    servings: 1,
    prepTimeMinutes: 10,
    mealTimes: ["desayuno", "merienda"],
    cookingMethods: [
      {
        method: "cocina",
        timeMinutes: 6,
        notes: "Fuego medio-bajo en sartén antiadherente.",
      },
    ],
    ingredients: [
      { id: "ing-5", name: "Banana madura", quantity: 1, unit: "unidad" },
      { id: "ing-6", name: "Huevo", quantity: 2, unit: "unidades" },
      { id: "ing-7", name: "Avena arrollada", quantity: 50, unit: "g" },
      { id: "ing-8", name: "Canela", quantity: 0.5, unit: "cucharadita" },
    ],
    steps: [
      "Pisar la banana en un plato hasta hacer un puré.",
      "Batir los huevos, incorporar la banana, la avena y la canela.",
      "Cocinar por cucharadas en sartén caliente 2 minutos por lado.",
    ],
    resources: [],
    isFavorite: true,
    createdAt: "2026-11-11T09:00:00.000Z",
    updatedAt: "2026-11-11T09:00:00.000Z",
  },
  {
    id: "receta-salmon-horno",
    title: "Salmón al Horno con Limón y Espárragos",
    description:
      "Cena liviana rica en omega 3 con cocción suave al horno.",
    calories: 430,
    servings: 2,
    prepTimeMinutes: 20,
    mealTimes: ["cena", "almuerzo"],
    cookingMethods: [
      {
        method: "horno",
        temperatureC: 195,
        timeMinutes: 15,
        notes: "No sobrecocinar para mantener el salmón jugoso.",
      },
      {
        method: "freidora_aire",
        temperatureC: 185,
        timeMinutes: 10,
        notes: "Ideal si haces solo 1 o 2 filetes.",
      },
    ],
    ingredients: [
      { id: "ing-9", name: "Filetes de salmón", quantity: 300, unit: "g" },
      { id: "ing-10", name: "Espárragos frescos", quantity: 200, unit: "g" },
      { id: "ing-11", name: "Limón", quantity: 1, unit: "unidad" },
      { id: "ing-12", name: "Aceite de oliva", quantity: 1, unit: "cucharada" },
    ],
    steps: [
      "Colocar el salmón y los espárragos en una fuente para horno.",
      "Rociar con aceite de oliva, jugo de limón, sal y pimienta.",
      "Hornear a 195°C por 15 minutos hasta que el salmón se desarme fácilmente con tenedor.",
    ],
    resources: [],
    isFavorite: false,
    createdAt: "2026-11-12T20:00:00.000Z",
    updatedAt: "2026-11-12T20:00:00.000Z",
  },
  {
    id: "receta-yogur-snack",
    title: "Bowl de Yogur Griego, Frutos Rojos y Chía",
    description:
      "Opción fresca sin cocción para merienda o snack rápido.",
    calories: 240,
    servings: 1,
    prepTimeMinutes: 5,
    mealTimes: ["merienda", "snack", "desayuno"],
    cookingMethods: [
      {
        method: "sin_coccion",
        timeMinutes: 5,
      },
    ],
    ingredients: [
      { id: "ing-13", name: "Yogur griego natural", quantity: 170, unit: "g" },
      { id: "ing-14", name: "Frutos rojos", quantity: 80, unit: "g" },
      { id: "ing-15", name: "Semillas de chía", quantity: 1, unit: "cucharada" },
    ],
    steps: [
      "Servir el yogur en un bowl.",
      "Agregar los frutos rojos lavados y las semillas de chía por encima.",
    ],
    resources: [],
    isFavorite: false,
    createdAt: "2026-11-13T16:30:00.000Z",
    updatedAt: "2026-11-13T16:30:00.000Z",
  },
];
