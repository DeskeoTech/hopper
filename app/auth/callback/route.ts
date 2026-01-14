import { type EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/admin"

  console.log("[auth/callback] Received params:", { code: code?.substring(0, 20) + "...", token_hash, type })

  const supabase = await createClient()

  // Handle PKCE flow with code parameter (default Supabase behavior)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log("[auth/callback] PKCE exchange result:", { error: error?.message })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Handle token_hash flow (custom email template)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    console.log("[auth/callback] OTP verify result:", { error: error?.message })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirect to error page on failure
  console.log("[auth/callback] Auth failed, redirecting to error")
  return NextResponse.redirect(`${origin}/auth/error`)
}
