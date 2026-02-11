import Link from "next/link"

export function ClientFooter() {
  return (
    <footer className="border-t border-foreground/5 bg-background px-4 pb-24 pt-6 md:px-6 md:pb-6">
      <div className="mx-auto flex flex-col items-center gap-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link
            href="/conditions-generales"
            className="text-xs text-foreground/50 transition-colors hover:text-foreground/80"
          >
            Conditions Générales
          </Link>
          <span className="text-xs text-foreground/20">|</span>
          <Link
            href="/politique-de-confidentialite"
            className="text-xs text-foreground/50 transition-colors hover:text-foreground/80"
          >
            Politique de confidentialité
          </Link>
        </div>
        <p className="text-xs text-foreground/40">
          &copy; {new Date().getFullYear()} Deskeo &ndash; Hopper Coworking
        </p>
      </div>
    </footer>
  )
}
