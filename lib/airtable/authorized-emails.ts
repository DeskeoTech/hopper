/**
 * Airtable email check for collaborators
 * Used at login to determine if user should get 'deskeo' role
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

/**
 * Check if an email exists in the Airtable collaborators table
 */
export async function isEmailInAirtable(email: string): Promise<boolean> {
  if (!email) return false

  const apiToken = process.env.AIRTABLE_API_TOKEN

  if (!apiToken) {
    console.error("[Airtable] AIRTABLE_API_TOKEN is not configured")
    return false
  }

  try {
    // Case-insensitive email check
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
      return false
    }

    const data: AirtableResponse = await response.json()
    return data.records.length > 0
  } catch (error) {
    console.error("[Airtable] Error checking email:", error)
    return false
  }
}
