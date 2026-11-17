"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChefHat,
  Cloud,
  Flame,
  HardDrive,
  Heart,
  Loader2,
  Plus,
  Search,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import { COOKING_METHOD_LABELS, MEAL_TIME_LABELS } from "@/lib/constants";
import type {
  CookingMethod,
  Ingredient,
  MealTime,
  Recipe,
  ShoppingItem,
  SupermarketOffer,
} from "@/types/recipe";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeDetailModal } from "@/components/RecipeDetailModal";
import { RecipeFormModal } from "@/components/RecipeFormModal";
import { ShoppingView } from "@/components/ShoppingView";
import { CloudStatusModal } from "@/components/CloudStatusModal";

type ActiveTab = "recetas" | "compras";

export function CocinaApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("recetas");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [offers, setOffers] = useState<SupermarketOffer[]>([]);
  const [storageMode, setStorageMode] = useState<"local" | "supabase">("local");
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [mealFilter, setMealFilter] = useState<MealTime | "todos">("todos");
  const [methodFilter, setMethodFilter] = useState<CookingMethod | "todos">(
    "todos"
  );
  const [maxCalories, setMaxCalories] = useState<number | "todos">("todos");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modales
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recipesRes, shoppingRes, statusRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/shopping"),
        fetch("/api/status"),
      ]);
      const recipesData = await recipesRes.json();
      const shoppingData = await shoppingRes.json();
      const statusData = await statusRes.json();

      if (Array.isArray(recipesData.recipes)) setRecipes(recipesData.recipes);
      if (Array.isArray(shoppingData.items))
        setShoppingItems(shoppingData.items);
      if (Array.isArray(shoppingData.offers)) setOffers(shoppingData.offers);
      if (statusData.mode === "supabase" || statusData.mode === "local") {
        setStorageMode(statusData.mode);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refreshShopping = async () => {
    const res = await fetch("/api/shopping");
    const data = await res.json();
    if (Array.isArray(data.items)) setShoppingItems(data.items);
    if (Array.isArray(data.offers)) setOffers(data.offers);
  };

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes.filter((r) => {
      if (onlyFavorites && !r.isFavorite) return false;
      if (mealFilter !== "todos" && !r.mealTimes.includes(mealFilter))
        return false;
      if (
        methodFilter !== "todos" &&
        !r.cookingMethods.some((cm) => cm.method === methodFilter)
      )
        return false;
      if (maxCalories !== "todos" && r.calories > maxCalories) return false;

      if (q) {
        const inTitle = r.title.toLowerCase().includes(q);
        const inDesc = r.description.toLowerCase().includes(q);
        const inIngredients = r.ingredients.some((i) =>
          i.name.toLowerCase().includes(q)
        );
        if (!inTitle && !inDesc && !inIngredients) return false;
      }
      return true;
    });
  }, [recipes, searchQuery, mealFilter, methodFilter, maxCalories, onlyFavorites]);

  const handleSaveRecipe = async (
    data: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
    existingId?: string
  ) => {
    if (existingId) {
      const res = await fetch(`/api/recipes/${existingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al actualizar");
      setRecipes((prev) =>
        prev.map((r) => (r.id === existingId ? json.recipe : r))
      );
      if (selectedRecipe?.id === existingId) {
        setSelectedRecipe(json.recipe);
      }
    } else {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al crear");
      setRecipes((prev) => [json.recipe, ...prev]);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      setSelectedRecipe(null);
    }
  };

  const handleToggleFavorite = async (
    recipe: Recipe,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    const nextFav = !recipe.isFavorite;
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipe.id ? { ...r, isFavorite: nextFav } : r))
    );
    if (selectedRecipe?.id === recipe.id) {
      setSelectedRecipe({ ...recipe, isFavorite: nextFav });
    }
    await fetch(`/api/recipes/${recipe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: nextFav }),
    });
  };

  const handleAddIngredientsToShopping = async (
    ingredients: Ingredient[],
    recipe: Recipe
  ) => {
    await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
        })),
      }),
    });
    await refreshShopping();
  };

  const handleAddManualShoppingItem = async (
    name: string,
    quantity: number,
    unit: string
  ) => {
    await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity, unit }),
    });
    await refreshShopping();
  };

  const handleToggleShoppingItem = async (item: ShoppingItem) => {
    await fetch("/api/shopping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, checked: !item.checked }),
    });
    await refreshShopping();
  };

  const handleDeleteShoppingItem = async (id: string) => {
    await fetch(`/api/shopping?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await refreshShopping();
  };

  const handleClearChecked = async () => {
    await fetch("/api/shopping?clearChecked=true", { method: "DELETE" });
    await refreshShopping();
  };

  const pendingShoppingCount = shoppingItems.filter((i) => !i.checked).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-sm">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">
                MiRecetario
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Recetas, calorías, cocción y compras
              </p>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1.5 rounded-2xl bg-stone-100 p-1 dark:bg-stone-900">
            <button
              type="button"
              onClick={() => setActiveTab("recetas")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "recetas"
                  ? "bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" />
              Mis Recetas
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs dark:bg-stone-700">
                {recipes.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("compras")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "compras"
                  ? "bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Compras & Supermercados
              {pendingShoppingCount > 0 && (
                <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs text-white">
                  {pendingShoppingCount}
                </span>
              )}
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCloudModal(true)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                storageMode === "supabase"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"
              }`}
            >
              {storageMode === "supabase" ? (
                <Cloud className="h-3.5 w-3.5" />
              ) : (
                <HardDrive className="h-3.5 w-3.5" />
              )}
              {storageMode === "supabase" ? "Nube Activa" : "Modo Local"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingRecipe(null);
                setShowFormModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
              Nueva Receta
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-500">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
            <p className="text-sm">Cargando tus recetas...</p>
          </div>
        ) : activeTab === "recetas" ? (
          <div className="space-y-6">
            {/* Barra de Filtros */}
            <section className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="relative md:col-span-5">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Buscar por receta o ingrediente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white dark:border-stone-700 dark:bg-stone-950"
                  />
                </div>

                <select
                  value={mealFilter}
                  onChange={(e) =>
                    setMealFilter(e.target.value as MealTime | "todos")
                  }
                  className="md:col-span-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
                >
                  <option value="todos">Todo momento</option>
                  {Object.entries(MEAL_TIME_LABELS).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) =>
                    setMethodFilter(e.target.value as CookingMethod | "todos")
                  }
                  className="md:col-span-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
                >
                  <option value="todos">Todos los medios</option>
                  {Object.entries(COOKING_METHOD_LABELS).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>

                <select
                  value={maxCalories}
                  onChange={(e) =>
                    setMaxCalories(
                      e.target.value === "todos"
                        ? "todos"
                        : Number(e.target.value)
                    )
                  }
                  className="md:col-span-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
                >
                  <option value="todos">Cualquier kcal</option>
                  <option value={300}>Hasta 300 kcal</option>
                  <option value={500}>Hasta 500 kcal</option>
                  <option value={800}>Hasta 800 kcal</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOnlyFavorites((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition ${
                      onlyFavorites
                        ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                        : "border-stone-200 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        onlyFavorites ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                    Solo favoritas
                  </button>
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    Mostrando {filteredRecipes.length} de {recipes.length} recetas
                  </span>
                </div>

                {(searchQuery ||
                  mealFilter !== "todos" ||
                  methodFilter !== "todos" ||
                  maxCalories !== "todos" ||
                  onlyFavorites) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setMealFilter("todos");
                      setMethodFilter("todos");
                      setMaxCalories("todos");
                      setOnlyFavorites(false);
                    }}
                    className="font-semibold text-amber-600 hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </section>

            {/* Grilla de Recetas */}
            {filteredRecipes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
                <p className="text-base font-semibold text-stone-700 dark:text-stone-300">
                  No encontramos recetas con esos filtros
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Prueba limpiar los filtros o crea una nueva receta.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onSelect={(r) => setSelectedRecipe(r)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <ShoppingView
            items={shoppingItems}
            offers={offers}
            onAddItem={handleAddManualShoppingItem}
            onToggleItem={handleToggleShoppingItem}
            onDeleteItem={handleDeleteShoppingItem}
            onClearChecked={handleClearChecked}
          />
        )}
      </main>

      {/* Modales */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={(r) => {
            setSelectedRecipe(null);
            setEditingRecipe(r);
            setShowFormModal(true);
          }}
          onDelete={handleDeleteRecipe}
          onToggleFavorite={(r) => handleToggleFavorite(r)}
          onAddIngredientsToShopping={handleAddIngredientsToShopping}
        />
      )}

      {showFormModal && (
        <RecipeFormModal
          initialRecipe={editingRecipe}
          onClose={() => {
            setShowFormModal(false);
            setEditingRecipe(null);
          }}
          onSave={handleSaveRecipe}
        />
      )}

      {showCloudModal && (
        <CloudStatusModal
          mode={storageMode}
          onClose={() => setShowCloudModal(false)}
        />
      )}
    </div>
  );
}
