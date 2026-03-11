import { cn } from "@/lib/utils"

export type SubscriptionStatus = "actif" | "inactif" | "expirant"

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus
  size?: "sm" | "md"
}

export function SubscriptionStatusBadge({ status, size = "sm" }: SubscriptionStatusBadgeProps) {
  const config = {
    actif: {
      label: "Actif",
      dotClass: "text-success",
    },
    inactif: {
      label: "Inactif",
      dotClass: "text-muted-foreground",
    },
    expirant: {
      label: "Expire bientôt",
      dotClass: "text-warning",
    },
  }

  const { label, dotClass } = config[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-foreground",
        size === "sm" ? "text-sm" : "text-base"
      )}
    >
      <span className={cn("text-base", dotClass)}>●</span>
      {label}
    </span>
  )
}

export function getSubscriptionStatus(
  endDate: string | null,
  contracts?: { status: string; end_date: string | null }[]
): SubscriptionStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Si des contrats sont fournis, déterminer le statut à partir d'eux
  if (contracts && contracts.length > 0) {
    const activeContracts = contracts.filter((c) => {
      if (c.status !== "active") return false
      if (!c.end_date) return true
      const end = new Date(c.end_date)
      end.setHours(0, 0, 0, 0)
      return end > today
    })

    if (activeContracts.length === 0) return "inactif"

    // Vérifier si tous les contrats actifs expirent dans les 30 jours
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const contractsWithEndDate = activeContracts.filter((c) => c.end_date)
    if (contractsWithEndDate.length > 0 && contractsWithEndDate.every((c) => {
      const end = new Date(c.end_date!)
      end.setHours(0, 0, 0, 0)
      return end <= thirtyDaysFromNow
    })) {
      return "expirant"
    }

    return "actif"
  }

  // Fallback : logique basée sur subscription_end_date (pour les companies sans contrats)
  if (!endDate) return "actif"

  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  if (end <= today) return "inactif"

  const thirtyDaysFromNow = new Date(today)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  if (end <= thirtyDaysFromNow) return "expirant"

  return "actif"
}
