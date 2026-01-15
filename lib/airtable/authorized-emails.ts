/**
 * Airtable email authorization check with in-memory caching
 */

const AIRTABLE_BASE_ID = "appDe1N8etZrwWXrG"
const AIRTABLE_TABLE_ID = "tblpb4lDnp3R17otz"
const AIRTABLE_EMAIL_FIELD_ID = "fld6TQMJlClTwobtl"

interface AirtableResponse {
  records: Array<{
    id: string
    fields: Record<string, unknown>
  }>
}

// In-memory cache with TTL
const emailCache = new Map<string, { authorized: boolean; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 1000

function getCachedAuthorization(email: string): boolean | null {
  const cached = emailCache.get(email.toLowerCase())
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    emailCache.delete(email.toLowerCase())
    return null
  }
  return cached.authorized
}

function setCachedAuthorization(email: string, authorized: boolean): void {
  // LRU eviction if cache is full
  if (emailCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = emailCache.keys().next().value
    if (oldestKey) emailCache.delete(oldestKey)
  }
  emailCache.set(email.toLowerCase(), { authorized, timestamp: Date.now() })
}

async function queryAirtableForEmail(email: string): Promise<boolean> {
  const apiToken = process.env.AIRTABLE_API_TOKEN

  if (!apiToken) {
    console.error("[Airtable] AIRTABLE_API_TOKEN is not configured")
    return false
  }

  // Use RECORD_ID() function with field ID for the formula
  // The formula checks if the email field equals the given email (case-insensitive)
  const formula = `LOWER({${AIRTABLE_EMAIL_FIELD_ID}})='${email.toLowerCase().replace(/'/g, "\\'")}'`
  const params = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
  })

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${params}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[Airtable] API error ${response.status}: ${errorText}`)
    throw new Error(`Airtable API error: ${response.status}`)
  }

  const data: AirtableResponse = await response.json()
  return data.records.length > 0
}

/**
 * Check if an email is authorized in the Airtable whitelist
 * Uses caching to minimize API calls
 */
export async function isEmailAuthorized(email: string): Promise<boolean> {
  if (!email) return false

  // Check cache first
  const cached = getCachedAuthorization(email)
  if (cached !== null) {
    return cached
  }

  // Query Airtable
  try {
    const authorized = await queryAirtableForEmail(email)
    setCachedAuthorization(email, authorized)
    return authorized
  } catch (error) {
    console.error("[Airtable] Error checking email authorization:", error)
    // Fail closed: deny access on API errors
    return false
  }
}
