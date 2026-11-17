import { NextResponse } from "next/server";
import {
  addShoppingItems,
  clearCheckedShoppingItems,
  deleteShoppingItem,
  listShoppingItems,
  updateShoppingItem,
} from "@/lib/storage";
import { compareSupermarketPrices } from "@/lib/supermarkets";

export async function GET() {
  try {
    const items = await listShoppingItems();
    const offers = compareSupermarketPrices(items);
    return NextResponse.json({ items, offers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar lista de compras";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawItems = Array.isArray(body.items) ? body.items : [body];
    const valid = rawItems
      .filter((i: Record<string, unknown>) => i && typeof i.name === "string" && i.name.trim())
      .map((i: Record<string, unknown>) => ({
        name: String(i.name).trim(),
        quantity: Number(i.quantity ?? 1) || 1,
        unit: String(i.unit ?? "unidad").trim() || "unidad",
        checked: false,
        recipeId: i.recipeId ? String(i.recipeId) : undefined,
        recipeTitle: i.recipeTitle ? String(i.recipeTitle) : undefined,
      }));

    if (valid.length === 0) {
      return NextResponse.json(
        { error: "Debes enviar al menos un ingrediente válido" },
        { status: 400 }
      );
    }

    const created = await addShoppingItems(valid);
    return NextResponse.json({ items: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al agregar a la lista";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Falta el id del ítem" }, { status: 400 });
    }
    const updated = await updateShoppingItem(String(body.id), {
      checked: body.checked,
      quantity: body.quantity,
      name: body.name,
      unit: body.unit,
    });
    if (!updated) {
      return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ item: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar ítem";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clearChecked = searchParams.get("clearChecked") === "true";
    if (clearChecked) {
      await clearCheckedShoppingItems();
      return NextResponse.json({ ok: true });
    }

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta el id" }, { status: 400 });
    }
    const deleted = await deleteShoppingItem(id);
    if (!deleted) {
      return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar ítem";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
