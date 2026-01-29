"use client"

import { Building2 } from "lucide-react"

const FALLBACK_IMAGE_URL = "https://res.cloudinary.com/dhzxgl5eb/image/upload/v1769636196/DESKEO_VICTOIRE_-_LA_CASA_DESKEO_-_RDC_front_-_8_hg0jrt.jpg"

interface HomepageHeroProps {
  imageUrl?: string | null
  siteName?: string
}

export function HomepageHero({ imageUrl, siteName }: HomepageHeroProps) {
  const displayImage = imageUrl || FALLBACK_IMAGE_URL

  return (
    <div className="relative h-52 w-full overflow-hidden sm:h-60">
      {/* Background image */}
      {displayImage ? (
        <img
          src={displayImage}
          alt={siteName ? `Espace ${siteName}` : "Espace Hopper"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <Building2 className="h-16 w-16 text-muted-foreground/30" />
        </div>
      )}

      {/* Gradient overlay with blur effect at bottom - lighter on mobile for better image visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent sm:via-background/40" />

      {/* Additional blur layer at the very bottom for smooth transition */}
      <div className="absolute inset-x-0 bottom-0 h-12 backdrop-blur-[1px] bg-gradient-to-t from-background to-transparent sm:h-16 sm:backdrop-blur-[2px]" />
    </div>
  )
}
