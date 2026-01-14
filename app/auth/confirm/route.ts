import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const VALID_OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const next = "/admin"

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete("token_hash")
  redirectTo.searchParams.delete("type")
  redirectTo.searchParams.delete("code")

  const supabase = await getSupabaseServerClient()

  // Handle PKCE flow with code parameter (default Supabase behavior)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  // Handle token_hash flow (custom email template)
  const isValidType = type && VALID_OTP_TYPES.includes(type as EmailOtpType)
  if (token_hash && isValidType) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  // Redirect to error page on failure
  redirectTo.pathname = "/auth/error"
  return NextResponse.redirect(redirectTo)
}
