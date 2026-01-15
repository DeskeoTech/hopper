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

export interface Site {
  id: string
  name: string
  address: string
  status: SiteStatus
  longitude: number | null
  latitude: number | null
  instructions: string | null
  opening_days: string[] | null
  opening_hours: string | null
  wifi_ssid: string | null
  wifi_password: string | null
  access: string | null
  equipments: Equipment[] | null
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  site_id: string
  name: string
  type: ResourceType
  capacity: number | null
  floor: number | null
  amenities: string[] | null
  hourly_rate: number | null
  daily_rate: number | null
  instructions: string | null
  status: "available" | "maintenance" | "unavailable"
  created_at: string
  updated_at: string
}

export interface SitePhoto {
  id: string
  site_id: string
  url: string
  alt: string | null
  order: number
  created_at: string
}

export interface SiteContact {
  id: string
  site_id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
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

// User types
export type UserRole = "admin" | "user"
export type UserStatus = "active" | "disabled"

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
  created_at: string
  updated_at: string
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
      site_contacts: {
        Row: SiteContact
        Insert: Omit<SiteContact, "id" | "created_at">
        Update: Partial<Omit<SiteContact, "id" | "created_at">>
      }
    }
  }
}
