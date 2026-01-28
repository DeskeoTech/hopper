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

            {/* Admin Link for Deskeo Employees */}
            {isDeskeoEmployee && (
              <div className="mt-4 border-t border-brand-foreground/10 pt-4">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-brand-foreground/70 transition-all duration-200 hover:bg-brand-foreground/5 hover:text-brand-foreground"
                >
                  <Settings className="h-5 w-5" />
                  Espace Admin Deskeo
                </Link>
              </div>
            )}
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
