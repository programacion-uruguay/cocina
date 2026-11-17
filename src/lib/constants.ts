import type { CookingMethod, MealTime } from "@/types/recipe";

export const COOKING_METHOD_LABELS: Record<
  CookingMethod,
  { label: string; shortLabel: string; badgeClass: string; defaultTemp?: number }
> = {
  freidora_aire: {
    label: "Freidora de Aire",
    shortLabel: "Air Fryer",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    defaultTemp: 180,
  },
  horno: {
    label: "Horno",
    shortLabel: "Horno",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    defaultTemp: 200,
  },
  cocina: {
    label: "Cocina / Hornalla",
    shortLabel: "Cocina",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  },
  microondas: {
    label: "Microondas",
    shortLabel: "Microondas",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  },
  sin_coccion: {
    label: "Sin cocción",
    shortLabel: "Sin cocción",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
};

export const MEAL_TIME_LABELS: Record<
  MealTime,
  { label: string; badgeClass: string }
> = {
  desayuno: {
    label: "Desayuno",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800",
  },
  almuerzo: {
    label: "Almuerzo",
    badgeClass: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
  },
  merienda: {
    label: "Merienda",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  },
  cena: {
    label: "Cena",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
  },
  snack: {
    label: "Snack",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800",
  },
  postre: {
    label: "Postre",
    badgeClass: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800",
  },
};

export function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function isDirectVideoUrl(url: string, mimeType?: string): boolean {
  if (mimeType?.startsWith("video/")) return true;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.startsWith("/api/media/");
}
