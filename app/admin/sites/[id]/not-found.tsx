import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SiteNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A1A1A]/10">
        <Building2 className="h-8 w-8 text-[#1A1A1A]/40" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[#1A1A1A]">Site non trouvé</h2>
      <p className="mt-2 text-[#1A1A1A]/60">Le site que vous recherchez n'existe pas ou a été supprimé.</p>
      <Button asChild className="mt-6 bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
        <Link href="/admin">Retour au dashboard</Link>
      </Button>
    </div>
  )
}
