"use client"

import { useState } from "react"
import type { Resource } from "@/lib/types/database"
import { Users, MapPin, Pencil, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ResourceFormModal } from "@/components/admin/site-edit/resource-form-modal"
import { ResourcePhotoGallery } from "@/components/admin/site-edit/resource-photo-gallery"

interface ResourcePhoto {
  id: string
  url: string
  storage_path: string
  filename: string | null
}

interface ResourceCardProps {
  resource: Resource
  photos?: ResourcePhoto[]
}

const statusColors = {
  available: "bg-success/10 text-success border-success/30",
  maintenance: "bg-warning/10 text-warning-foreground border-warning/30",
  unavailable: "bg-destructive/10 text-destructive border-destructive/30",
}

const statusLabels = {
  available: "Disponible",
  maintenance: "Maintenance",
  unavailable: "Indisponible",
}

export function ResourceCard({ resource, photos = [] }: ResourceCardProps) {
  return (
    <div className="relative rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted">
      <div className="absolute top-2 right-2 flex gap-1">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Camera className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Photos — {resource.name}</DialogTitle>
            </DialogHeader>
            <ResourcePhotoGallery
              resourceId={resource.id}
              siteId={resource.site_id}
              photos={photos}
              resourceName={resource.name}
            />
          </DialogContent>
        </Dialog>
        <ResourceFormModal
          siteId={resource.site_id}
          resource={resource}
          trigger={
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          }
        />
      </div>

      <div className="flex items-start justify-between gap-2 pr-16">
        <h4 className="font-medium text-foreground">{resource.name}</h4>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", statusColors[resource.status])}>
          {statusLabels[resource.status]}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        {resource.capacity && (
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{resource.capacity} pers.</span>
          </div>
        )}
        {resource.floor !== null && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>Étage {resource.floor}</span>
          </div>
        )}
        {photos.length > 0 && (
          <div className="flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" />
            <span>{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {resource.hourly_credit_rate && (
        <div className="mt-2 flex gap-3 text-xs">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{resource.hourly_credit_rate}</span> crédits/h
          </span>
        </div>
      )}
    </div>
  )
}
