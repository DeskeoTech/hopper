"use client"

import { useState, useCallback, memo } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, MapPin, Users, Coffee, Bike, Printer, Dumbbell, Sun, Building, Droplets, Phone, Microwave, UtensilsCrossed, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"
import type { Site, Equipment } from "@/lib/types/database"

interface SiteWithPhotos extends Site {
  photos: string[]
  capacity: number
}

interface SiteCardProps {
  site: SiteWithPhotos
  isHovered: boolean
  onHover: (siteId: string | null) => void
  onBook: (site: SiteWithPhotos) => void
  onViewDetails: (site: SiteWithPhotos) => void
}

const equipmentIcons: Record<Equipment, React.ReactNode> = {
  barista: <Coffee className="h-3 w-3" />,
  stationnement_velo: <Bike className="h-3 w-3" />,
  impression: <Printer className="h-3 w-3" />,
  douches: <Droplets className="h-3 w-3" />,
  salle_sport: <Dumbbell className="h-3 w-3" />,
  terrasse: <Sun className="h-3 w-3" />,
  rooftop: <Building className="h-3 w-3" />,
  cafe: <Coffee className="h-3 w-3" />,
  phonebooth: <Phone className="h-3 w-3" />,
  fontaine_eau: <Droplets className="h-3 w-3" />,
  micro_ondes: <Microwave className="h-3 w-3" />,
  restauration: <UtensilsCrossed className="h-3 w-3" />,
  wifi: <Wifi className="h-3 w-3" />,
}

function extractDistrict(address: string, locale: string): string {
  const parisMatch = address.match(/75(\d{3})/)
  if (parisMatch) {
    const arr = parseInt(parisMatch[1], 10)
    if (arr === 1) return locale === "en" ? "Paris 1st" : "Paris 1er"
    return locale === "en" ? `Paris ${arr}th` : `Paris ${arr}ème`
  }

  const lyonMatch = address.match(/69(\d{3})/)
  if (lyonMatch) {
    const arr = parseInt(lyonMatch[1], 10)
    if (arr <= 9) {
      if (arr === 1) return locale === "en" ? "Lyon 1st" : "Lyon 1er"
      return locale === "en" ? `Lyon ${arr}th` : `Lyon ${arr}ème`
    }
  }

  const addressLower = address.toLowerCase()
  if (addressLower.includes("neuilly")) return "Neuilly-sur-Seine"
  if (addressLower.includes("boulogne")) return "Boulogne-Billancourt"
  if (addressLower.includes("levallois")) return "Levallois-Perret"
  if (addressLower.includes("issy")) return "Issy-les-Moulineaux"

  const parts = address.split(",")
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 1].trim()
    return cityPart.replace(/\d{5}\s*/, "").trim() || "Île-de-France"
  }

  return "Île-de-France"
}

export const SiteCard = memo(function SiteCard({ site, isHovered, onHover, onBook, onViewDetails }: SiteCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const t = useTranslations("reservation")
  const tEquip = useTranslations("equipment")
  const locale = useLocale()

  const photos = site.photos.length > 0 ? site.photos : ["/placeholder-site.jpg"]

  const goToPrevPhoto = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
    },
    [photos.length]
  )

  const goToNextPhoto = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
    },
    [photos.length]
  )

  const handleCardClick = useCallback(() => {
    onViewDetails(site)
  }, [site, onViewDetails])

  const handleBookClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onBook(site)
    },
    [site, onBook]
  )

  const district = extractDistrict(site.address, locale)

  return (
    <div
      className={cn(
        "group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-background transition-all duration-300",
        isHovered ? "border-foreground shadow-xl" : "border-black/10"
      )}
      onMouseEnter={() => onHover(site.id)}
      onMouseLeave={() => onHover(null)}
      onClick={handleCardClick}
    >
      {/* Photo Carousel */}
      <div className="relative h-56 overflow-hidden bg-muted">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentPhotoIndex * 100}%)` }}
        >
          {photos.map((photo, index) => (
            <div key={index} className="relative h-full w-full flex-shrink-0">
              <Image
                src={photo}
                alt={`${site.name} - Photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Location Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-[#D4C4B0] px-2.5 py-1">
          <MapPin className="h-3 w-3" />
          <span className="text-xs font-semibold">{district}</span>
        </div>

        {/* Capacity Badge - Top Right */}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-white px-2 py-0.5 shadow-sm">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">{site.capacity}</span>
        </div>

        {/* Photo Indicators - Bottom Center */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
            {photos.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentPhotoIndex(index)
                }}
                className={cn(
                  "rounded-full transition-all",
                  index === currentPhotoIndex
                    ? "h-1.5 w-4 bg-white"
                    : "h-1.5 w-1.5 bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3 className="font-heading text-xl font-bold uppercase tracking-tight">{site.name}</h3>

        {/* Price */}
        <p className="mt-0.5 text-sm text-muted-foreground">{t("siteCard.priceFrom", { price: 30 })}</p>

        {/* Equipment Tags */}
        {site.equipments && site.equipments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {site.equipments.slice(0, 3).map((eq) => (
              <span
                key={eq}
                className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium"
              >
                {equipmentIcons[eq]}
                {tEquip(eq)}
              </span>
            ))}
            {site.equipments.length > 3 && (
              <span className="flex items-center rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium">
                {t("siteCard.moreEquipment", { count: site.equipments.length - 3 })}
              </span>
            )}
          </div>
        )}

        {/* Book Button */}
        <div className="mt-auto pt-4">
          <Button
            className="w-full rounded-full bg-[#1B1918] font-semibold uppercase tracking-wide hover:bg-[#1B1918]/90"
            onClick={handleBookClick}
          >
            {t("siteCard.book")}
          </Button>
        </div>
      </div>
    </div>
  )
})
