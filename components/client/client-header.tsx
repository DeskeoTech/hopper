"use client"

import Image from "next/image"
import { ClientMobileNav } from "./client-mobile-nav"

export function ClientHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-center bg-[#F1E8DC] px-4 md:h-20">
      {/* Mobile Nav - Absolute left */}
      <div className="absolute left-4 md:hidden">
        <ClientMobileNav />
      </div>

      {/* Centered Logo */}
      <Image
        src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
        alt="Hopper Logo"
        width={400}
        height={160}
        className="h-8 w-auto md:h-16"
        priority
      />
    </header>
  )
}
