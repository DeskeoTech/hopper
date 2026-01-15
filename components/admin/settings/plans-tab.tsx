"use client"

import { useState, useMemo } from "react"
import { PlansFilter } from "./plans-filter"
import { PlansTable } from "./plans-table"
import { AddPlanModal } from "./add-plan-modal"
import { PlanSitesSection } from "./plan-sites-section"
import type { Plan, Site, PlanSite } from "@/lib/types/database"

interface PlansTabProps {
  plans: Plan[]
  sites: Site[]
  planSites: PlanSite[]
}

export function PlansTab({ plans, sites, planSites }: PlansTabProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all")

  const plansWithSites = useMemo(() => {
    return plans.map((plan) => {
      const siteIds = planSites
        .filter((ps) => ps.plan_id === plan.id)
        .map((ps) => ps.site_id)
      return {
        ...plan,
        siteIds,
        siteCount: siteIds.length,
      }
    })
  }, [plans, planSites])

  const filteredPlans = useMemo(() => {
    return plansWithSites.filter((plan) => {
      // Search filter
      if (search && !plan.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      // Status filter
      if (statusFilter === "active" && plan.archived) {
        return false
      }
      if (statusFilter === "archived" && !plan.archived) {
        return false
      }
      return true
    })
  }, [plansWithSites, search, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PlansFilter
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        <AddPlanModal />
      </div>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          {filteredPlans.length} forfait(s) trouvé(s)
        </p>
        <PlansTable plans={filteredPlans} sites={sites} />
      </div>

      <div className="border-t pt-6">
        <PlanSitesSection plans={plans} sites={sites} planSites={planSites} />
      </div>
    </div>
  )
}
