/**
 * Definición de los 4 niveles del menú circular multinivel:
 * Nivel 1: Método / Equipo de cocción
 * Nivel 2: Momento del día
 * Nivel 3: Tipo de plato / Ingrediente principal
 * Nivel 4: Estilo / Tiempo
 */

const MENU_LEVELS = [
  {
    key: "metodo",
    title: "Método",
    items: [
      {
        id: "freidora",
        label: "Freidora de aire",
        shortLabel: "Freidora",
        emoji: "🌀",
        color: "#3b82f6",
        icon: '<path d="M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7z"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M19 12h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2"/><path d="M9 14h6"/>'
      },
      {
        id: "horno",
        label: "Horno",
        shortLabel: "Horno",
        emoji: "🔥",
        color: "#ef4444",
        icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="7" cy="7.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="17" cy="7.5" r="1"/><rect x="6" y="11" width="12" height="6" rx="1"/>'
      },
      {
        id: "cocina",
        label: "Cocina / Olla",
        shortLabel: "Cocina",
        emoji: "🍲",
        color: "#22c55e",
        icon: '<path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z"/><path d="M2 12h20"/><path d="M9 8c0-1.5 1-2 1-3.5"/><path d="M15 8c0-1.5 1-2 1-3.5"/>'
      },
      {
        id: "parrilla",
        label: "Parrilla / Plancha",
        shortLabel: "Parrilla",
        emoji: "🔥",
        color: "#f59e0b",
        icon: '<path d="M4 10h16"/><path d="M6 10v9"/><path d="M18 10v9"/><path d="M8 10v5"/><path d="M12 10v5"/><path d="M16 10v5"/><path d="M9 6c0-1.5 1.5-2 1.5-3.5"/><path d="M14 6c0-1.5 1.5-2 1.5-3.5"/>'
      },
      {
        id: "microondas",
        label: "Microondas",
        shortLabel: "Micro",
        emoji: "⚡",
        color: "#06b6d4",
        icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><rect x="5" y="8" width="10" height="8" rx="1"/><path d="M18 9v.01"/><path d="M18 12v.01"/><path d="M8 12c1-1.5 2 1.5 3 0"/>'
      },
      {
        id: "sin_coccion",
        label: "Sin cocción",
        shortLabel: "Fresco",
        emoji: "🥗",
        color: "#a855f7",
        icon: '<path d="M12 2v20"/><path d="M17 5l-5 5-5-5"/><path d="M17 19l-5-5-5 5"/><path d="M2 12h20"/>'
      }
    ]
  },
  {
    key: "momento",
    title: "Momento",
    items: [
      {
        id: "desayuno",
        label: "Desayuno",
        shortLabel: "Desayuno",
        emoji: "☀️",
        color: "#f59e0b",
        icon: '<path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/>'
      },
      {
        id: "almuerzo",
        label: "Almuerzo",
        shortLabel: "Almuerzo",
        emoji: "🍽️",
        color: "#22c55e",
        icon: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>'
      },
      {
        id: "merienda",
        label: "Merienda",
        shortLabel: "Merienda",
        emoji: "☕",
        color: "#06b6d4",
        icon: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>'
      },
      {
        id: "cena",
        label: "Cena",
        shortLabel: "Cena",
        emoji: "🌙",
        color: "#3b82f6",
        icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
      },
      {
        id: "snacks",
        label: "Snacks / Postres",
        shortLabel: "Snacks",
        emoji: "✨",
        color: "#ec4899",
        icon: '<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/>'
      }
    ]
  },
  {
    key: "categoria",
    title: "Categoría",
    items: [
      {
        id: "pollo",
        label: "Pollo",
        shortLabel: "Pollo",
        emoji: "🍗",
        color: "#f59e0b",
        icon: '<path d="M15.5 7.5a4.5 4.5 0 0 0-6.36 0L5.5 11.14a3.5 3.5 0 0 0 4.95 4.95l.86-.86"/><path d="M16 14l4 4"/><circle cx="20.5" cy="18.5" r="1.5"/><path d="M15.5 7.5c1.5-1.5 3.5-.5 4 1s-.5 3-2 4.5l-4.5 4.5"/>'
      },
      {
        id: "carnes",
        label: "Carnes",
        shortLabel: "Carnes",
        emoji: "🥩",
        color: "#ef4444",
        icon: '<path d="M19 9c0 4.5-3.5 8-8 8-3.5 0-6-2-6-5 0-3.5 3.5-7 8-7 3.5 0 6 1.5 6 4z"/><circle cx="13" cy="10" r="2"/>'
      },
      {
        id: "verduras",
        label: "Verduras",
        shortLabel: "Verduras",
        emoji: "🥦",
        color: "#22c55e",
        icon: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'
      },
      {
        id: "pastas",
        label: "Pastas y Arroz",
        shortLabel: "Pastas",
        emoji: "🍝",
        color: "#eab308",
        icon: '<path d="M3 13h18"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M7 9c1-2 3-2 4 0s3 2 4 0 3-2 4 0"/>'
      },
      {
        id: "pescados",
        label: "Pescados",
        shortLabel: "Pescado",
        emoji: "🐟",
        color: "#06b6d4",
        icon: '<path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6s-7.56-2.54-8.5-6z"/><path d="M18 12v.01"/><path d="M2 9l4.5 3L2 15V9z"/>'
      },
      {
        id: "dulces",
        label: "Dulces y Panes",
        shortLabel: "Dulces",
        emoji: "🧁",
        color: "#a855f7",
        icon: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/>'
      }
    ]
  },
  {
    key: "estilo",
    title: "Estilo",
    items: [
      {
        id: "express",
        label: "Express (<20 min)",
        shortLabel: "Express",
        emoji: "⚡",
        color: "#f97316",
        icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
      },
      {
        id: "fit",
        label: "Saludable / Fit",
        shortLabel: "Fit",
        emoji: "💚",
        color: "#10b981",
        icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
      },
      {
        id: "clasico",
        label: "Clásico",
        shortLabel: "Clásico",
        emoji: "⭐",
        color: "#3b82f6",
        icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
      },
      {
        id: "economico",
        label: "Económico",
        shortLabel: "Económico",
        emoji: "💰",
        color: "#8b5cf6",
        icon: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 2 5 1.5 5 3.5a2.5 2.5 0 0 1-5 0"/><line x1="12" y1="6" x2="12" y2="18"/>'
      }
    ]
  }
];

function getMenuItemById(levelKey, id) {
  const level = MENU_LEVELS.find((l) => l.key === levelKey);
  if (!level) return null;
  return level.items.find((item) => item.id === id) || null;
}
