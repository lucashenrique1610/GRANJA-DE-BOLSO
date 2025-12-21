import { createClient } from "@supabase/supabase-js"

// Note: SUPABASE_SERVICE_ROLE_KEY is required for admin operations (bypassing RLS)
// Do NOT expose this key to the client side.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
