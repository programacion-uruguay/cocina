import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SEED_RECIPES } from "@/lib/seed";
import type { Recipe, ShoppingItem } from "@/types/recipe";

interface LocalDatabase {
  recipes: Recipe[];
  shoppingItems: ShoppingItem[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function ensureLocalDirs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readLocalDb(): Promise<LocalDatabase> {
  await ensureLocalDirs();
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      recipes: Array.isArray(parsed.recipes) ? parsed.recipes : SEED_RECIPES,
      shoppingItems: Array.isArray(parsed.shoppingItems)
        ? parsed.shoppingItems
        : [],
    };
  } catch {
    const initial: LocalDatabase = {
      recipes: SEED_RECIPES,
      shoppingItems: [],
    };
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

async function writeLocalDb(db: LocalDatabase): Promise<void> {
  await ensureLocalDirs();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function mapSupabaseRowToRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    calories: Number(row.calories ?? 0),
    servings: Number(row.servings ?? 1),
    prepTimeMinutes: Number(row.prep_time_minutes ?? 15),
    mealTimes: (row.meal_times as Recipe["mealTimes"]) ?? [],
    cookingMethods: (row.cooking_methods as Recipe["cookingMethods"]) ?? [],
    ingredients: (row.ingredients as Recipe["ingredients"]) ?? [],
    steps: (row.steps as string[]) ?? [],
    resources: (row.resources as Recipe["resources"]) ?? [],
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    coverImage: row.cover_image ? String(row.cover_image) : undefined,
    isFavorite: Boolean(row.is_favorite),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function listRecipes(): Promise<Recipe[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapSupabaseRowToRecipe(row));
  }

  const db = await readLocalDb();
  return [...db.recipes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapSupabaseRowToRecipe(data) : null;
  }

  const db = await readLocalDb();
  return db.recipes.find((r) => r.id === id) ?? null;
}

export type CreateRecipeInput = Omit<Recipe, "id" | "createdAt" | "updatedAt">;

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        id,
        title: input.title,
        description: input.description,
        calories: input.calories,
        servings: input.servings,
        prep_time_minutes: input.prepTimeMinutes,
        meal_times: input.mealTimes,
        cooking_methods: input.cookingMethods,
        ingredients: input.ingredients,
        steps: input.steps,
        resources: input.resources,
        source_url: input.sourceUrl ?? null,
        cover_image: input.coverImage ?? null,
        is_favorite: input.isFavorite,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapSupabaseRowToRecipe(data);
  }

  const db = await readLocalDb();
  const created: Recipe = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };
  db.recipes.unshift(created);
  await writeLocalDb(db);
  return created;
}

export async function updateRecipe(
  id: string,
  patch: Partial<CreateRecipeInput>
): Promise<Recipe | null> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase) {
    const payload: Record<string, unknown> = { updated_at: now };
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.calories !== undefined) payload.calories = patch.calories;
    if (patch.servings !== undefined) payload.servings = patch.servings;
    if (patch.prepTimeMinutes !== undefined)
      payload.prep_time_minutes = patch.prepTimeMinutes;
    if (patch.mealTimes !== undefined) payload.meal_times = patch.mealTimes;
    if (patch.cookingMethods !== undefined)
      payload.cooking_methods = patch.cookingMethods;
    if (patch.ingredients !== undefined) payload.ingredients = patch.ingredients;
    if (patch.steps !== undefined) payload.steps = patch.steps;
    if (patch.resources !== undefined) payload.resources = patch.resources;
    if (patch.sourceUrl !== undefined)
      payload.source_url = patch.sourceUrl ?? null;
    if (patch.coverImage !== undefined)
      payload.cover_image = patch.coverImage ?? null;
    if (patch.isFavorite !== undefined) payload.is_favorite = patch.isFavorite;

    const { data, error } = await supabase
      .from("recipes")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapSupabaseRowToRecipe(data) : null;
  }

  const db = await readLocalDb();
  const idx = db.recipes.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated: Recipe = {
    ...db.recipes[idx],
    ...patch,
    id,
    updatedAt: now,
  };
  db.recipes[idx] = updated;
  await writeLocalDb(db);
  return updated;
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  const db = await readLocalDb();
  const before = db.recipes.length;
  db.recipes = db.recipes.filter((r) => r.id !== id);
  if (db.recipes.length === before) return false;
  await writeLocalDb(db);
  return true;
}

