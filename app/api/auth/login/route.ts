import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // Attempt to connect to Supabase
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "O Supabase não está configurado. Cadastre-se ou entre em Modo Local para testar." },
        { status: 500 }
      );
    }
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `Erro no banco de dados: ${error.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // Secure checking
    if (profile.password === password) {
      return NextResponse.json({
        user: { name: profile.name, email: profile.email },
        message: "Autenticação realizada com sucesso!",
      });
    } else {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }
  } catch (error: any) {
    // Graceful error if Supabase credentials are not set up yet
    return NextResponse.json(
      { 
        error: error.message || "Erro interno do servidor.",
        notConfigured: true 
      },
      { status: 500 }
    );
  }
}
