import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "A senha precisa ter no mínimo 4 caracteres." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "O Supabase não está configurado. Cadastre-se ou entre em Modo Local para testar." },
        { status: 500 }
      );
    }
    
    // Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: `Erro dase de dados: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: "Este endereço de e-mail já está cadastrado." },
        { status: 400 }
      );
    }

    // Insert new profile
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert([
        { 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password: password 
        }
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Falha ao criar perfil: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Cadastro efetuado com sucesso!",
      user: { name: newProfile.name, email: newProfile.email }
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || "Erro interno do servidor.",
        notConfigured: true 
      },
      { status: 500 }
    );
  }
}
