import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

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
  
  return createClient(supabaseUrl, supabaseAnonKey, options)
}
