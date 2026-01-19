"use client"

import { useState } from "react"
import { WorkspaceBookingSection, type PassSelectionInfo } from "@/components/client/workspace-booking-section"
import { BookWorkspaceModal } from "@/components/client/book-workspace-modal"
import { useClientLayout } from "@/components/client/client-layout-provider"

export default function PostesPage() {
  const { selectedSiteId } = useClientLayout()
  const [modalOpen, setModalOpen] = useState(false)
  const [selection, setSelection] = useState<PassSelectionInfo | null>(null)

  const handlePassSelect = (info: PassSelectionInfo) => {
    setSelection(info)
    setModalOpen(true)
  }

  return (
    <div className="p-4 md:p-6">
      <WorkspaceBookingSection
        siteId={selectedSiteId}
        onPassSelect={handlePassSelect}
      />

      <BookWorkspaceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        pass={selection?.pass || null}
        siteName={selection?.siteName || ""}
        totalCapacity={selection?.totalCapacity || 0}
      />
    </div>
  )
}
