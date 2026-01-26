"use client"

import { useState } from "react"
import {
  Building2,
  MapPin,
  Clock,
  Wifi,
  Key,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EquipmentBadge } from "@/components/admin/equipment-badge"
import { useClientLayout } from "./client-layout-provider"
import { cn } from "@/lib/utils"

interface SiteInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SiteInfoModal({ open, onOpenChange }: SiteInfoModalProps) {
  const { selectedSiteWithDetails: site } = useClientLayout()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  if (!site) {
    return null
  }

  const hasPhotos = site.photoUrls.length > 0
  const hasMultiplePhotos = site.photoUrls.length > 1

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % site.photoUrls.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex(
      (prev) => (prev - 1 + site.photoUrls.length) % site.photoUrls.length
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            {site.name}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Photo gallery */}
          <div className="relative aspect-[16/9] bg-muted">
            {hasPhotos ? (
              <>
                <img
                  src={site.photoUrls[currentPhotoIndex]}
                  alt={`${site.name} - Photo ${currentPhotoIndex + 1}`}
                  className="h-full w-full object-cover"
                />
                {hasMultiplePhotos && (
                  <>
                    <button
                      type="button"
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {site.photoUrls.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={cn(
                            "h-2 w-2 rounded-full transition-colors",
                            idx === currentPhotoIndex
                              ? "bg-white"
                              : "bg-white/50 hover:bg-white/75"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 className="h-16 w-16 text-foreground/20" />
              </div>
            )}
          </div>

          <div className="space-y-6 p-6">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="text-foreground">{site.address}</p>
            </div>

            {/* Opening hours */}
            {(site.openingHours ||
              (site.openingDays && site.openingDays.length > 0)) && (
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4" />
                  Horaires
                </h3>
                <div className="space-y-2">
                  {site.openingHours && (
                    <p className="text-sm text-foreground">{site.openingHours}</p>
                  )}
                  {site.openingDays && site.openingDays.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {site.openingDays.map((day) => (
                        <span
                          key={day}
                          className="rounded-sm border border-border bg-background px-2 py-1 text-xs font-medium"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WiFi */}
            {site.wifiSsid && (
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Wifi className="h-4 w-4" />
                  WiFi
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">SSID</span>
                    <p className="font-mono text-sm">{site.wifiSsid}</p>
                  </div>
                  {site.wifiPassword && (
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Mot de passe
                        </span>
                        <p className="font-mono text-sm">{site.wifiPassword}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Equipments */}
            {site.equipments && site.equipments.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold">Equipements</h3>
                <div className="flex flex-wrap gap-2">
                  {site.equipments.map((equipment) => (
                    <EquipmentBadge key={equipment} equipment={equipment} />
                  ))}
                </div>
              </div>
            )}

            {/* Instructions & Access */}
            {(site.instructions || site.access) && (
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4" />
                  Instructions & Acces
                </h3>
                <div className="space-y-3 text-sm">
                  {site.instructions && (
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Instructions
                      </span>
                      <p className="mt-1 whitespace-pre-wrap">
                        {site.instructions}
                      </p>
                    </div>
                  )}
                  {site.access && (
                    <div>
                      <span className="text-xs text-muted-foreground">Acces</span>
                      <p className="mt-1">{site.access}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
