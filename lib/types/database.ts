export type SiteStatus = "open" | "closed"

export type ResourceType = "bench" | "meeting_room" | "flex_desk" | "fixed_desk"

export type Equipment =
  | "barista"
  | "stationnement_velo"
  | "impression"
  | "douches"
  | "salle_sport"
  | "terrasse"
  | "rooftop"
  | "cafe"
  | "phonebooth"
  | "fontaine_eau"
  | "micro_ondes"
  | "restauration"
  | "wifi"

export type DayOfWeek = "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi" | "dimanche"

// Transport types for metro/RER lines
export type TransportLine =
  | "1" | "2" | "3" | "3bis" | "4" | "5" | "6" | "7" | "7bis"
  | "8" | "9" | "10" | "11" | "12" | "13" | "14"
  | "A" | "B" | "C" | "D"
  | "RER A" | "RER B" | "RER C" | "RER D" | "RER E"

export interface TransportationStop {
  line: TransportLine
  station: string
}

export interface Site {
  id: string
  name: string
  address: string
  status: SiteStatus
  longitude: number | null
  latitude: number | null
  description: string | null
  instructions: string | null
  instructions_en: string | null
  opening_days: DayOfWeek[] | null
  opening_hours: string | null
  wifi_ssid: string | null
  wifi_password: string | null
  access: string | null
  access_en: string | null
  description_en: string | null
  transportation_lines: TransportationStop[] | null
  equipments: Equipment[] | null
  contact_first_name: string | null
  contact_last_name: string | null
  contact_email: string | null
  contact_phone: string | null
  is_nomad: boolean
  created_at: string
  updated_at: string
}

export type FloorLevel = "R-1" | "RDJ" | "RDC" | "R+1" | "R+2" | "R+3" | "R+4" | "R+5"
export type ResourceEquipment = "ecran" | "visio" | "tableau"

export interface Resource {
  id: string
  site_id: string
  name: string
  type: ResourceType
  capacity: number | null
  floor: FloorLevel | null
  hourly_credit_rate: number | null
  equipments: ResourceEquipment[] | null
  status: "available" | "unavailable"
  created_at: string
  updated_at: string
}

export interface MeetingRoomResource {
  id: string
  name: string
  capacity: number | null
  floor: FloorLevel | null
  hourly_credit_rate: number | null
  equipments: ResourceEquipment[] | null
  status: "available" | "unavailable"
  photoUrls?: string[]
}

export interface SitePhoto {
  id: string
  site_id: string
  url: string
  alt: string | null
  order: number
  created_at: string
}

export interface ResourcePhoto {
  id: string
  resource_id: string
  storage_path: string
  filename: string | null
  display_order: number
  created_at: string
}

// Company types
export type CompanyType = "self_employed" | "multi_employee"
export type SubscriptionPeriod = "month" | "week"

export interface Company {
  id: string
  airtable_id: string | null
  name: string | null
  address: string | null
  phone: string | null
  contact_email: string | null
  registration_date: string | null
  company_type: CompanyType | null
  id_spacebring: string | null
  subscription_period: SubscriptionPeriod | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  customer_id_stripe: string | null
  main_site_id: string | null
  logo_storage_path: string | null
  kbis_storage_path: string | null
  onboarding_done: boolean | null
  from_spacebring: boolean | null
  spacebring_plan_name: string | null
  spacebring_monthly_price: number | null
  spacebring_monthly_credits: number | null
  spacebring_seats: number | null
  created_at: string
  updated_at: string
}

// Plan types
export type PlanRecurrence = "daily" | "weekly" | "monthly"
export type PlanServiceType = "plan" | "credit_purchase" | "coffee_subscription"

