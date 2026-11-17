"use client";

import React from "react";
import { Cloud, Database, HardDrive, X } from "lucide-react";

interface CloudStatusModalProps {
  mode: "local" | "supabase";
  onClose: () => void;
}

export function CloudStatusModal({ mode, onClose }: CloudStatusModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {mode === "supabase" ? (
              <Cloud className="h-5 w-5 text-emerald-600" />
            ) : (
              <HardDrive className="h-5 w-5 text-amber-600" />
            )}
            Estado del Almacenamiento
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "supabase" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <strong>Conectado a la nube (Supabase).</strong> Tus recetas,
            videos, archivos y lista de compras se sincronizan en PostgreSQL y
            Supabase Storage.
          </div>
        ) : (
          <div className="space-y-4 text-sm text-stone-600 dark:text-stone-300">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <strong>Modo Local Activo.</strong> Actualmente tus datos y
              videos se guardan en tu PC (<code>data/db.json</code> y{" "}
              <code>data/uploads/</code>) para que puedas usar la app de
              inmediato.
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-sky-600" />
                Cómo activar la nube (Supabase) cuando quieras:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs">
                <li>
                  Crea un proyecto gratuito en <strong>supabase.com</strong>.
                </li>
                <li>
                  Ejecuta el script <code>supabase/schema.sql</code> en el SQL
                  Editor de Supabase.
                </li>
                <li>
                  Copia <code>.env.example</code> como <code>.env.local</code> y
                  pega tu <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                </li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
