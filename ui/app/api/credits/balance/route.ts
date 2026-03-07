import { NextRequest, NextResponse } from "next/server"
import { getAppIdFromRequest } from "@/lib/require-active-plan"
import { ensureCreditAccount, getBalance, getTransactions } from "@/lib/credits-store"
import { getPlanForAppId } from "@/lib/subscription-store"
import { PLAN_MONTHLY_CREDITS } from "@/lib/credits-store"

/**
 * GET /api/credits/balance
 * Headers: x-app-id or Authorization: Bearer <appId>
 *
 * Returns: { balance, plan, monthlyAllowance, transactions? }
 */
export async function GET(request: NextRequest) {
  const appId = getAppIdFromRequest(request)
  if (!appId) {
    return NextResponse.json({ error: "No App ID provided. Send x-app-id header." }, { status: 400 })
  }

  const plan = getPlanForAppId(appId)
  await ensureCreditAccount(appId, plan)
  const balance = await getBalance(appId) ?? 0
  const withTransactions = request.nextUrl.searchParams.get("transactions") === "1"
  const transactions = withTransactions ? await getTransactions(appId) : undefined

  return NextResponse.json({
    balance,
    plan,
    monthlyAllowance: PLAN_MONTHLY_CREDITS[plan],
    ...(transactions ? { transactions } : {}),
  })
}
