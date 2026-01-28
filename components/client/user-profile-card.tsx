import { Users, Shield, UserCircle, Building2 } from "lucide-react"
import type { User as UserType, UserRole } from "@/lib/types/database"

interface UserProfileCardProps {
  user: UserType & { companies: { id: string; name: string | null } | null }
}

function getRoleDisplay(role: UserRole | null): { label: string; icon: React.ReactNode } {
  switch (role) {
    case "admin":
      return { label: "Administrateur", icon: <Shield className="h-3.5 w-3.5" /> }
    case "deskeo":
      return { label: "Deskeo", icon: <Building2 className="h-3.5 w-3.5" /> }
    case "user":
    default:
      return { label: "Utilisateur", icon: <UserCircle className="h-3.5 w-3.5" /> }
  }
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || "Utilisateur"

  return (
    <div className="rounded-[16px] bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F1E8DC]">
          <Users className="h-7 w-7 text-foreground/70" />
        </div>

        <div className="text-center sm:text-left">
          <h2 className="font-header text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
            {fullName}
          </h2>
          {user.email && (
            <p className="mt-1 text-sm text-foreground/50">{user.email}</p>
          )}
          <div className="mt-2 flex items-center justify-center gap-1.5 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 px-3 py-1 text-sm font-medium text-foreground">
              {getRoleDisplay(user.role).icon}
              {getRoleDisplay(user.role).label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
