"use client";

import React, { useState } from "react";
import {
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { COOKING_METHOD_LABELS, MEAL_TIME_LABELS } from "@/lib/constants";
import type {
  CookingMethod,
  CookingMethodDetail,
  Ingredient,
  MealTime,
  MediaResource,
  Recipe,
  ResourceType,
} from "@/types/recipe";

interface RecipeFormModalProps {
  initialRecipe?: Recipe | null;
  onClose: () => void;
  onSave: (data: Omit<Recipe, "id" | "createdAt" | "updatedAt">, existingId?: string) => Promise<void>;
}

const ALL_MEAL_TIMES: MealTime[] = [
  "desayuno",
  "almuerzo",
  "merienda",
  "cena",
  "snack",
  "postre",
];

const ALL_COOKING_METHODS: CookingMethod[] = [
  "freidora_aire",
  "horno",
  "cocina",
  "microondas",
  "sin_coccion",
];

export function RecipeFormModal({
  initialRecipe,
  onClose,
  onSave,
}: RecipeFormModalProps) {
  const [title, setTitle] = useState(initialRecipe?.title ?? "");
  const [description, setDescription] = useState(
    initialRecipe?.description ?? ""
  );
  const [calories, setCalories] = useState<number>(
    initialRecipe?.calories ?? 350
  );
  const [servings, setServings] = useState<number>(
    initialRecipe?.servings ?? 2
  );
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(
    initialRecipe?.prepTimeMinutes ?? 20
  );
  const [sourceUrl, setSourceUrl] = useState(initialRecipe?.sourceUrl ?? "");
  const [mealTimes, setMealTimes] = useState<MealTime[]>(
    initialRecipe?.mealTimes ?? ["almuerzo"]
  );
  const [cookingMethods, setCookingMethods] = useState<CookingMethodDetail[]>(
    initialRecipe?.cookingMethods ?? [{ method: "freidora_aire", temperatureC: 180, timeMinutes: 15 }]
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialRecipe?.ingredients ?? [
      { id: crypto.randomUUID(), name: "", quantity: 1, unit: "unidad" },
    ]
  );
  const [steps, setSteps] = useState<string[]>(
    initialRecipe?.steps.length ? initialRecipe.steps : [""]
  );
  const [resources, setResources] = useState<MediaResource[]>(
    initialRecipe?.resources ?? []
  );

  // Nuevo recurso web/video por URL
  const [newLinkType, setNewLinkType] = useState<ResourceType>("web");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMealTime = (mt: MealTime) => {
    setMealTimes((prev) =>
      prev.includes(mt) ? prev.filter((item) => item !== mt) : [...prev, mt]
    );
  };

  const toggleCookingMethod = (method: CookingMethod) => {
    setCookingMethods((prev) => {
      const exists = prev.find((c) => c.method === method);
      if (exists) {
        return prev.filter((c) => c.method !== method);
      }
      return [
        ...prev,
        {
          method,
          temperatureC: COOKING_METHOD_LABELS[method].defaultTemp,
          timeMinutes: 15,
        },
      ];
    });
  };

  const updateCookingMethodDetail = (
    method: CookingMethod,
    patch: Partial<CookingMethodDetail>
  ) => {
    setCookingMethods((prev) =>
      prev.map((c) => (c.method === method ? { ...c, ...patch } : c))
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir archivo");

      setResources((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: data.type === "video" ? "video" : "archivo",
          title: data.title,
          url: data.url,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    setResources((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: newLinkType,
        title: newLinkTitle.trim() || newLinkUrl.trim(),
        url: newLinkUrl.trim(),
      },
    ]);
    setNewLinkTitle("");
    setNewLinkUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título de la receta es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cleanIngredients = ingredients.filter((i) => i.name.trim() !== "");
      const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);

      await onSave(
        {
          title: title.trim(),
          description: description.trim(),
          calories: Number(calories) || 0,
          servings: Math.max(1, Number(servings) || 1),
          prepTimeMinutes: Math.max(1, Number(prepTimeMinutes) || 15),
          mealTimes,
          cookingMethods,
          ingredients: cleanIngredients,
          steps: cleanSteps,
          resources,
          sourceUrl: sourceUrl.trim() || undefined,
          isFavorite: initialRecipe?.isFavorite ?? false,
        },
        initialRecipe?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/95">
          <h2 className="text-xl font-bold">
            {initialRecipe ? "Editar Receta" : "Nueva Receta"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre de la receta *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Pechuga de pollo en freidora de aire"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Descripción o notas
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve resumen, tips o por qué te gustó esta receta..."
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Calorías (kcal / porción)
                </label>
                <input
                  type="number"
                  min={0}
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Porciones
                </label>
                <input
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tiempo total (min)
                </label>
                <input
                  type="number"
                  min={1}
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                URL de internet (donde sacaste la receta)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
              />
            </div>
          </div>

          {/* Momentos del día */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Momento del día
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_MEAL_TIMES.map((mt) => {
                const selected = mealTimes.includes(mt);
                const info = MEAL_TIME_LABELS[mt];
                return (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => toggleMealTime(mt)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? info.badgeClass
                        : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400"
                    }`}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Medios de cocción */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Medios de cocción (puedes elegir uno o varios)
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_COOKING_METHODS.map((method) => {
                const selected = cookingMethods.some((c) => c.method === method);
                const info = COOKING_METHOD_LABELS[method];
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleCookingMethod(method)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? info.badgeClass
                        : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400"
                    }`}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>

            {cookingMethods.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {cookingMethods.map((cm) => (
                  <div
                    key={cm.method}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-800/40"
                  >
                    <div className="flex items-center text-xs font-bold text-stone-700 dark:text-stone-200">
                      {COOKING_METHOD_LABELS[cm.method].label}
                    </div>
                    <input
                      type="number"
                      placeholder="Temp °C"
                      value={cm.temperatureC ?? ""}
                      onChange={(e) =>
                        updateCookingMethodDetail(cm.method, {
                          temperatureC: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-900"
                    />
                    <input
                      type="number"
                      placeholder="Minutos"
                      value={cm.timeMinutes ?? ""}
                      onChange={(e) =>
                        updateCookingMethodDetail(cm.method, {
                          timeMinutes: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-900"
                    />
                    <input
                      type="text"
                      placeholder="Nota (ej. precalentar)"
                      value={cm.notes ?? ""}
                      onChange={(e) =>
                        updateCookingMethodDetail(cm.method, {
                          notes: e.target.value,
                        })
                      }
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-900"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingredientes */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Ingredientes</label>
              <button
                type="button"
                onClick={() =>
                  setIngredients((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), name: "", quantity: 1, unit: "g" },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar ingrediente
              </button>
            </div>

            {ingredients.map((ing, idx) => (
              <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Ingrediente (ej. Pechuga de pollo)"
                  value={ing.name}
                  onChange={(e) =>
                    setIngredients((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, name: e.target.value } : item
                      )
                    )
                  }
                  className="col-span-6 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-950"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Cant."
                  value={ing.quantity}
                  onChange={(e) =>
                    setIngredients((prev) =>
                      prev.map((item, i) =>
                        i === idx
                          ? { ...item, quantity: Number(e.target.value) }
                          : item
                      )
                    )
                  }
                  className="col-span-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-950"
                />
                <input
                  type="text"
                  placeholder="Unidad (g, ml, u)"
                  value={ing.unit}
                  onChange={(e) =>
                    setIngredients((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, unit: e.target.value } : item
                      )
                    )
                  }
                  className="col-span-3 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-950"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIngredients((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="col-span-1 flex justify-center text-stone-400 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Pasos */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Pasos de preparación</label>
              <button
                type="button"
                onClick={() => setSteps((prev) => [...prev, ""])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar paso
              </button>
            </div>
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-400 w-5">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  placeholder={`Paso ${idx + 1}...`}
                  value={step}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((s, i) => (i === idx ? e.target.value : s))
                    )
                  }
                  className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-950"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSteps((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="text-stone-400 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Videos, Archivos y Páginas Web */}
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-800/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-semibold">
                Videos, Archivos y Páginas Web
              </label>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploading ? "Subiendo..." : "Subir Video o Archivo"}
                <input
                  type="file"
                  accept="video/*,application/pdf,image/*,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <select
                value={newLinkType}
                onChange={(e) => setNewLinkType(e.target.value as ResourceType)}
                className="sm:col-span-3 rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs dark:border-stone-700 dark:bg-stone-950"
              >
                <option value="web">Página Web</option>
                <option value="video">Video (YouTube / Link)</option>
              </select>
              <input
                type="text"
                placeholder="Título (ej. Video TikTok)"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                className="sm:col-span-4 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-950"
              />
              <input
                type="url"
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="sm:col-span-4 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-950"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="sm:col-span-1 flex items-center justify-center rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {resources.length > 0 && (
              <ul className="space-y-1.5 pt-2">
                {resources.map((res) => (
                  <li
                    key={res.id}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 dark:bg-stone-900"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {res.type === "video" ? (
                        <Video className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      )}
                      <span className="font-medium truncate">{res.title}</span>
                      <span className="text-stone-400 uppercase text-[10px]">
                        ({res.type})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setResources((prev) =>
                          prev.filter((item) => item.id !== res.id)
                        )
                      }
                      className="text-stone-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialRecipe ? "Guardar cambios" : "Crear receta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
