import { NextResponse } from "next/server";
import { createRecipe, listRecipes } from "@/lib/storage";

export async function GET() {
  try {
    const recipes = await listRecipes();
    return NextResponse.json({ recipes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar recetas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "El título de la receta es obligatorio" },
        { status: 400 }
      );
    }

    const recipe = await createRecipe({
      title: body.title.trim(),
      description: String(body.description ?? "").trim(),
      calories: Number(body.calories ?? 0),
      servings: Math.max(1, Number(body.servings ?? 1)),
      prepTimeMinutes: Math.max(1, Number(body.prepTimeMinutes ?? 15)),
      mealTimes: Array.isArray(body.mealTimes) ? body.mealTimes : [],
      cookingMethods: Array.isArray(body.cookingMethods) ? body.cookingMethods : [],
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
      steps: Array.isArray(body.steps) ? body.steps : [],
      resources: Array.isArray(body.resources) ? body.resources : [],
      sourceUrl: body.sourceUrl ? String(body.sourceUrl).trim() : undefined,
      coverImage: body.coverImage ? String(body.coverImage).trim() : undefined,
      isFavorite: Boolean(body.isFavorite),
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear receta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
