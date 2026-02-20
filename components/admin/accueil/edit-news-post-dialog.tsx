"use client"

import { useState, useRef, useEffect } from "react"
import { ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { updateNewsPost } from "@/lib/actions/news"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { NewsPostWithSite } from "@/lib/types/database"

interface EditNewsPostDialogProps {
  post: NewsPostWithSite | null
  sites: Array<{ id: string; name: string | null }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditNewsPostDialog({ post, sites, open, onOpenChange }: EditNewsPostDialogProps) {
  const [content, setContent] = useState("")
  const [siteId, setSiteId] = useState("all")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when post changes
  useEffect(() => {
    if (post) {
      setContent(post.content)
      setSiteId(post.site_id || "all")
      setImagePreview(post.image_url)
      setImageFile(null)
      setRemoveImage(false)
    }
  }, [post])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!post || !content.trim()) return

    setLoading(true)
    const formData = new FormData()
    formData.set("content", content)
    formData.set("site_id", siteId === "all" ? "" : siteId)
    if (imageFile) formData.set("image", imageFile)
    if (removeImage) formData.set("remove_image", "true")

    const result = await updateNewsPost(post.id, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Actualité modifiée")
      onOpenChange(false)
    }
  }

  const siteOptions = [
    { value: "all", label: "Tous les sites (global)" },
    ...sites.map((s) => ({ value: s.id, label: s.name || "Sans nom" })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;actualité</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="Contenu de l'actualité"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none text-sm"
          />

          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Aperçu"
                className="h-32 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ImagePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Photo</span>
              </Button>
              <SearchableSelect
                options={siteOptions}
                value={siteId}
                onValueChange={setSiteId}
                placeholder="Site"
                searchPlaceholder="Rechercher un site..."
                triggerClassName="shrink min-w-0 w-full sm:w-[180px] h-8 text-xs"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              size="sm"
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
