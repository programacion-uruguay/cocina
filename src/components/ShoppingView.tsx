"use client";

import React, { useState } from "react";
import {
  Check,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import type { ShoppingItem, SupermarketOffer } from "@/types/recipe";

interface ShoppingViewProps {
  items: ShoppingItem[];
  offers: SupermarketOffer[];
  onAddItem: (name: string, quantity: number, unit: string) => Promise<void>;
  onToggleItem: (item: ShoppingItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onClearChecked: () => Promise<void>;
}

export function ShoppingView({
  items,
  offers,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onClearChecked,
}: ShoppingViewProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("unidad");
  const [adding, setAdding] = useState(false);

  const pendingCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;
  const bestOffer = offers.length > 0 && pendingCount > 0 ? offers[0] : null;
  const worstOffer =
    offers.length > 1 && pendingCount > 0 ? offers[offers.length - 1] : null;
  const savings =
    bestOffer && worstOffer
      ? worstOffer.estimatedTotal - bestOffer.estimatedTotal
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await onAddItem(name.trim(), quantity || 1, unit.trim() || "unidad");
      setName("");
      setQuantity(1);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna izquierda: Lista de compras */}
      <div className="lg:col-span-7 space-y-5">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
                Lista de Compras
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {pendingCount} pendientes · {checkedCount} comprados
              </p>
            </div>
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={onClearChecked}
                className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Limpiar comprados
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-2 mb-5">
            <input
              type="text"
              placeholder="Agregar ingrediente o producto..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-6 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
            />
            <input
              type="number"
              step="any"
              min={0.1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="col-span-2 rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
            />
            <input
              type="text"
              placeholder="Unidad"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="col-span-2 rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
            />
            <button
              type="submit"
              disabled={adding}
              className="col-span-2 flex items-center justify-center rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
              Tu lista de compras está vacía. Abre cualquier receta y haz clic en{" "}
              <strong>&ldquo;Todo a Compras&rdquo;</strong> o agrega productos aquí arriba.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                    item.checked
                      ? "border-stone-100 bg-stone-50 text-stone-400 dark:border-stone-800/60 dark:bg-stone-950/40"
                      : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleItem(item)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        item.checked
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-stone-300 dark:border-stone-600"
                      }`}
                    >
                      {item.checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          item.checked ? "line-through" : ""
                        }`}
                      >
                        <span className="font-bold">
                          {item.quantity} {item.unit}
                        </span>{" "}
                        {item.name}
                      </div>
                      {item.recipeTitle && (
                        <div className="text-[11px] text-stone-400">
                          De: {item.recipeTitle}
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Columna derecha: Comparador de Supermercados (Futuro / Arquitectura lista) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-600" />
                Comparador de Supermercados
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Simulación lista para conectar APIs reales de precios en el futuro.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Modo Demo
            </span>
          </div>

          {pendingCount === 0 ? (
            <div className="rounded-2xl bg-stone-50 p-5 text-center text-xs text-stone-500 dark:bg-stone-800/40">
              Agrega ingredientes pendientes a tu lista para ver la comparación estimada entre supermercados.
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {bestOffer && savings > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    Mejor opción estimada:{" "}
                    <strong>{bestOffer.supermarketName}</strong>. Ahorro
                    estimado de{" "}
                    <strong>${savings.toLocaleString("es-AR")}</strong>{" "}
                    respecto al más caro.
                  </div>
                </div>
              )}

              {offers.map((offer, index) => (
                <div
                  key={offer.supermarketId}
                  className={`rounded-2xl border p-4 transition ${
                    index === 0
                      ? "border-emerald-400 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20"
                      : "border-stone-200 dark:border-stone-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: offer.color }}
                      />
                      <span className="font-bold text-sm">
                        {offer.supermarketName}
                      </span>
                      {index === 0 && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          Mejor precio
                        </span>
                      )}
                    </div>
                    <span className="text-base font-extrabold">
                      ${offer.estimatedTotal.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-stone-500">
                    {offer.matchedItems} de {pendingCount} productos cotizados
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
