"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { QrCode, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useClientLayout } from "./client-layout-provider"
import { getStorageUrl } from "@/lib/utils"

export function CafePassButton() {
  const { user } = useClientLayout()
  const [open, setOpen] = useState(false)

  if (!user.cafe_contract_id) return null

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "—"
  const company = user.companies as { name: string | null } | null
  const companyName = company?.name || "—"
  const photoUrl = user.photo_storage_path
    ? getStorageUrl("user-photos", user.photo_storage_path)
    : null

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B1918] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Mon pass café"
      >
        <QrCode className="h-6 w-6" />
      </button>

      {/* Pass modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-[20px] border-0 bg-[#1B1918]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center px-6 pt-8 pb-8">
            {/* Title */}
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-6">
              Hopper Café Pass
            </p>

            {/* Photo */}
            <div className="mb-5 h-20 w-20 overflow-hidden rounded-full bg-white/10">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/30">
                  {(user.first_name?.[0] || "").toUpperCase()}
                  {(user.last_name?.[0] || "").toUpperCase()}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="rounded-[16px] bg-white p-4">
              <QRCodeSVG
                value={user.id}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#1B1918"
              />
            </div>

            {/* User info */}
            <p className="mt-5 text-lg font-bold text-white">{fullName}</p>
            <p className="mt-1 text-sm text-white/50">{companyName}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