export async function listShoppingItems(): Promise<ShoppingItem[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      quantity: Number(row.quantity ?? 1),
      unit: String(row.unit ?? "unidad"),
      checked: Boolean(row.checked),
      recipeId: row.recipe_id ? String(row.recipe_id) : undefined,
      recipeTitle: row.recipe_title ? String(row.recipe_title) : undefined,
      createdAt: String(row.created_at ?? new Date().toISOString()),
    }));
  }

  const db = await readLocalDb();
  return [...db.shoppingItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function addShoppingItems(
  items: Omit<ShoppingItem, "id" | "createdAt">[]
): Promise<ShoppingItem[]> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase) {
    const rows = items.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      checked: item.checked,
      recipe_id: item.recipeId ?? null,
      recipe_title: item.recipeTitle ?? null,
      created_at: now,
    }));
    const { data, error } = await supabase
      .from("shopping_items")
      .insert(rows)
      .select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      quantity: Number(row.quantity ?? 1),
      unit: String(row.unit ?? "unidad"),
      checked: Boolean(row.checked),
      recipeId: row.recipe_id ? String(row.recipe_id) : undefined,
      recipeTitle: row.recipe_title ? String(row.recipe_title) : undefined,
      createdAt: String(row.created_at ?? now),
    }));
  }

  const db = await readLocalDb();
  const created: ShoppingItem[] = items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    createdAt: now,
  }));
  db.shoppingItems.unshift(...created);
  await writeLocalDb(db);
  return created;
}

export async function updateShoppingItem(
  id: string,
  patch: Partial<Pick<ShoppingItem, "checked" | "quantity" | "name" | "unit">>
): Promise<ShoppingItem | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("shopping_items")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: String(data.id),
      name: String(data.name),
      quantity: Number(data.quantity ?? 1),
      unit: String(data.unit ?? "unidad"),
      checked: Boolean(data.checked),
      recipeId: data.recipe_id ? String(data.recipe_id) : undefined,
      recipeTitle: data.recipe_title ? String(data.recipe_title) : undefined,
      createdAt: String(data.created_at ?? new Date().toISOString()),
    };
  }

  const db = await readLocalDb();
  const idx = db.shoppingItems.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  db.shoppingItems[idx] = { ...db.shoppingItems[idx], ...patch };
  await writeLocalDb(db);
  return db.shoppingItems[idx];
}

export async function deleteShoppingItem(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  const db = await readLocalDb();
  const before = db.shoppingItems.length;
  db.shoppingItems = db.shoppingItems.filter((i) => i.id !== id);
  if (db.shoppingItems.length === before) return false;
  await writeLocalDb(db);
  return true;
}

export async function clearCheckedShoppingItems(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("checked", true);
    if (error) throw new Error(error.message);
    return;
  }

  const db = await readLocalDb();
  db.shoppingItems = db.shoppingItems.filter((i) => !i.checked);
  await writeLocalDb(db);
}

export async function saveUploadedMedia(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ url: string; storedName: string }> {
  const safeBase = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeBase}`;

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.storage
      .from("recipe-media")
      .upload(storedName, buffer, {
        contentType: mimeType || "application/octet-stream",
        upsert: false,
      });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage
      .from("recipe-media")
      .getPublicUrl(storedName);
    return { url: data.publicUrl, storedName };
  }

  await ensureLocalDirs();
  const filePath = path.join(UPLOADS_DIR, storedName);
  await fs.writeFile(filePath, buffer);
  return {
    url: `/api/media/${encodeURIComponent(storedName)}`,
    storedName,
  };
}

export function getLocalUploadPath(filename: string): string {
  const cleanName = path.basename(filename);
  return path.join(UPLOADS_DIR, cleanName);
}
