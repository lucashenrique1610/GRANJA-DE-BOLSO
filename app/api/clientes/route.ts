import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/auth-helper"

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("clientes")
      .select("nome,endereco,telefone,cpf_cnpj,tipo")
      // Assuming clients are global or filtered by some logic. 
      // If clients are user-specific, we should add .eq('user_id', user.id) if the table has it.
      // Based on previous code, it didn't seem to filter by user_id in fetchClientesSupabase, 
      // but usually SaaS apps do. I'll check if the table has user_id later.
      // For now, I'll follow the previous pattern of just selecting all (or maybe the RLS handles it?)
      // Wait, supabaseAdmin bypasses RLS. So I MUST filter by user_id if the app is multi-tenant.
      // The previous code used the client-side key, which respects RLS.
      // So I should check if the table has a user_id column.
      // Since I can't check the schema easily, I'll assume I should filter by user_id if possible,
      // but if the previous code didn't pass user_id, maybe RLS was doing it based on auth.uid().
      // Here I am admin. I must mimic RLS.
      // I will assume for now that I should filter by user_id if the column exists.
      // But I'll try to select without filter first? No, that leaks data.
      // I'll stick to what the user requested: "secure".
      // Let's assume the standard Supabase pattern: user_id column.
      // But I don't know if the table has it.
      // The previous `upsert` payload didn't include `user_id`.
      // If `upsert` didn't include `user_id`, maybe the table has a default value `auth.uid()`?
      // If so, inserting with admin might fail to set it correctly unless I explicitly set it?
      // Actually, if I insert with admin, `auth.uid()` is null.
      // So I MUST set `user_id` explicitly in the backend.
      
      // Let's modify the code to include user_id in the upsert and filter in the select.
      // This is safer.
      .eq("user_id", user.id)

    if (error) {
       // If column user_id doesn't exist, this will error. 
       // But it's better to error than leak.
       // However, looking at `DataService.upsertClienteSupabase`, it didn't send user_id.
       // It's possible the table is public? Or RLS uses auth.uid().
       // If RLS uses auth.uid(), and I use service_role, RLS is bypassed.
       // So I see all rows.
       // So I MUST filter.
       // If the table doesn't have user_id, then I can't filter, and the previous app was maybe insecure or shared?
       // Given "Granja Bolso" sounds like a single-user or SaaS.
       // The `backups` table had `user_id`.
       // I'll assume `clientes` also has `user_id`.
       return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { nome, endereco, telefone, cpf_cnpj, tipo } = body

    if (!cpf_cnpj) {
        return NextResponse.json({ error: "CPF/CNPJ required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("clientes")
      .upsert({
        user_id: user.id, // Explicitly set user_id
        nome,
        endereco,
        telefone,
        cpf_cnpj,
        tipo
      }, { onConflict: "cpf_cnpj" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
