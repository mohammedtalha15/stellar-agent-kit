import { NextRequest, NextResponse } from "next/server"
import { addCredits, createPromoCode } from "@/lib/credits-store"
import { ensureCreditAccount } from "@/lib/credits-store"
import { getPlanForAppId } from "@/lib/subscription-store"

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const auth = request.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

/**
 * POST /api/admin/grant-credits
 * Headers: Authorization: Bearer <ADMIN_SECRET>
 * Body: { appId: string, credits: number, reason?: string }
 *
 * Grants credits to any app ID. Use to hand out credits to users.
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { appId?: string; credits?: number; reason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { appId, credits, reason = "Admin grant" } = body

  if (!appId || typeof appId !== "string") {
    return NextResponse.json({ error: "appId is required" }, { status: 400 })
  }
  if (!credits || typeof credits !== "number" || credits <= 0 || !Number.isInteger(credits)) {
    return NextResponse.json({ error: "credits must be a positive integer" }, { status: 400 })
  }

  const plan = getPlanForAppId(appId)
  await ensureCreditAccount(appId, plan)
  await addCredits(appId, credits, reason)

  return NextResponse.json({
    ok: true,
    appId,
    creditsGranted: credits,
    reason,
  })
}
