import { NextResponse } from "next/server"
import { isAppIdValid } from "@/lib/projectStore"
import { getPlanForOrder, setPlanForAppId, type PlanId } from "@/lib/subscription-store"
import { setPlanCredits, PLAN_MONTHLY_CREDITS } from "@/lib/credits-store"

/**
 * Link a DevKit appId to a successful payment so the appId gets an active plan and credits.
 * Call after the user has paid (paymentId from Dodo return) and has a registered project (appId).
 * Body: { appId: string, paymentId: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { appId, paymentId } = body ?? {}

    if (!appId || typeof appId !== "string" || appId.length < 8) {
      return NextResponse.json(
        { error: "Invalid appId; required non-empty string (min 8 chars)." },
        { status: 400 }
      )
    }
    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json(
        { error: "Invalid paymentId; required (from your pricing payment success)." },
        { status: 400 }
      )
    }

    const plan = getPlanForOrder(paymentId) as PlanId | undefined
    if (!plan || (plan !== "builder" && plan !== "pro")) {
      return NextResponse.json(
        { error: "Payment not found or not yet activated. Complete payment and try again, or wait a moment if you just paid." },
        { status: 400 }
      )
    }

    if (!isAppIdValid(appId)) {
      return NextResponse.json(
        { error: "App ID not registered. Create a project in DevKit first, then link it here." },
        { status: 400 }
      )
    }

    setPlanForAppId(appId.trim(), plan)
    await setPlanCredits(appId.trim(), plan)

    return NextResponse.json({
      ok: true,
      appId: appId.trim(),
      plan,
      credits: PLAN_MONTHLY_CREDITS[plan],
    })
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
