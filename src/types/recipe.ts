export type CookingMethod =
  | "freidora_aire"
  | "horno"
  | "cocina"
  | "microondas"
  | "sin_coccion";

export type MealTime =
  | "desayuno"
  | "almuerzo"
  | "merienda"
  | "cena"
  | "snack"
  | "postre";

export interface CookingMethodDetail {
  method: CookingMethod;
  temperatureC?: number;
  timeMinutes?: number;
  notes?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

export type ResourceType = "video" | "archivo" | "web";

export interface MediaResource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  calories: number; // kcal por porción
  servings: number;
  prepTimeMinutes: number;
  mealTimes: MealTime[];
  cookingMethods: CookingMethodDetail[];
  ingredients: Ingredient[];
  steps: string[];
  resources: MediaResource[];
  sourceUrl?: string;
  coverImage?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  recipeId?: string;
  recipeTitle?: string;
  createdAt: string;
}

export interface SupermarketOffer {
  supermarketId: string;
  supermarketName: string;
  color: string;
  estimatedTotal: number;
  matchedItems: number;
  missingItems: number;
  isDemo: boolean;
  itemBreakdown: {
    itemName: string;
    price: number | null;
    available: boolean;
  }[];
}
