import { UserBar } from "@/components/user-bar"
import { UrlVersionFooter } from "@/components/url-version-footer"
import { UserProfileCard } from "./user-profile-card"
import { UserBookingsSection } from "./user-bookings-section"
import { AdminAccessButton } from "./admin-access-button"
import type { User, BookingWithDetails } from "@/lib/types/database"

interface ClientHomePageProps {
  user: User & { companies: { id: string; name: string | null } | null }
  bookings: BookingWithDetails[]
  isAdmin: boolean
}

export function ClientHomePage({
  user,
  bookings,
  isAdmin,
}: ClientHomePageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserBar userEmail={user.email} />

      <main className="flex flex-1 flex-col items-center p-4 md:p-6">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center">
            <h1 className="type-h2 text-foreground">Mon espace</h1>
            <p className="mt-2 type-body text-muted-foreground">
              Bienvenue sur votre espace client Hopper
            </p>
          </div>

          {isAdmin && <AdminAccessButton />}

          <UserProfileCard user={user} />

          <UserBookingsSection bookings={bookings} />
        </div>

        <UrlVersionFooter />
      </main>
    </div>
  )
}
