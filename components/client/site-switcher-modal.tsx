"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClientSiteCard } from "./client-site-card"
import { NomadSubscriptionModal } from "./nomad-subscription-modal"
import { useClientLayout, type SiteWithDetails } from "./client-layout-provider"

interface SiteSwitcherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SiteSwitcherModal({ open, onOpenChange }: SiteSwitcherModalProps) {
  const {
    sitesWithDetails,
    selectedSiteId,
    setSelectedSiteId,
    isNomad,
    mainSiteId,
  } = useClientLayout()

  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [selectedSiteForSubscription, setSelectedSiteForSubscription] =
    useState<SiteWithDetails | null>(null)

  const handleSiteClick = (site: SiteWithDetails) => {
    // Direct switch if user is nomad or clicking on main site
    if (isNomad || site.id === mainSiteId) {
      setSelectedSiteId(site.id)
      onOpenChange(false)
    } else {
      // Non-nomad user clicking on non-main site -> show subscription modal
      setSelectedSiteForSubscription(site)
      setSubscriptionModalOpen(true)
    }
  }

  const handleSubscriptionModalClose = (isOpen: boolean) => {
    setSubscriptionModalOpen(isOpen)
    if (!isOpen) {
      setSelectedSiteForSubscription(null)
    }
  }

  if (sitesWithDetails.length === 0) {
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] max-h-[900px] w-[95vw] max-w-[1400px] flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle className="text-xl">Choisir un site</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sitesWithDetails.map((site) => (
                <ClientSiteCard
                  key={site.id}
                  site={site}
                  isCurrentSite={site.id === selectedSiteId}
                  isMainSite={!isNomad && site.id === mainSiteId}
                  onClick={() => handleSiteClick(site)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedSiteForSubscription && (
        <NomadSubscriptionModal
          open={subscriptionModalOpen}
          onOpenChange={handleSubscriptionModalClose}
          site={selectedSiteForSubscription}
        />
      )}
    </>
  )
}
