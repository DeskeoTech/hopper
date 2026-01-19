"use client"

import { useEffect, useState, useCallback } from "react"
import { Briefcase, Loader2 } from "lucide-react"
import { startOfDay } from "date-fns"
import { DatePickerNavigation } from "./date-picker-navigation"
import { FlexPassCard } from "./flex-pass-card"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  getFlexPasses,
  getFlexDeskAvailability,
} from "@/lib/actions/workspaces"
import type { FlexPassOffer, FlexDeskAvailability } from "@/lib/types/database"

interface WorkspaceBookingSectionProps {
  userId: string
  companyId: string
  mainSiteId: string | null
  sites: Array<{ id: string; name: string }>
}

const POSTS_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} poste${i > 0 ? "s" : ""}`,
}))

export function WorkspaceBookingSection({
  userId,
  companyId,
  mainSiteId,
  sites,
}: WorkspaceBookingSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()))
  const [selectedSiteId, setSelectedSiteId] = useState<string>(mainSiteId || sites[0]?.id || "")
  const [postsCount, setPostsCount] = useState("1")
  const [passes, setPasses] = useState<FlexPassOffer[]>([])
  const [availability, setAvailability] = useState<FlexDeskAvailability | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Load availability when date or site changes
  const loadAvailability = useCallback(async () => {
    if (!selectedSiteId) {
      setAvailability(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const dateStr = selectedDate.toISOString().split("T")[0]
    const { availability: fetchedAvailability, error: availError } =
      await getFlexDeskAvailability(selectedSiteId, dateStr)

    if (availError) {
      setError(availError)
      setAvailability(null)
    } else {
      setAvailability(fetchedAvailability)
    }

    setLoading(false)
  }, [selectedSiteId, selectedDate])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  const handlePassSelect = async (pass: FlexPassOffer) => {
    // Placeholder for Stripe integration
    alert(
      `La fonctionnalite de paiement sera bientot disponible.\n\nPass: ${pass.name}\nSite: ${availability?.siteName || "N/A"}\nDate: ${selectedDate.toLocaleDateString("fr-FR")}\nNombre de postes: ${postsCount}`
    )
  }

  const siteOptions = sites.map((site) => ({
    value: site.id,
    label: site.name,
  }))

  // Sort to put main site first
  if (mainSiteId) {
    siteOptions.sort((a, b) => {
      if (a.value === mainSiteId) return -1
      if (b.value === mainSiteId) return 1
      return a.label.localeCompare(b.label)
    })
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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
        <DatePickerNavigation
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        <SearchableSelect
          options={siteOptions}
          value={selectedSiteId}
          onValueChange={setSelectedSiteId}
          placeholder="Choisir un site"
          searchPlaceholder="Rechercher un site..."
          emptyMessage="Aucun site trouve"
          triggerClassName="w-full sm:w-[200px]"
        />

        <SearchableSelect
          options={POSTS_COUNT_OPTIONS}
          value={postsCount}
          onValueChange={setPostsCount}
          placeholder="Nombre de postes"
          searchPlaceholder="Rechercher..."
          emptyMessage="Aucune option"
          triggerClassName="w-full sm:w-[140px]"
        />
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
