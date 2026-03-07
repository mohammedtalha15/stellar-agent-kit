import { NextResponse } from "next/server"
import { getAppIdFromRequest } from "./require-active-plan"
import { deductCredits, ensureCreditAccount, getBalance, type CreditEndpoint } from "./credits-store"
import { getPlanForAppId } from "./subscription-store"

const TESTER_APP_ID = "9009096129344dba93bdd7d1bdd55dc8"

/**
 * Checks credits for a request and deducts the cost of the given endpoint.
 *
 * Returns { appId, plan } on success, or a NextResponse (402/403) on failure.
 *
 * Usage in any API route:
 *   const auth = await requireCredits(request, "swap/quote")
 *   if (auth instanceof NextResponse) return auth
 */
export async function requireCredits(
  request: Request,
  endpoint: CreditEndpoint
): Promise<{ appId: string; balance: number } | NextResponse> {
  const appId = getAppIdFromRequest(request)

  // No app ID — allow (website demo, no gating)
  if (!appId) return { appId: "", balance: Infinity }

  // Tester ID — full pass-through
  if (appId === TESTER_APP_ID) return { appId, balance: Infinity }

  const plan = getPlanForAppId(appId)
  await ensureCreditAccount(appId, plan)

  const result = await deductCredits(appId, endpoint)

  if (!result.ok) {
    const balance = await getBalance(appId) ?? 0
    return NextResponse.json(
      {
        error: "Insufficient credits",
        details: `You have ${balance} credits but this operation costs more. Purchase credits or upgrade your plan at /pricing.`,
        balance,
        purchase_url: "/pricing",
      },
      { status: 402 }
    )
  }

  const balance = await getBalance(appId) ?? 0
  return { appId, balance }
}

/**
 * GET /api/credits/balance
 * Returns the current balance for the requesting app ID.
 */
export async function getCreditsForRequest(request: Request): Promise<NextResponse> {
  const appId = getAppIdFromRequest(request)
  if (!appId) {
    return NextResponse.json({ error: "No App ID provided" }, { status: 400 })
  }
  if (appId === TESTER_APP_ID) {
    return NextResponse.json({ balance: Infinity, plan: "pro" })
  }

  const plan = getPlanForAppId(appId)
  await ensureCreditAccount(appId, plan)
  const balance = await getBalance(appId) ?? 0
  return NextResponse.json({ balance, plan })
}
