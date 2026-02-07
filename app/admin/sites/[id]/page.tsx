import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/admin/status-badge"
import { EquipmentBadge } from "@/components/admin/equipment-badge"
import { ResourceCard } from "@/components/admin/resource-card"
import { ArrowLeft, MapPin, Clock, Wifi, Key, Calendar, FileText, Building2, User, Mail, Phone, Plus } from "lucide-react"
import { EditHeaderModal } from "@/components/admin/site-edit/edit-header-modal"
import { SitePhotoGallery } from "@/components/admin/site-edit/site-photo-gallery"
import { EditInstructionsModal } from "@/components/admin/site-edit/edit-instructions-modal"
import { EditHoursModal } from "@/components/admin/site-edit/edit-hours-modal"
import { EditWifiModal } from "@/components/admin/site-edit/edit-wifi-modal"
import { EditEquipmentsModal } from "@/components/admin/site-edit/edit-equipments-modal"
import { ResourceFormModal } from "@/components/admin/site-edit/resource-form-modal"
import { Button } from "@/components/ui/button"
import { MetroLineBadge } from "@/components/ui/metro-line-badge"
import type { TransportationStop, Resource, Equipment } from "@/lib/types/database"
import { groupTransportByStation } from "@/lib/utils/transportation"
import { ReservationsSection } from "@/components/admin/reservations/reservations-section"
import { DetailsTabs } from "@/components/admin/details-tabs"

