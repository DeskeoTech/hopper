import { Users } from "lucide-react"

export default function UsersPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted border border-border mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="type-h2 text-foreground mb-2">Utilisateurs</h1>
      <p className="text-muted-foreground">Prochainement disponible</p>
    </div>
  )
}
