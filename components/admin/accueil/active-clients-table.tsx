"use client"

import { useState, useMemo } from "react"
import { Users, ChevronDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { cn } from "@/lib/utils"

interface ActiveClient {
  id: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  siteId: string | null
  siteName: string | null
}

interface SiteOption {
  id: string
  name: string
}

interface ActiveClientsTableProps {
  clients: ActiveClient[]
  sites: SiteOption[]
}

interface CompanyGroup {
  companyName: string
  siteName: string | null
  clients: ActiveClient[]
}

function CompanyGroupRow({ group }: { group: CompanyGroup }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <TableCell colSpan={3} className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
              <span className="font-semibold">{group.companyName || "Sans entreprise"}</span>
              <span className="text-xs text-muted-foreground">
                ({group.clients.length})
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell" colSpan={4}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
              <span className="font-semibold">{group.companyName || "Sans entreprise"}</span>
              <span className="text-xs text-muted-foreground">
                ({group.clients.length})
              </span>
            </div>
            <span className="text-sm text-muted-foreground">{group.siteName || "—"}</span>
          </div>
        </TableCell>
      </TableRow>
      {isOpen &&
        group.clients.map((client) => (
          <TableRow key={client.id} className="bg-muted/20">
            <TableCell className="pl-10 font-medium">
              {client.lastName || "—"}
            </TableCell>
            <TableCell>{client.firstName || "—"}</TableCell>
            <TableCell className="hidden md:table-cell" />
            <TableCell className="hidden md:table-cell" />
          </TableRow>
        ))}
    </>
  )
}

export function ActiveClientsTable({ clients, sites }: ActiveClientsTableProps) {
  const [siteFilter, setSiteFilter] = useState("all")

  const filteredClients = useMemo(() => {
    if (siteFilter === "all") return clients
    return clients.filter((c) => c.siteId === siteFilter)
  }, [clients, siteFilter])

  // Grouper par entreprise
  const companyGroups = useMemo(() => {
    const groups = new Map<string, CompanyGroup>()
    filteredClients.forEach((client) => {
      const key = client.companyName || "__none__"
      const existing = groups.get(key)
      if (existing) {
        existing.clients.push(client)
      } else {
        groups.set(key, {
          companyName: client.companyName || "Sans entreprise",
          siteName: client.siteName,
          clients: [client],
        })
      }
    })
    return Array.from(groups.values()).sort((a, b) =>
      a.companyName.localeCompare(b.companyName, "fr")
    )
  }, [filteredClients])

  const siteOptions = [
    { value: "all", label: "Tous les sites" },
    ...sites.map((s) => ({ value: s.id, label: s.name })),
  ]

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="type-h3 text-foreground">Clients présents aujourd&apos;hui</h2>
          <span className="inline-flex items-center rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {filteredClients.length}
          </span>
        </div>
        <SearchableSelect
          options={siteOptions}
          value={siteFilter}
          onValueChange={setSiteFilter}
          placeholder="Filtrer par site"
          searchPlaceholder="Rechercher un site..."
          triggerClassName="w-full sm:w-[200px]"
        />
      </div>

      {companyGroups.length === 0 ? (
        <div className="rounded-lg bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun client avec un forfait actif aujourd&apos;hui
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead className="hidden md:table-cell">Entreprise</TableHead>
                <TableHead className="hidden md:table-cell">Site</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyGroups.map((group) => (
                <CompanyGroupRow key={group.companyName} group={group} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
