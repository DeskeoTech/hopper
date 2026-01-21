"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSite } from "@/lib/actions/sites"
import type { SiteStatus } from "@/lib/types/database"

const createSiteSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire"),
  address: z.string().min(1, "L'adresse est obligatoire"),
  status: z.enum(["open", "closed"]).default("open"),
})

type CreateSiteFormData = z.infer<typeof createSiteSchema>

export function CreateSiteModal() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSiteFormData>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      name: "",
      address: "",
      status: "open",
    },
  })

  const statusValue = watch("status")

  async function onSubmit(data: CreateSiteFormData) {
    const result = await createSite({
      name: data.name,
      address: data.address,
      status: data.status,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Site créé avec succès")
    reset()
    setOpen(false)

    if (result.siteId) {
      router.push(`/admin/sites/${result.siteId}`)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau site</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Nom du site"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Adresse <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              placeholder="Adresse du site"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={statusValue}
              onValueChange={(v) => setValue("status", v as SiteStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