interface SiteDetailsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function SiteDetailsPage({ params, searchParams }: SiteDetailsPageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const activeTab = resolvedSearchParams.tab || "info"
  const supabase = await createClient()

  // Fetch site data
  const { data: site, error } = await supabase.from("sites").select("*").eq("id", id).single()

  if (error || !site) {
    notFound()
  }

  // Fetch resources for this site
  const { data: resources } = await supabase.from("resources").select("*").eq("site_id", id).order("type").order("name")

  // Fetch photos for this site
  const { data: photos } = await supabase.from("site_photos").select("*").eq("site_id", id).order("created_at")

  // Build public URLs for photos
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const photoUrls = photos?.map((photo) => ({
    ...photo,
    url: `${supabaseUrl}/storage/v1/object/public/site-photos/${photo.storage_path}`,
  })) || []

  // Group resources by type
  const resourcesByType: Record<string, Resource[]> = {}
  if (resources) {
    for (const resource of resources) {
      const type = resource.type as string
      if (!resourcesByType[type]) resourcesByType[type] = []
      resourcesByType[type].push(resource as Resource)
    }
  }

  // Typed transportation lines to avoid multiple casts
  const transportationLines = site.transportation_lines as TransportationStop[] | null

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/sites"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux sites
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
          <Building2 className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="type-h2 text-foreground">{site.name}</h1>
            <StatusBadge status={site.status} size="md" />
            <EditHeaderModal
              siteId={site.id}
              initialName={site.name}
              initialStatus={site.status}
              initialAddress={site.address}
            />
          </div>
          <div className="mt-1 flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{site.address}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DetailsTabs
        defaultTab={activeTab}
        infoContent={
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info - Left Column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Site Images */}
              <SitePhotoGallery siteId={site.id} photos={photoUrls} siteName={site.name} />

              {/* Instructions & Access */}
              <div className="relative rounded-lg bg-card p-4 sm:p-6">
                <EditInstructionsModal
                  siteId={site.id}
                  initialInstructions={site.instructions}
                  initialTransportation={transportationLines}
                />
                <h2 className="mb-4 flex items-center gap-2 type-h3 text-foreground">
                  <FileText className="h-5 w-5" />
                  Instructions & Accès
                </h2>
                {site.instructions || (transportationLines && transportationLines.length > 0) ? (
                  <div className="space-y-4">
                    {site.instructions && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Instructions</h3>
                        <p className="mt-1 text-foreground whitespace-pre-wrap">{site.instructions}</p>
                      </div>
                    )}
                    {transportationLines && transportationLines.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Accès (transports)</h3>
                        <div className="mt-2 space-y-2">
                          {groupTransportByStation(transportationLines).map(({ station, lines }) => (
                            <div key={station} className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {lines.map((line) => (
                                  <MetroLineBadge key={line} line={line} size="sm" />
                                ))}
                              </div>
                              <span className="text-sm text-foreground">{station}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Non renseigné</p>
                )}
              </div>

              {/* Resources */}
              <div className="rounded-lg bg-card p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 type-h3 text-foreground">
                    <Building2 className="h-5 w-5" />
                    Ressources ({resources?.length || 0})
                  </h2>
                  <ResourceFormModal
                    siteId={site.id}
                    trigger={
                      <Button size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Ajouter</span>
                      </Button>
                    }
                  />
                </div>

                {resourcesByType && Object.keys(resourcesByType).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(resourcesByType).map(([type, typeResources]) => (
                      <div key={type}>
                        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                          {getResourceTypeLabel(type)} ({typeResources?.length})
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {typeResources?.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune ressource pour ce site</p>
                )}
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Opening Hours */}
              <div className="relative rounded-lg bg-card p-4 sm:p-6">
                <EditHoursModal
                  siteId={site.id}
                  initialHours={site.opening_hours}
                  initialDays={site.opening_days}
                />
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Clock className="h-5 w-5" />
                  Horaires
                </h2>
                <div className="space-y-3">
                  {site.opening_hours && (
                    <div>
                      <span className="text-sm text-muted-foreground">Heures d'ouverture</span>
                      <p className="font-medium text-foreground">{site.opening_hours}</p>
                    </div>
                  )}
                  {site.opening_days && site.opening_days.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Jours d'ouverture</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {site.opening_days.map((day: string) => (
                          <span key={day} className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!site.opening_hours && (!site.opening_days || site.opening_days.length === 0) && (
                    <p className="text-muted-foreground text-sm">Non renseigné</p>
                  )}
                </div>
              </div>

              {/* WiFi */}
              <div className="relative rounded-lg bg-card p-4 sm:p-6">
                <EditWifiModal
                  siteId={site.id}
                  initialSsid={site.wifi_ssid}
                  initialPassword={site.wifi_password}
                />
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Wifi className="h-5 w-5" />
                  WiFi
                </h2>
                {site.wifi_ssid ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">SSID</span>
                      <p className="font-mono font-medium text-foreground">{site.wifi_ssid}</p>
                    </div>
                    {site.wifi_password && (
                      <div>
                        <span className="text-sm text-muted-foreground">Mot de passe</span>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <p className="font-mono font-medium text-foreground">{site.wifi_password}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Non renseigné</p>
                )}
              </div>

              {/* Equipments */}
              <div className="relative rounded-lg bg-card p-4 sm:p-6">
                <EditEquipmentsModal
                  siteId={site.id}
                  initialEquipments={site.equipments}
                />
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Calendar className="h-5 w-5" />
                  Équipements
                </h2>
                {site.equipments && site.equipments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(site.equipments as Equipment[]).map((equipment: Equipment) => (
                      <EquipmentBadge key={equipment} equipment={equipment} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucun équipement renseigné</p>
                )}
              </div>

              {/* Contact */}
              <div className="rounded-lg bg-card p-4 sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <User className="h-5 w-5" />
                  Contact
                </h2>
                {site.contact_first_name || site.contact_last_name || site.contact_email || site.contact_phone ? (
                  <div className="space-y-3">
                    {(site.contact_first_name || site.contact_last_name) && (
                      <div>
                        <span className="text-sm text-muted-foreground">Nom</span>
                        <p className="font-medium text-foreground">
                          {[site.contact_first_name, site.contact_last_name].filter(Boolean).join(" ")}
                        </p>
                      </div>
                    )}
                    {site.contact_email && (
                      <div className="flex items-start gap-2">
                        <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm text-muted-foreground">Email</span>
                          <p className="text-foreground">{site.contact_email}</p>
                        </div>
                      </div>
                    )}
                    {site.contact_phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm text-muted-foreground">Téléphone</span>
                          <p className="text-foreground">{site.contact_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Non renseigné</p>
                )}
              </div>
            </div>
          </div>
        }
        reservationsContent={
          <ReservationsSection
            context={{ type: "site", siteId: site.id, siteName: site.name }}
            searchParams={resolvedSearchParams}
          />
        }
      />
    </div>
  )
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bench: "Postes en open space",
    meeting_room: "Salles de réunion",
    flex_desk: "Bureaux flexibles",
    fixed_desk: "Bureaux fixes",
  }
  return labels[type] || type
}

