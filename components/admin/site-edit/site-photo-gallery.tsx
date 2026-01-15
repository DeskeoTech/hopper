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
import { uploadSitePhoto, deleteSitePhoto } from "@/lib/actions/sites"

interface Photo {
  id: string
  url: string
  storage_path: string
  filename: string | null
}

interface SitePhotoGalleryProps {
  siteId: string
  photos: Photo[]
  siteName: string
}

export function SitePhotoGallery({ siteId, photos: initialPhotos, siteName }: SitePhotoGalleryProps) {
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

    const result = await uploadSitePhoto(siteId, formData)

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
    const result = await deleteSitePhoto(siteId, photo.id, photo.storage_path)

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
            {/* Main image */}
            <img
              src={photos[currentIndex].url}
              alt={photos[currentIndex].filename || siteName}
              className="h-72 w-full object-cover"
            />

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background p-0"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background p-0"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 bg-background/80 hover:bg-background"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Ajouter
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleDeleteClick}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </>
                )}
              </Button>
            </div>

            {/* Photo counter */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm font-medium">
              {currentIndex + 1} / {photos.length}
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-3 right-3 flex justify-center">
                <div className="flex gap-1.5 max-w-[80%] overflow-x-auto pb-1">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-12 w-16 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-all ${
                        index === currentIndex
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.filename || `${siteName} - ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center bg-muted">
            <div className="text-center">
              <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-3">Aucune photo</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Ajouter une photo
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload confirmation dialog */}
      <AlertDialog open={uploadConfirmOpen} onOpenChange={setUploadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter une photo</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous ajouter la photo "{pendingFile?.name}" ?
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

      {/* Delete confirmation dialog */}
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
