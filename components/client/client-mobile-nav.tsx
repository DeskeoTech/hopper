"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ClientNavigationItems } from "./client-navigation-items"
import { SiteSelector } from "./site-selector"

export function ClientMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-64 flex-col bg-brand p-0 text-brand-foreground">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          {/* Site Selector Header */}
          <div className="flex h-16 items-center border-b border-brand-foreground/10 px-6">
            <SiteSelector />
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4">
            <ClientNavigationItems onItemClick={() => setOpen(false)} />
          </div>

          {/* Footer */}
          <div className="border-t border-brand-foreground/10 p-4">
            <div className="text-xs text-brand-foreground/40">
              <p>Hopper Coworking</p>
              <p>&copy; 2026 Deskeo</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
