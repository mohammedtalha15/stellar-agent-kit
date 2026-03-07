import { NextRequest, NextResponse } from "next/server"
import { getAppIdFromRequest } from "@/lib/require-active-plan"
import { redeemPromoCode, getBalance, ensureCreditAccount } from "@/lib/credits-store"
import { getPlanForAppId } from "@/lib/subscription-store"

/**
 * POST /api/credits/redeem
 * Headers: x-app-id or Authorization: Bearer <appId>
 * Body: { code: string }
 *
 * Redeems a promo code for credits.
 */
export async function POST(request: NextRequest) {
  const appId = getAppIdFromRequest(request)
  if (!appId) {
    return NextResponse.json({ error: "No App ID provided. Send x-app-id header." }, { status: 400 })
  }

  let body: { code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { code } = body
  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "code is required" }, { status: 400 })
  }

  const plan = getPlanForAppId(appId)
  await ensureCreditAccount(appId, plan)

  const result = await redeemPromoCode(code.trim(), appId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const newBalance = await getBalance(appId) ?? 0

  return NextResponse.json({
    ok: true,
    creditsAdded: result.credits,
    newBalance,
  })
}
