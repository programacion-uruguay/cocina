import React from "react";
import {
  Clock,
  Flame,
  Heart,
  Link2,
  Paperclip,
  Users,
  Video,
} from "lucide-react";
import { COOKING_METHOD_LABELS, MEAL_TIME_LABELS } from "@/lib/constants";
import type { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe, e: React.MouseEvent) => void;
}

export function RecipeCard({
  recipe,
  onSelect,
  onToggleFavorite,
}: RecipeCardProps) {
  const videoCount = recipe.resources.filter((r) => r.type === "video").length;
  const fileCount = recipe.resources.filter((r) => r.type === "archivo").length;
  const webCount =
    recipe.resources.filter((r) => r.type === "web").length +
    (recipe.sourceUrl &&
    !recipe.resources.some((r) => r.url === recipe.sourceUrl)
      ? 1
      : 0);

  return (
    <article
      onClick={() => onSelect(recipe)}
      className="group cursor-pointer rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-700 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {recipe.mealTimes.map((mt) => {
              const info = MEAL_TIME_LABELS[mt];
              return (
                <span
                  key={mt}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${info.badgeClass}`}
                >
                  {info.label}
                </span>
              );
            })}
          </div>
          <button
            type="button"
            onClick={(e) => onToggleFavorite(recipe, e)}
            title={recipe.isFavorite ? "Quitar de favoritas" : "Marcar como favorita"}
            className="rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-rose-500 dark:hover:bg-stone-800"
          >
            <Heart
              className={`h-5 w-5 ${
                recipe.isFavorite ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </button>
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-stone-900 group-hover:text-amber-700 dark:text-stone-100 dark:group-hover:text-amber-400">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {recipe.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {recipe.cookingMethods.map((cm) => {
            const info = COOKING_METHOD_LABELS[cm.method];
            return (
              <span
                key={cm.method}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${info.badgeClass}`}
              >
                {info.shortLabel}
                {cm.temperatureC ? ` · ${cm.temperatureC}°C` : ""}
                {cm.timeMinutes ? ` · ${cm.timeMinutes}m` : ""}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-stone-100 pt-3.5 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
            <Flame className="h-3.5 w-3.5" />
            {recipe.calories} kcal
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {recipe.prepTimeMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {recipe.servings}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {videoCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400" title="Videos adjuntos">
              <Video className="h-3.5 w-3.5" />
              {videoCount}
            </span>
          )}
          {fileCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400" title="Archivos adjuntos">
              <Paperclip className="h-3.5 w-3.5" />
              {fileCount}
            </span>
          )}
          {webCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400" title="Enlaces web">
              <Link2 className="h-3.5 w-3.5" />
              {webCount}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
