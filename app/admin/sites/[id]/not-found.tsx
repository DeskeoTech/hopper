import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SiteNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted border border-border">
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 type-h3 text-foreground">Site non trouvé</h2>
      <p className="mt-2 text-muted-foreground">Le site que vous recherchez n'existe pas ou a été supprimé.</p>
      <Button asChild className="mt-6">
        <Link href="/admin">Retour au dashboard</Link>
      </Button>
    </div>
  )
}
