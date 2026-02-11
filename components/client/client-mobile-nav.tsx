"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ClientNavigationItems } from "./client-navigation-items"
import { useClientLayout } from "./client-layout-provider"

export function ClientMobileNav() {
  const [open, setOpen] = useState(false)
  const { isDeskeoEmployee } = useClientLayout()

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
          {/* Logo Header */}
          <div className="flex flex-col gap-0.5 border-b border-brand-foreground/10 px-6 py-5">
            <span className="font-header text-xl font-bold uppercase tracking-tight text-brand-foreground">
              HOPPER
            </span>
            <span className="text-sm text-brand-foreground/50">La Casa Deskeo</span>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4">
            <ClientNavigationItems onItemClick={() => setOpen(false)} />
          </div>

          {/* Footer */}
          <div className="border-t border-brand-foreground/10 p-4">
            {/* Admin Link for Deskeo Employees */}
            {isDeskeoEmployee && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-brand-foreground/50 transition-colors hover:bg-brand-foreground/5 hover:text-brand-foreground/70"
              >
                <Settings className="h-3.5 w-3.5" />
                Espace Admin Deskeo
              </Link>
            )}
            <div className="text-xs text-brand-foreground/40">
              <div className="mb-2 flex gap-2">
                <Link href="/conditions-generales" onClick={() => setOpen(false)} className="transition-colors hover:text-brand-foreground/70">CGV/CGU</Link>
                <span className="text-brand-foreground/20">|</span>
                <Link href="/politique-de-confidentialite" onClick={() => setOpen(false)} className="transition-colors hover:text-brand-foreground/70">Confidentialité</Link>
              </div>
              <p>Hopper Coworking</p>
              <p>&copy; 2026 Deskeo</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
