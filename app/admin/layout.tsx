import type React from "react"
import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { getUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Hopper Admin - Deskeo",
  description: "Back-office de gestion des espaces de coworking Hopper",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-h-screen flex-col md:ml-64">
        <AdminHeader userEmail={user?.email} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
