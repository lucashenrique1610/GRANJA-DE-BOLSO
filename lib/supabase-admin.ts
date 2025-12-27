import { createClient } from "@supabase/supabase-js"

// Note: SUPABASE_SERVICE_ROLE_KEY is required for admin operations (bypassing RLS)
// Do NOT expose this key to the client side.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Fallback to prevent build crashes if env vars are missing
// The client will fail at runtime if used without valid credentials
const url = supabaseUrl || "https://placeholder.supabase.co"
const key = supabaseServiceRoleKey || "placeholder"

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Only log if we are not in a CI/build environment that explicitly ignores this?
  // Actually, logging is good.
  console.warn("⚠️  Supabase Admin Client initialized with placeholder credentials. Check your .env file.")
}

export const supabaseAdmin = createClient(url, key)
