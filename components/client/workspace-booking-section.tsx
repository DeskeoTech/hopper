"use client"

import { useEffect, useState, useCallback } from "react"
import { Briefcase, Loader2 } from "lucide-react"
import { startOfDay } from "date-fns"
import { FlexPassCard } from "./flex-pass-card"
import {
  getFlexPasses,
  getFlexDeskAvailability,
} from "@/lib/actions/workspaces"
import type { FlexPassOffer, FlexDeskAvailability } from "@/lib/types/database"

export interface PassSelectionInfo {
  pass: FlexPassOffer
  siteId: string
  siteName: string
  totalCapacity: number
}

interface WorkspaceBookingSectionProps {
  siteId: string | null
  onPassSelect?: (info: PassSelectionInfo) => void
}

export function WorkspaceBookingSection({
  siteId,
  onPassSelect,
}: WorkspaceBookingSectionProps) {
  const [passes, setPasses] = useState<FlexPassOffer[]>([])
  const [availability, setAvailability] = useState<FlexDeskAvailability | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use today's date for availability display
  const today = startOfDay(new Date())

  // Load flex passes on mount
  useEffect(() => {
    async function loadPasses() {
      const { passes: fetchedPasses, error: passError } = await getFlexPasses()
      if (passError) {
        setError(passError)
      } else {
        setPasses(fetchedPasses)
      }
    }
    loadPasses()
  }, [])

  // Load availability when site changes
  const loadAvailability = useCallback(async () => {
    if (!siteId) {
      setAvailability(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const dateStr = today.toISOString().split("T")[0]
    const { availability: fetchedAvailability, error: availError } =
      await getFlexDeskAvailability(siteId, dateStr)

    if (availError) {
      setError(availError)
      setAvailability(null)
    } else {
      setAvailability(fetchedAvailability)
    }

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  const handlePassSelect = (pass: FlexPassOffer) => {
    if (onPassSelect && siteId) {
      onPassSelect({
        pass,
        siteId,
        siteName: availability?.siteName || "Site",
        totalCapacity: availability?.totalCapacity || 0,
      })
    }
  }

  // Build image URL from storage path
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const photoUrl = availability?.photoUrl && supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/site-photos/${availability.photoUrl}`
    : null

  return (
    <section className="rounded-[20px] border bg-card p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="type-h4 text-foreground">Postes de travail</h3>
          <p className="type-body-sm text-muted-foreground">
            Reservez un poste flex a la journee ou par abonnement
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-muted/50 p-6 text-center">
          <p className="type-body text-muted-foreground">{error}</p>
        </div>
      ) : passes.length === 0 ? (
        <div className="rounded-lg bg-muted/50 p-6 text-center">
          <p className="type-body text-muted-foreground">
            Aucun pass disponible pour le moment
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {passes.map((pass) => (
            <FlexPassCard
              key={pass.id}
              pass={pass}
              siteName={availability?.siteName || "Site"}
              photoUrl={photoUrl}
              availability={{
                available: availability?.availableCount || 0,
                total: availability?.totalCapacity || 0,
              }}
              onSelect={() => handlePassSelect(pass)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
