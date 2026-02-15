import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cpf = searchParams.get("cpf");
    const cpfs = searchParams.get("cpfs");
    const userId = searchParams.get("userId");

    let query = supabase
      .from("assinaturas_cadastradas")
      .select("*")
      .eq("ativo", true);

    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "");
      query = query.eq("cpf", cleanCpf);
    }

    if (cpfs) {
      const cpfList = cpfs.split(",").map(c => c.replace(/\D/g, "")).filter(Boolean);
      if (cpfList.length > 0) {
        query = query.in("cpf", cpfList);
      }
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching signature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, cpf: rawCpf, nomeCompleto, assinaturaBase64, isPhysical } = body;

    if (!userId || !rawCpf || !nomeCompleto || (!assinaturaBase64 && !isPhysical)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const cpf = rawCpf.replace(/\D/g, "");
    let signatureUrl = "";

    if (isPhysical) {
      signatureUrl = "FISICO";
    } else if (assinaturaBase64) {
      const base64Data = assinaturaBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `assinaturas/${cpf}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(fileName, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(fileName);
      
      signatureUrl = urlData.publicUrl;
    }

    const { data: existing } = await supabase
      .from("assinaturas_cadastradas")
      .select("id")
      .eq("cpf", cpf)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
          .from("assinaturas_cadastradas")
          .update({
            assinatura_url: signatureUrl,
            nome_completo: nomeCompleto,
            updated_at: new Date().toISOString(),
            ativo: true,
          })
          .eq("cpf", cpf)
          .select()
          .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      const { data, error } = await supabase
        .from("assinaturas_cadastradas")
        .insert({
          user_id: userId,
          cpf,
          nome_completo: nomeCompleto,
          assinatura_url: signatureUrl,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error saving signature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("assinaturas_cadastradas")
      .update({ ativo: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting signature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
