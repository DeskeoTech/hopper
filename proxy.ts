import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Liste des domaines preview autorisés à bypass l'auth
const PREVIEW_DOMAINS = [
  'preview-hopper-app-kzmgtbawnwn5grk0ci0o.vusercontent.net',
]

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check if Supabase env vars are not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Vérifier si on est sur un domaine preview
  const host = request.headers.get('host') || ''
  const isPreviewDomain = PREVIEW_DOMAINS.some(domain => host.includes(domain))

  // If user is not authenticated and trying to access /admin, redirect to login
  // (sauf sur les domaines preview)
  if (!user && request.nextUrl.pathname.startsWith("/admin") && !isPreviewDomain) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check role in users table
  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("email", user.email)
      .single()

    // Only allow admin or deskeo roles
    if (!userData || (userData.role !== "admin" && userData.role !== "deskeo")) {
      return NextResponse.rewrite(new URL("/not-found", request.url))
    }
  }

  // If user is authenticated and on login page, redirect to /admin
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
