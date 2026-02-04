import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check if Supabase env vars are not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not authenticated and trying to access /admin, redirect to login
  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/reservation", "/login", "/auth"]
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/")
  )
  if (isPublicRoute) {
    return supabaseResponse
  }

  // Protected client routes
  const protectedClientRoutes = ["/", "/salles", "/postes", "/compte", "/actualites"]
  const isProtectedClientRoute = protectedClientRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/")
  )

  // If user is not authenticated and trying to access protected client routes, redirect to login
  if (!user && isProtectedClientRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check is_hopper_admin flag
  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    const { data: userData } = await supabase
      .from("users")
      .select("is_hopper_admin")
      .eq("email", user.email)
      .limit(1)
      .maybeSingle()

    // Only allow users with is_hopper_admin = true
    if (!userData || !userData.is_hopper_admin) {
      return NextResponse.rewrite(new URL("/not-found", request.url))
    }
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
