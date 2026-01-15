"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface UserBarProps {
  userEmail?: string | null
}

export function UserBar({ userEmail }: UserBarProps) {
  const router = useRouter()

  if (!userEmail) {
    return null
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-2 bg-card px-4 py-3 sm:gap-4 sm:px-6">
      <span className="truncate type-small text-muted-foreground max-w-[200px]">
        {userEmail}
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="size-4" />
        <span className="sr-only">Déconnexion</span>
      </Button>
    </div>
  )
}
