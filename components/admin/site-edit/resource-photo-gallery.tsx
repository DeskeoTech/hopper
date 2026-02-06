"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Upload, Trash2, Loader2, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { uploadResourcePhoto, deleteResourcePhoto } from "@/lib/actions/resources"

interface Photo {
  id: string
  url: string
  storage_path: string
  filename: string | null
}

interface ResourcePhotoGalleryProps {
  resourceId: string
  siteId: string
  photos: Photo[]
  resourceName: string
}

export function ResourcePhotoGallery({ resourceId, siteId, photos: initialPhotos, resourceName }: ResourcePhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setUploadConfirmOpen(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadConfirm = async () => {
    if (!pendingFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", pendingFile)

    const result = await uploadResourcePhoto(resourceId, siteId, formData)

    if (result.success) {
      window.location.reload()
    }
    setUploading(false)
    setPendingFile(null)
  }

  const handleDeleteClick = () => {
    if (photos.length === 0) return
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (photos.length === 0) return
    const photo = photos[currentIndex]

    setDeleting(true)
    const result = await deleteResourcePhoto(resourceId, siteId, photo.id, photo.storage_path)

    if (result.success) {
      const newPhotos = photos.filter((p) => p.id !== photo.id)
      setPhotos(newPhotos)
      if (currentIndex >= newPhotos.length && newPhotos.length > 0) {
        setCurrentIndex(newPhotos.length - 1)
      }
    }
    setDeleting(false)
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-card">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {photos.length > 0 ? (
          <div className="relative">
            <img
              src={photos[currentIndex].url}
              alt={photos[currentIndex].filename || resourceName}
              className="h-56 w-full object-cover"
            />

            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background p-0"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background p-0"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            <div className="absolute top-2 right-2 flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 bg-background/80 hover:bg-background text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Ajouter
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-xs"
                onClick={handleDeleteClick}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-2 py-0.5 rounded-full text-xs font-medium">
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm mb-2">Aucune photo</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Ajouter une photo
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={uploadConfirmOpen} onOpenChange={setUploadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter une photo</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous ajouter la photo &quot;{pendingFile?.name}&quot; ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFile(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleUploadConfirm} disabled={uploading}>
              {uploading ? "Upload en cours..." : "Ajouter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la photo</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer cette photo ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
