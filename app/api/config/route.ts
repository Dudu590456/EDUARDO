import { NextResponse } from "next/server";

export async function GET() {
  const isConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  return NextResponse.json({
    supabaseConfigured: isConfigured,
  });
}
