import { NextResponse } from "next/server";
import { deleteRecipe, getRecipeById, updateRecipe } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const recipe = await getRecipeById(id);
    if (!recipe) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ recipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener receta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const updated = await updateRecipe(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ recipe: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar receta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteRecipe(id);
    if (!deleted) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar receta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
