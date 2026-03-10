import { BetaAnalyticsDataClient } from "@google-analytics/data"

const propertyId = process.env.GA_PROPERTY_ID
const clientEmail = process.env.GA_CLIENT_EMAIL
const rawKey = process.env.GA_PRIVATE_KEY || ""
const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey

let client: BetaAnalyticsDataClient | null = null

function getClient() {
  if (!propertyId || !clientEmail || !privateKey) return null
  if (!client) {
    client = new BetaAnalyticsDataClient({
      credentials: { client_email: clientEmail, private_key: privateKey },
    })
  }
  return client
}

export interface GaMetrics {
  activeUsers: number
  sessions: number
  pageViews: number
  avgSessionDuration: number
  bounceRate: number
  topPages: { path: string; views: number }[]
}

export async function fetchGaMetrics(startDate: string, endDate: string): Promise<GaMetrics | null> {
  const analyticsClient = getClient()
  if (!analyticsClient || !propertyId) return null

  try {
    const [metricsResponse] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
    })

    const [pagesResponse] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 5,
    })

    const row = metricsResponse.rows?.[0]
    if (!row) return null

    const topPages = (pagesResponse.rows || []).map((r) => ({
      path: r.dimensionValues?.[0]?.value || "—",
      views: parseInt(r.metricValues?.[0]?.value || "0", 10),
    }))

    return {
      activeUsers: parseInt(row.metricValues?.[0]?.value || "0", 10),
      sessions: parseInt(row.metricValues?.[1]?.value || "0", 10),
      pageViews: parseInt(row.metricValues?.[2]?.value || "0", 10),
      avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[4]?.value || "0"),
      topPages,
    }
  } catch (error) {
    console.error("[GA4] Failed to fetch metrics:", error)
    return null
  }
}
