import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  AUTO_CREDIT_REASON_PREFIX,
  collectEligibleCompanies,
  processCompany,
} from "@/lib/actions/monthly-credits"

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Compute current period and expiration
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth() // 0-indexed
    const periodString = `${year}-${String(month + 1).padStart(2, "0")}`
    const reason = `${AUTO_CREDIT_REASON_PREFIX} — ${periodString}`

    // End of current month (last day, 23:59:59.999 UTC)
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
    const expiration = endOfMonth.toISOString()

    // Collect eligible companies
    const companies = await collectEligibleCompanies(supabase)

    // Process each company
    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const company of companies) {
      try {
        const wasProcessed = await processCompany(supabase, company, reason, expiration)
        if (wasProcessed) {
          results.processed++
        } else {
          results.skipped++
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        console.error(`[monthly-credits] Error processing ${company.companyId}:`, message)
        results.errors.push(`${company.companyId}: ${message}`)
      }
    }

    console.log(
      `[monthly-credits] Period ${periodString}: ${results.processed} processed, ${results.skipped} skipped, ${results.errors.length} errors`
    )

    return NextResponse.json({
      success: true,
      period: periodString,
      total_eligible: companies.length,
      ...results,
    })
  } catch (error) {
    console.error("[monthly-credits] Fatal error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
