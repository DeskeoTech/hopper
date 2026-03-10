import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

function clearUtmCookies(response: NextResponse) {
  for (const param of ["utm_source", "utm_medium", "utm_campaign"]) {
    response.cookies.set(param, "", { path: "/", maxAge: 0 })
  }
  return response
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/compte"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email) {
        // Check if user exists in users table
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, role, company_id, contract_id, is_hopper_admin")
          .eq("email", user.email)
          .single()

        if (existingUser) {
          // Save UTM params to company if present and not already set
          if (existingUser.company_id) {
            const cookieStore = await cookies()
            const utmSource = cookieStore.get("utm_source")?.value
            const utmMedium = cookieStore.get("utm_medium")?.value
            const utmCampaign = cookieStore.get("utm_campaign")?.value

            if (utmSource || utmMedium || utmCampaign) {
              // Only set UTM if company doesn't already have one
              const { data: company } = await supabase
                .from("companies")
                .select("utm_source")
                .eq("id", existingUser.company_id)
                .single()

              if (company && !company.utm_source) {
                await supabase
                  .from("companies")
                  .update({
                    ...(utmSource && { utm_source: decodeURIComponent(utmSource) }),
                    ...(utmMedium && { utm_medium: decodeURIComponent(utmMedium) }),
                    ...(utmCampaign && { utm_campaign: decodeURIComponent(utmCampaign) }),
                  })
                  .eq("id", existingUser.company_id)
              }
            }
          }

          // Auto-assign first user of a company to the first contract
          if (existingUser.company_id && !existingUser.contract_id) {
            const { count: userCount } = await supabase
              .from("users")
              .select("*", { count: "exact", head: true })
              .eq("company_id", existingUser.company_id)

            if (userCount === 1) {
              const { data: firstContract } = await supabase
                .from("contracts")
                .select("id")
                .eq("company_id", existingUser.company_id)
                .order("start_date", { ascending: true })
                .limit(1)
                .single()

              if (firstContract) {
                await supabase
                  .from("users")
                  .update({ contract_id: firstContract.id })
                  .eq("id", existingUser.id)
              }
            }
          }

          // Redirect hopper admins to admin dashboard
          if (existingUser.is_hopper_admin) {
            return clearUtmCookies(NextResponse.redirect(`${origin}/admin`))
          }

          // Redirect based on role
          if (existingUser.role === "user") {
            return clearUtmCookies(NextResponse.redirect(`${origin}/compte`))
          }
          return clearUtmCookies(NextResponse.redirect(`${origin}${next}`))
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
