"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { addPlanSite, removePlanSite } from "@/lib/actions/plans"
import type { Plan, Site, PlanSite } from "@/lib/types/database"

interface PlanSitesTableProps {
  plans: Plan[]
  sites: Site[]
  planSites: PlanSite[]
}

export function PlanSitesSection({ plans, sites, planSites }: PlanSitesTableProps) {
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [selectedSiteId, setSelectedSiteId] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ planId: string; siteId: string } | null>(null)

  const activePlans = plans.filter((p) => !p.archived)

  const planSitesWithNames = planSites.map((ps) => {
    const plan = plans.find((p) => p.id === ps.plan_id)
    const site = sites.find((s) => s.id === ps.site_id)
    return {
      ...ps,
      planName: plan?.name || "Forfait inconnu",
      siteName: site?.name || "Site inconnu",
      planArchived: plan?.archived || false,
    }
  }).sort((a, b) => a.planName.localeCompare(b.planName))

  const handleAdd = async () => {
    if (!selectedPlanId || !selectedSiteId) return

    // Check if association already exists
    const exists = planSites.some(
      (ps) => ps.plan_id === selectedPlanId && ps.site_id === selectedSiteId
    )
    if (exists) return

    setLoading(true)
    const result = await addPlanSite(selectedPlanId, selectedSiteId)
    setLoading(false)
    if (result.success) {
      setSelectedPlanId("")
      setSelectedSiteId("")
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    await removePlanSite(deleteConfirm.planId, deleteConfirm.siteId)
    setLoading(false)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="type-h3">Associations forfaits - sites</h3>
        <span className="text-sm text-muted-foreground">
          {planSites.length} association(s)
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 min-w-[180px]">
          <label className="text-sm font-medium">Forfait</label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {activePlans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[180px]">
          <label className="text-sm font-medium">Site</label>
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleAdd}
          disabled={!selectedPlanId || !selectedSiteId || loading}
          size="sm"
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {planSitesWithNames.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Aucune association</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Forfait</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planSitesWithNames.map((ps) => (
                <TableRow key={`${ps.plan_id}-${ps.site_id}`}>
                  <TableCell className="font-medium">
                    {ps.planName}
                    {ps.planArchived && (
                      <span className="ml-2 text-xs text-muted-foreground">(archivé)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ps.siteName}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm({ planId: ps.plan_id, siteId: ps.site_id })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;association</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer cette association forfait-site ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
