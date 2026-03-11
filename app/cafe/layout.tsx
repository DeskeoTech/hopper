import Image from "next/image"
import Link from "next/link"
import { getAdminProfile } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CafeLayout({ children }: { children: React.ReactNode }) {
  const adminProfile = await getAdminProfile()

  if (!adminProfile) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with centered logo */}
      <header className="sticky top-0 z-50 border-b bg-[#EFE8DC]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {adminProfile.first_name || adminProfile.email}
            </span>
          </div>

          {/* Centered logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Image
              src="/hopper-cafe-logo.png"
              alt="Hopper Café"
              width={100}
              height={100}
              className="h-9 w-auto"
              priority
            />
          </div>

          <Link
            href="/admin"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 md:p-6">{children}</main>
    </div>
  )
}
