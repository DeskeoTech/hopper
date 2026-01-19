import { createClient } from "@/lib/supabase/server"
import { isEmailInAirtable } from "@/lib/airtable/authorized-emails"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/admin"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email) {
        // Check if email is in Airtable collaborator table
        const isCollaborator = await isEmailInAirtable(user.email)

        // Check if user exists in users table
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, role")
          .eq("email", user.email)
          .single()

        if (existingUser) {
          // Update role to 'deskeo' if collaborator (unless already admin)
          if (isCollaborator && existingUser.role !== "admin") {
            await supabase
              .from("users")
              .update({ role: "deskeo" })
              .eq("id", existingUser.id)
          }

          // Redirect based on role
          const userRole = isCollaborator && existingUser.role !== "admin"
            ? "deskeo"
            : existingUser.role

          if (userRole === "user") {
            return NextResponse.redirect(`${origin}/`)
          }
          return NextResponse.redirect(`${origin}${next}`)
        } else {
          // User not in users table - sign them out and redirect to error
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=no_account`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
