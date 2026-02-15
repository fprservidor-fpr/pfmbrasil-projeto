import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET() {
    try {
        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
        }

        const { data: students, error } = await supabaseAdmin
            .from("students")
            .select("id, nome_completo, guardian1_name, guardian1_cpf, guardian2_name, guardian2_cpf")
            .order("nome_completo");

        if (error) throw error;

        return NextResponse.json({ success: true, students });
    } catch (error: any) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
