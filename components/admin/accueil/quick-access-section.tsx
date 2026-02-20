"use client"

import { useState } from "react"
import { ChevronDown, Coffee, Package, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export function QuickAccessSection() {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2"
      >
        <h2 className="type-h3 text-foreground">Accès rapide</h2>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[500px] mt-4" : "max-h-0"
        )}
      >
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <a
            href="https://hopper-cafe.softr.app/login"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <article className="rounded-lg bg-card p-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                  <Coffee className="h-5 w-5 text-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-header text-base text-foreground group-hover:text-primary transition-colors">
                    Hopper Café
                  </h3>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </a>

          <a
            href="https://achats-deskeo.softr.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <article className="rounded-lg bg-card p-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                  <Package className="h-5 w-5 text-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-header text-base text-foreground group-hover:text-primary transition-colors">
                    Réception commandes
                  </h3>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </a>
        </div>
      </div>
    </section>
  )
}
