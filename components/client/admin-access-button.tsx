import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminAccessButton() {
  return (
    <div className="rounded-[20px] border border-dashed bg-card p-4 text-center">
      <p className="mb-3 type-body-sm text-muted-foreground">
        Vous avez acces au back office
      </p>
      <Button asChild>
        <Link href="/admin">
          Acceder au back office
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