export interface Plan {
  id: string
  airtable_id: string | null
  name: string
  price_per_seat_month: number | null
  credits_per_month: number | null
  credits_per_person_month: number | null
  recurrence: PlanRecurrence | null
  service_type: PlanServiceType | null
  notes: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface PlanSite {
  plan_id: string
  site_id: string
}

// Credit types
export interface Credit {
  id: string
  airtable_id: string | null
  contract_id: string | null
  period: string
  allocated_credits: number
  extras_credit: boolean | null
  created_at: string
  updated_at: string
}

export interface UserCredits {
  allocated: number
  remaining: number
  period: string
}

// Credit movement types for history display
export type CreditMovementType = "reservation" | "cancellation" | "adjustment" | "allocation" | "expiration"

export interface CreditMovement {
  id: string
  date: string
  type: CreditMovementType
  amount: number // positive for credit, negative for debit
  description: string
  balance_after: number
}

export interface UserPlan {
  name: string
  pricePerSeatMonth: number | null
  creditsPerMonth: number | null
}

// Flex pass types for workspace booking
export interface FlexPassOffer {
  id: string
  name: string
  pricePerSeatMonth: number | null
  recurrence: PlanRecurrence | null
}

export interface FlexDeskAvailability {
  siteId: string
  siteName: string
  totalCapacity: number
  bookedCount: number
  availableCount: number
  photoUrl: string | null
}

// Booking types
export type BookingStatus = "confirmed" | "cancelled" | "pending"

export interface Booking {
  id: string
  airtable_id: string | null
  user_id: string | null
  resource_id: string | null
  start_date: string
  end_date: string
  status: BookingStatus | null
  seats_count: number | null
  credits_used: number | null
  notes: string | null
  hubspot_deal_id: string | null
  netsuite_invoice_id: string | null
  created_at: string
  updated_at: string
}

export interface BookingWithDetails extends Booking {
  resource_name: string | null
  resource_type: ResourceType | null
  resource_capacity: number | null
  resource_floor: FloorLevel | null
  site_id: string | null
  site_name: string | null
  user_first_name: string | null
  user_last_name: string | null
  user_email: string | null
  company_id: string | null
  company_name: string | null
}

// Contract/Pass types for reservations display
export type ContractStatus = "active" | "suspended" | "terminated"

export interface ContractForDisplay {
  id: string
  status: ContractStatus
  start_date: string | null
  end_date: string | null
  plan_name: string
  plan_recurrence: PlanRecurrence | null
  site_name: string | null
  number_of_seats: number | null
}

// Admin pass display (enriched contract for admin views)
export interface AdminPassForDisplay {
  id: string
  status: ContractStatus
  start_date: string | null
  end_date: string | null
  commitment_end_date: string | null
  renewal_end_date: string | null
  plan_name: string
  plan_recurrence: PlanRecurrence | null
  price_per_seat_month: number | null
  number_of_seats: number | null
  assigned_users_count: number
}

// Unified reservation item (booking or contract)
export type ReservationItemType = "meeting_room" | "pass_day" | "pass_week" | "pass_month"

export interface ReservationItem {
  id: string
  type: ReservationItemType
  start_date: string
  end_date: string
  site_name: string | null
  status: string
  // For bookings only
  booking?: BookingWithDetails
  // For contracts only
  contract?: ContractForDisplay
}

// User types
export type UserRole = "admin" | "user"
export type UserStatus = "active" | "inactive"

export interface User {
  id: string
  airtable_id: string | null
  last_name: string | null
  first_name: string | null
  email: string | null
  phone: string | null
  role: UserRole | null
  status: UserStatus | null
  company_id: string | null
  contract_id: string | null
  site_id: string | null
  photo_storage_path: string | null
  is_hopper_admin: boolean
  badge_number: string | null
  badge_returned: boolean
  cgu_accepted_at: string | null
  created_at: string
  updated_at: string
}

// Admin profile (retour de getAdminProfile)
export interface AdminProfile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  is_hopper_admin: boolean
  site_id: string | null
  sites: { id: string; name: string } | null
}

// Support ticket types
export type TicketStatus = "todo" | "in_progress" | "done"
export type TicketRequestType =
  | "administratif"
  | "ascenseurs"
  | "audiovisuel"
  | "autre"
  | "badges"
  | "catering"
  | "chauffage"
  | "climatisation"
  | "code_acces"
  | "electricite"
  | "electromenager"
  | "espaces_verts"
  | "fenetres"
  | "finance"
  | "fontaine_eau"
  | "immeuble"
  | "imprimantes"
  | "internet_reseau"
  | "interphone"
  | "isolation_phonique"
  | "juridique"
  | "menage"
  | "nuisances"
  | "nuisibles"
  | "plomberie"
  | "portes"
  | "ssi"
  | "videosurveillance_alarme"

export interface SupportTicket {
  id: string
  airtable_id: string | null
  user_id: string | null
  site_id: string | null
  request_type: TicketRequestType | null
  request_subtype: string | null
  subject: string | null
  comment: string | null
  status: TicketStatus | null
  freshdesk_ticket_id: string | null
  created_at: string
  updated_at: string
}

export interface SupportTicketWithDetails extends SupportTicket {
  user_first_name: string | null
  user_last_name: string | null
  user_email: string | null
  company_id: string | null
  company_name: string | null
  site_name: string | null
}

// News post types
export interface NewsPost {
  id: string
  title: string
  content: string
  excerpt: string | null
  image_storage_path: string | null
  site_id: string | null
  published_at: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface NewsPostWithSite extends NewsPost {
  site_name: string | null
  image_url: string | null
}

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: Site
        Insert: Omit<Site, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Site, "id" | "created_at" | "updated_at">>
      }
      resources: {
        Row: Resource
        Insert: Omit<Resource, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Resource, "id" | "created_at" | "updated_at">>
      }
      site_photos: {
        Row: SitePhoto
        Insert: Omit<SitePhoto, "id" | "created_at">
        Update: Partial<Omit<SitePhoto, "id" | "created_at">>
      }
    }
  }
}
