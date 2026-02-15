import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assinaturaId = searchParams.get("assinaturaId");
    const cpf = searchParams.get("cpf");

    let query = supabase
      .from("termos_autorizacao")
      .select(`
        *,
        assinaturas_cadastradas (
          id,
          cpf,
          nome_completo,
          assinatura_url
        )
      `)
      .order("assinado_em", { ascending: false });

    if (assinaturaId) {
      query = query.eq("assinatura_id", assinaturaId);
    }

    if (cpf) {
      query = query.eq("assinaturas_cadastradas.cpf", cpf);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching terms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      assinaturaId, 
      tipoTermo, 
      documentoReferenciaId, 
      documentoReferenciaTipo,
      ipAddress,
      userAgent 
    } = body;

    if (!assinaturaId || !tipoTermo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("termos_autorizacao")
      .insert({
        assinatura_id: assinaturaId,
        tipo_termo: tipoTermo,
        documento_referencia_id: documentoReferenciaId || null,
        documento_referencia_tipo: documentoReferenciaTipo || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error creating term:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
