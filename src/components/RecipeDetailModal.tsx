"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Download,
  ExternalLink,
  Flame,
  Heart,
  Link2,
  Paperclip,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  COOKING_METHOD_LABELS,
  MEAL_TIME_LABELS,
  getYoutubeEmbedUrl,
  isDirectVideoUrl,
} from "@/lib/constants";
import type { Ingredient, Recipe } from "@/types/recipe";

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onAddIngredientsToShopping: (
    ingredients: Ingredient[],
    recipe: Recipe
  ) => Promise<void>;
}

export function RecipeDetailModal({
  recipe,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddIngredientsToShopping,
}: RecipeDetailModalProps) {
  const [servings, setServings] = useState<number>(recipe.servings || 1);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(
    {}
  );
  const [addingShopping, setAddingShopping] = useState(false);
  const [shoppingSuccess, setShoppingSuccess] = useState(false);

  const scale = servings / (recipe.servings || 1);

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAddAll = async () => {
    setAddingShopping(true);
    try {
      const scaledIngredients = recipe.ingredients.map((ing) => ({
        ...ing,
        quantity: Number((ing.quantity * scale).toFixed(2)),
      }));
      await onAddIngredientsToShopping(scaledIngredients, recipe);
      setShoppingSuccess(true);
      setTimeout(() => setShoppingSuccess(false), 2500);
    } finally {
      setAddingShopping(false);
    }
  };

  const handleAddSingle = async (ing: Ingredient) => {
    await onAddIngredientsToShopping(
      [{ ...ing, quantity: Number((ing.quantity * scale).toFixed(2)) }],
      recipe
    );
    setShoppingSuccess(true);
    setTimeout(() => setShoppingSuccess(false), 2000);
  };

  const videos = recipe.resources.filter((r) => r.type === "video");
  const files = recipe.resources.filter((r) => r.type === "archivo");
  const webLinks = recipe.resources.filter((r) => r.type === "web");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/95">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {recipe.mealTimes.map((mt) => {
                const info = MEAL_TIME_LABELS[mt];
                return (
                  <span
                    key={mt}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${info.badgeClass}`}
                  >
                    {info.label}
                  </span>
                );
              })}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {recipe.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(recipe)}
              className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Favorita"
            >
              <Heart
                className={`h-5 w-5 ${
                  recipe.isFavorite ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => onEdit(recipe)}
              className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 hover:text-amber-600 dark:hover:bg-stone-800"
              title="Editar receta"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(recipe.id)}
              className="rounded-xl p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
              title="Eliminar receta"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Description & Key Metrics */}
          {recipe.description && (
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              {recipe.description}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3.5 dark:border-orange-900/60 dark:bg-orange-950/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-300">
                <Flame className="h-4 w-4" />
                Calorías / porción
              </div>
              <div className="mt-1 text-xl font-bold text-orange-900 dark:text-orange-100">
                {recipe.calories} kcal
              </div>
              <div className="text-xs text-orange-700/80 dark:text-orange-300/80">
                Total ({servings} porc.): {Math.round(recipe.calories * servings)} kcal
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-800 dark:bg-stone-800/50">
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                <Clock className="h-4 w-4" />
                Tiempo estimado
              </div>
              <div className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-100">
                {recipe.prepTimeMinutes} min
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-800 dark:bg-stone-800/50 col-span-2 sm:col-span-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                  <Users className="h-4 w-4" />
                  Porciones (ajusta cantidades)
                </div>
                <div className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-100">
                  {servings} {servings === 1 ? "porción" : "porciones"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="h-9 w-9 rounded-xl border border-stone-300 bg-white font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  className="h-9 w-9 rounded-xl border border-stone-300 bg-white font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Medios de Cocción */}
          {recipe.cookingMethods.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                Medios de cocción compatibles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.cookingMethods.map((cm) => {
                  const info = COOKING_METHOD_LABELS[cm.method];
                  return (
                    <div
                      key={cm.method}
                      className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-800/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${info.badgeClass}`}
                        >
                          {info.label}
                        </span>
                        <div className="text-sm font-medium text-stone-700 dark:text-stone-300">
                          {cm.temperatureC ? `${cm.temperatureC}°C` : ""}
                          {cm.temperatureC && cm.timeMinutes ? " · " : ""}
                          {cm.timeMinutes ? `${cm.timeMinutes} min` : ""}
                        </div>
                      </div>
                      {cm.notes && (
                        <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
                          {cm.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Ingredientes y Pasos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-stone-200 p-5 dark:border-stone-800">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Ingredientes ({recipe.ingredients.length})
                </h3>
                {recipe.ingredients.length > 0 && (
                  <button
                    type="button"
                    disabled={addingShopping}
                    onClick={handleAddAll}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {shoppingSuccess ? "¡Agregados!" : "Todo a Compras"}
                  </button>
                )}
              </div>

              {recipe.ingredients.length === 0 ? (
                <p className="text-sm text-stone-500">Sin ingredientes cargados.</p>
              ) : (
                <ul className="space-y-2.5">
                  {recipe.ingredients.map((ing) => {
                    const scaledQty = Number((ing.quantity * scale).toFixed(2));
                    return (
                      <li
                        key={ing.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 text-sm dark:bg-stone-800/60"
                      >
                        <div>
                          <span className="font-semibold text-stone-900 dark:text-stone-100">
                            {scaledQty} {ing.unit}
                          </span>{" "}
                          <span className="text-stone-700 dark:text-stone-300">
                            {ing.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddSingle(ing)}
                          title="Agregar ingrediente a lista de compras"
                          className="rounded-lg p-1 text-stone-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-950/60 dark:hover:text-amber-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-stone-200 p-5 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
                Preparación paso a paso
              </h3>
              {recipe.steps.length === 0 ? (
                <p className="text-sm text-stone-500">Sin pasos cargados.</p>
              ) : (
                <ol className="space-y-3">
                  {recipe.steps.map((step, idx) => {
                    const done = Boolean(completedSteps[idx]);
                    return (
                      <li
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl p-2.5 text-sm transition ${
                          done
                            ? "bg-emerald-50/70 text-stone-400 line-through dark:bg-emerald-950/20"
                            : "bg-stone-50 text-stone-700 hover:bg-stone-100 dark:bg-stone-800/60 dark:text-stone-200"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                        )}
                        <span>
                          <strong className="mr-1.5 text-stone-900 dark:text-stone-100">
                            {idx + 1}.
                          </strong>
                          {step}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>

          {/* Recursos Multimedia: Videos, Archivos y Páginas Web */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Videos, Archivos y Páginas Web
            </h3>

            {videos.length === 0 &&
              files.length === 0 &&
              webLinks.length === 0 &&
              !recipe.sourceUrl && (
                <p className="text-sm text-stone-500">
                  No hay videos, archivos ni enlaces guardados en esta receta.
                </p>
              )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((vid) => {
                  const ytEmbed = getYoutubeEmbedUrl(vid.url);
                  const isDirect = isDirectVideoUrl(vid.url, vid.mimeType);
                  return (
                    <div
                      key={vid.id}
                      className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-800/40"
                    >
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300">
                        <Video className="h-4 w-4 text-indigo-500" />
                        <span className="truncate">{vid.title}</span>
                      </div>
                      {ytEmbed ? (
                        <iframe
                          src={ytEmbed}
                          title={vid.title}
                          className="aspect-video w-full"
                          allowFullScreen
                        />
                      ) : isDirect ? (
                        <video
                          src={vid.url}
                          controls
                          className="aspect-video w-full bg-black"
                        />
                      ) : (
                        <div className="p-4">
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Ver video externo
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Archivos y Webs */}
            <div className="flex flex-wrap gap-3">
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
                >
                  <Link2 className="h-4 w-4" />
                  Página original de la receta
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {webLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
                >
                  <Link2 className="h-4 w-4" />
                  {link.title}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}

              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  download={file.title}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <Paperclip className="h-4 w-4" />
                  {file.title}
                  <Download className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
