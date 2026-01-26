import { User, Mail } from "lucide-react"
import type { User as UserType } from "@/lib/types/database"

interface UserProfileCardProps {
  user: UserType & { companies: { id: string; name: string | null } | null }
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || "Utilisateur"

  return (
    <div className="rounded-[20px] bg-card p-6 sm:p-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted sm:h-24 sm:w-24">
          <User className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
        </div>

        <div className="text-center sm:text-left">
          <h2 className="font-header text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
            {fullName}
          </h2>
          {user.email && (
            <div className="mt-1 flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
              <Mail className="h-4 w-4" />
              <span className="type-body-sm">{user.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
