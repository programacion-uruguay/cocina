import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/storage";

export async function GET() {
  return NextResponse.json({
    mode: isSupabaseConfigured() ? "supabase" : "local",
    supabaseConfigured: isSupabaseConfigured(),
  });
}
