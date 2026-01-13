import type React from "react"
import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export const metadata: Metadata = {
  title: "Hopper Admin - Deskeo",
  description: "Back-office de gestion des espaces de coworking Hopper",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F5F1EB]">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
