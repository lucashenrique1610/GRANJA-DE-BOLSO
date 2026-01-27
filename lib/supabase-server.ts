NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_que_comeca_com_eyJ...import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn only once to avoid spamming logs
  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️  Supabase Client (Server) initialized with missing env vars.")
  }
}

export const getSupabaseServerClient = (token?: string) => {
  const options: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  }
  
  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }
  
  try {
    // Safe initialization
    const url = supabaseUrl || "https://placeholder.supabase.co"
    const key = supabaseAnonKey || "placeholder"
    return createClient(url, key, options)
  } catch (e) {
    console.error("[SUPABASE-CLIENT-ERROR] Failed to initialize client:", e)
    throw e
  }
}
