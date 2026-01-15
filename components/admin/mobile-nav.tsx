"use client"

import { useState } from "react"
import { Menu, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { NavigationItems } from "./navigation-items"

export function MobileNav() {
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
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-brand-foreground/10 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-accent">
              <MapPin className="h-5 w-5 text-brand-accent-foreground" />
            </div>
            <div>
              <span className="font-header text-lg">HOPPER</span>
              <span className="ml-1.5 text-xs text-brand-foreground/60">by Deskeo</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4">
            <NavigationItems onItemClick={() => setOpen(false)} />
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
