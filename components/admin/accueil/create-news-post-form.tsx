"use client"

import { useState, useRef } from "react"
import { ImagePlus, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { createNewsPost } from "@/lib/actions/news"
import { toast } from "sonner"

interface CreateNewsPostFormProps {
  sites: Array<{ id: string; name: string | null }>
  defaultSiteId: string | null
}

export function CreateNewsPostForm({ sites, defaultSiteId }: CreateNewsPostFormProps) {
  const [content, setContent] = useState("")
  const [siteId, setSiteId] = useState(defaultSiteId || "all")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    setLoading(true)
    const formData = new FormData()
    formData.set("content", content)
    formData.set("site_id", siteId === "all" ? "" : siteId)
    if (imageFile) formData.set("image", imageFile)

    const result = await createNewsPost(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Actualité publiée")
      setContent("")
      removeImage()
    }
  }

  const siteOptions = [
    { value: "all", label: "Tous les sites (global)" },
    ...sites.map((s) => ({ value: s.id, label: s.name || "Sans nom" })),
  ]

  return (
    <div className="rounded-[16px] bg-card p-4">
      <Textarea
        placeholder="Quoi de neuf ?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
      />

      {imagePreview && (
        <div className="relative mt-3 inline-block">
          <img
            src={imagePreview}
            alt="Aperçu"
            className="h-32 rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
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
            className="gap-1.5 text-muted-foreground hover:text-foreground"
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
            triggerClassName="w-full sm:w-[180px] h-8 text-xs"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          size="sm"
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          {loading ? "Publication..." : "Publier"}
        </Button>
      </div>
    </div>
  )
}
