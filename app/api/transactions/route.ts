import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// GET: list transactions for a specific user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "E-mail de identificação do usuário é requerido." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "O Supabase não está configurado." },
        { status: 500 }
      );
    }
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_email", email.trim().toLowerCase())
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Erro ao buscar transações: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || "Erro interno.",
        notConfigured: true 
      },
      { status: 500 }
    );
  }
}

// POST: insert a new transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_email, description, amount, type, category, date } = body;

    if (!user_email || !description || amount === undefined || !type || !category || !date) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "O Supabase não está configurado." },
        { status: 500 }
      );
    }
    const { data: newTrans, error } = await supabase
      .from("transactions")
      .insert([
        {
          user_email: user_email.trim().toLowerCase(),
          description: description.trim(),
          amount: parseFloat(amount),
          type,
          category,
          date
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Erro ao salvar transação: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ transaction: newTrans });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || "Erro interno.",
        notConfigured: true 
      },
      { status: 500 }
    );
  }
}

// DELETE: delete a transaction
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Identificador da transação é requerido." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "O Supabase não está configurado." },
        { status: 500 }
      );
    }
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Erro ao remover transação: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Transação deletada com sucesso." });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || "Erro interno.",
        notConfigured: true 
      },
      { status: 500 }
    );
  }
}
