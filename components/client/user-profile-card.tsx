import { User, Mail, Phone, Building2 } from "lucide-react"
import type { User as UserType } from "@/lib/types/database"

interface UserProfileCardProps {
  user: UserType & { companies: { id: string; name: string | null } | null }
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || "Utilisateur"

  return (
    <div className="rounded-[20px] border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h2 className="type-h3 text-foreground">{fullName}</h2>
            {user.companies?.name && (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="type-body-sm">{user.companies.name}</span>
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {user.email && (
              <div className="flex items-center gap-2 type-body-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 type-body-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
