import type { Resource } from "@/lib/types/database"
import { Users, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResourceCardProps {
  resource: Resource
}

const statusColors = {
  available: "bg-emerald-100 text-emerald-700",
  maintenance: "bg-amber-100 text-amber-700",
  unavailable: "bg-red-100 text-red-700",
}

const statusLabels = {
  available: "Disponible",
  maintenance: "Maintenance",
  unavailable: "Indisponible",
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <div className="rounded-lg border border-[#1A1A1A]/10 bg-[#F5F1EB]/50 p-4 transition-colors hover:bg-[#F5F1EB]">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-[#1A1A1A]">{resource.name}</h4>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[resource.status])}>
          {statusLabels[resource.status]}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-[#1A1A1A]/60">
        {resource.capacity && (
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{resource.capacity} pers.</span>
          </div>
        )}
        {resource.floor !== null && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>Étage {resource.floor}</span>
          </div>
        )}
      </div>

      {(resource.hourly_rate || resource.daily_rate) && (
        <div className="mt-2 flex gap-3 text-xs">
          {resource.hourly_rate && (
            <span className="text-[#1A1A1A]/60">
              <span className="font-medium text-[#1A1A1A]">{resource.hourly_rate}€</span>/h
            </span>
          )}
          {resource.daily_rate && (
            <span className="text-[#1A1A1A]/60">
              <span className="font-medium text-[#1A1A1A]">{resource.daily_rate}€</span>/jour
            </span>
          )}
        </div>
      )}
    </div>
  )
}
