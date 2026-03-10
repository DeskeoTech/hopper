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
  newVsReturning: { type: string; users: number }[]
  trafficSources: { source: string; users: number; sessions: number }[]
  devices: { device: string; users: number }[]
  countries: { country: string; users: number }[]
  cities: { city: string; users: number }[]
  landingPages: { path: string; sessions: number }[]
  exitPages: { path: string; views: number }[]
  events: { name: string; count: number }[]
  dailyTraffic: { date: string; users: number; sessions: number; pageViews: number }[]
}

export async function fetchGaMetrics(startDate: string, endDate: string): Promise<GaMetrics | null> {
  const analyticsClient = getClient()
  if (!analyticsClient || !propertyId) return null

  const prop = `properties/${propertyId}`
  const dateRanges = [{ startDate, endDate }]

  try {
    // Run all reports in parallel
    const [
      [metricsResponse],
      [pagesResponse],
      [newVsRetResponse],
      [sourcesResponse],
      [devicesResponse],
      [countriesResponse],
      [citiesResponse],
      [landingResponse],
      [exitResponse],
      [eventsResponse],
      [dailyResponse],
    ] = await Promise.all([
      // 1. Overall metrics
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
      }),
      // 2. Top pages
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      // 3. New vs Returning
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "newVsReturning" }],
        metrics: [{ name: "activeUsers" }],
      }),
      // 4. Traffic sources
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      }),
      // 5. Devices
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),
      // 6. Countries
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      }),
      // 7. Cities
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "city" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      }),
      // 8. Landing pages
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "landingPagePlusQueryString" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      }),
      // 9. Exit pages
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "CONTAINS", value: "/" },
          },
        },
      }),
      // 10. Events
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 15,
      }),
      // 11. Daily traffic evolution
      analyticsClient.runReport({
        property: prop,
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ])

    const row = metricsResponse.rows?.[0]
    if (!row) return null

    const parseRows = (rows: typeof pagesResponse.rows) => rows || []

    return {
      activeUsers: parseInt(row.metricValues?.[0]?.value || "0", 10),
      sessions: parseInt(row.metricValues?.[1]?.value || "0", 10),
      pageViews: parseInt(row.metricValues?.[2]?.value || "0", 10),
      avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[4]?.value || "0"),

      topPages: parseRows(pagesResponse.rows).map((r) => ({
        path: r.dimensionValues?.[0]?.value || "—",
        views: parseInt(r.metricValues?.[0]?.value || "0", 10),
      })),

      newVsReturning: parseRows(newVsRetResponse.rows).map((r) => ({
        type: r.dimensionValues?.[0]?.value || "unknown",
        users: parseInt(r.metricValues?.[0]?.value || "0", 10),
      })),

      trafficSources: parseRows(sourcesResponse.rows).map((r) => ({
        source: r.dimensionValues?.[0]?.value || "unknown",
        users: parseInt(r.metricValues?.[0]?.value || "0", 10),
        sessions: parseInt(r.metricValues?.[1]?.value || "0", 10),
      })),

      devices: parseRows(devicesResponse.rows).map((r) => ({
        device: r.dimensionValues?.[0]?.value || "unknown",
        users: parseInt(r.metricValues?.[0]?.value || "0", 10),
      })),

      countries: parseRows(countriesResponse.rows).map((r) => ({
        country: r.dimensionValues?.[0]?.value || "unknown",
        users: parseInt(r.metricValues?.[0]?.value || "0", 10),
      })),

      cities: parseRows(citiesResponse.rows).map((r) => ({
        city: r.dimensionValues?.[0]?.value || "unknown",
        users: parseInt(r.metricValues?.[0]?.value || "0", 10),
      })),

      landingPages: parseRows(landingResponse.rows).map((r) => ({
        path: r.dimensionValues?.[0]?.value || "—",
        sessions: parseInt(r.metricValues?.[0]?.value || "0", 10),
      })),

      exitPages: parseRows(exitResponse.rows).map((r) => ({
        path: r.dimensionValues?.[0]?.value || "—",
        views: parseInt(r.metricValues?.[0]?.value || "0", 10),
      })),

      events: parseRows(eventsResponse.rows).map((r) => ({
        name: r.dimensionValues?.[0]?.value || "unknown",
        count: parseInt(r.metricValues?.[0]?.value || "0", 10),
      })),

      dailyTraffic: parseRows(dailyResponse.rows).map((r) => ({
        date: r.dimensionValues?.[0]?.value || "",
        users: parseInt(r.metricValues?.[0]?.value || "0", 10),
        sessions: parseInt(r.metricValues?.[1]?.value || "0", 10),
        pageViews: parseInt(r.metricValues?.[2]?.value || "0", 10),
      })),
    }
  } catch (error) {
    console.error("[GA4] Failed to fetch metrics:", error)
    return null
  }
}
