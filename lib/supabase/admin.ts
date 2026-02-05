import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Singleton instance of the admin client.
 * Reused across requests to avoid recreating the client on every call.
 */
let adminClient: SupabaseClient | null = null

/**
 * Creates a Supabase client with admin privileges (secret API key).
 * This client bypasses Row Level Security (RLS) policies.
 *
 * WARNING: Only use this for server-side operations that require
 * accessing data without user authentication context.
 */
export function createAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY"
    )
  }

  adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}
