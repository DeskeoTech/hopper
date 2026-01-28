"use client"

import { useState } from "react"
import { Building2, Ticket, Crown } from "lucide-react"
import { CreditsHistoryModal } from "./credits-history-modal"
import { useClientLayout } from "./client-layout-provider"

export function UserProfileCard() {
  const { user, credits, creditMovements, plan } = useClientLayout()
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false)

  const firstName = user.first_name || "Utilisateur"
  const companyName = user.companies?.name || null
  const planName = plan?.name || null
  const remainingCredits = credits?.remaining ?? 0

  return (
    <>
      <div className="rounded-[16px] bg-card p-6 shadow-sm">
        <h1 className="font-header text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Bonjour {firstName} 👋
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {companyName && (
            <div className="flex items-center gap-2 rounded-full border border-foreground/15 bg-muted/50 px-3 py-1.5">
              <Building2 className="h-4 w-4 text-foreground/50" />
              <span className="text-sm font-medium text-foreground/80">{companyName}</span>
            </div>
          )}

          {planName && (
            <div className="flex items-center gap-2 rounded-full border border-foreground/15 bg-muted/50 px-3 py-1.5">
              <Crown className="h-4 w-4 text-foreground/50" />
              <span className="text-sm font-medium text-foreground/80">{planName}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCreditsModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-foreground/15 bg-muted/50 px-3 py-1.5 transition-colors hover:border-foreground/30 hover:bg-muted"
          >
            <Ticket className="h-4 w-4 text-foreground/50" />
            <span className="text-sm font-medium text-foreground/80">
              {remainingCredits} crédit{remainingCredits !== 1 ? "s" : ""}
            </span>
          </button>
        </div>
      </div>

      <CreditsHistoryModal
        open={isCreditsModalOpen}
        onOpenChange={setIsCreditsModalOpen}
        credits={credits}
        movements={creditMovements}
        userEmail={user.email}
      />
    </>
  )
}
