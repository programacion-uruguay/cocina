import type { ShoppingItem, SupermarketOffer } from "@/types/recipe";

/**
 * Interfaz extensible para conectar APIs o scrapers reales de supermercados en el futuro.
 * Cada supermercado implementará `fetchProductPrice(query)` para obtener precios reales.
 */
export interface SupermarketConnector {
  id: string;
  name: string;
  color: string;
  isDemo: boolean;
  estimateItemPrice: (item: ShoppingItem) => number | null;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function basePriceEstimate(itemName: string, quantity: number): number {
  const normalized = itemName.toLowerCase();
  let base = 1800;

  if (normalized.includes("pollo") || normalized.includes("carne") || normalized.includes("salmón") || normalized.includes("salmon")) {
    base = 5200;
  } else if (normalized.includes("aceite") || normalized.includes("queso")) {
    base = 3800;
  } else if (normalized.includes("yogur") || normalized.includes("leche") || normalized.includes("huevo")) {
    base = 2400;
  } else if (normalized.includes("papa") || normalized.includes("banana") || normalized.includes("limón") || normalized.includes("avena")) {
    base = 1200;
  }

  const factor = quantity > 100 ? Math.max(1, quantity / 250) : Math.max(1, Math.min(quantity, 4) * 0.6);
  return Math.round(base * factor);
}

export const SUPERMARKET_CONNECTORS: SupermarketConnector[] = [
  {
    id: "carrefour",
    name: "Carrefour",
    color: "#1d4ed8",
    isDemo: true,
    estimateItemPrice: (item) => {
      const base = basePriceEstimate(item.name, item.quantity);
      const variance = (hashString(`carrefour-${item.name}`) % 18) - 8; // -8% a +9%
      return Math.round((base * (100 + variance)) / 100);
    },
  },
  {
    id: "coto",
    name: "Coto",
    color: "#dc2626",
    isDemo: true,
    estimateItemPrice: (item) => {
      const base = basePriceEstimate(item.name, item.quantity);
      const variance = (hashString(`coto-${item.name}`) % 20) - 10;
      return Math.round((base * (100 + variance)) / 100);
    },
  },
  {
    id: "dia",
    name: "Supermercados Día",
    color: "#ea580c",
    isDemo: true,
    estimateItemPrice: (item) => {
      const base = basePriceEstimate(item.name, item.quantity);
      const variance = (hashString(`dia-${item.name}`) % 16) - 11;
      return Math.round((base * (100 + variance)) / 100);
    },
  },
  {
    id: "jumbo",
    name: "Jumbo",
    color: "#15803d",
    isDemo: true,
    estimateItemPrice: (item) => {
      const base = basePriceEstimate(item.name, item.quantity);
      const variance = (hashString(`jumbo-${item.name}`) % 18) - 4;
      return Math.round((base * (100 + variance)) / 100);
    },
  },
];

export function compareSupermarketPrices(items: ShoppingItem[]): SupermarketOffer[] {
  const pendingItems = items.filter((item) => !item.checked);

  return SUPERMARKET_CONNECTORS.map((connector) => {
    let estimatedTotal = 0;
    let matchedItems = 0;
    let missingItems = 0;

    const itemBreakdown = pendingItems.map((item) => {
      const price = connector.estimateItemPrice(item);
      if (price === null) {
        missingItems += 1;
        return { itemName: item.name, price: null, available: false };
      }
      matchedItems += 1;
      estimatedTotal += price;
      return { itemName: item.name, price, available: true };
    });

    return {
      supermarketId: connector.id,
      supermarketName: connector.name,
      color: connector.color,
      estimatedTotal,
      matchedItems,
      missingItems,
      isDemo: connector.isDemo,
      itemBreakdown,
    };
  }).sort((a, b) => a.estimatedTotal - b.estimatedTotal);
}
