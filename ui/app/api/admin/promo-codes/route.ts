import { NextRequest, NextResponse } from "next/server"
import { createPromoCode } from "@/lib/credits-store"

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const auth = request.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

/**
 * POST /api/admin/promo-codes
 * Headers: Authorization: Bearer <ADMIN_SECRET>
 * Body: { code: string, credits: number, maxUses?: number, expiresAt?: string }
 *
 * Creates a reusable promo code that grants credits when redeemed by users.
 *
 * Example:
 *   { code: "LAUNCH2025", credits: 500, maxUses: 100, expiresAt: "2025-12-31" }
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { code?: string; credits?: number; maxUses?: number; expiresAt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { code, credits, maxUses = 1, expiresAt } = body

  if (!code || typeof code !== "string" || code.trim().length < 3) {
    return NextResponse.json({ error: "code must be at least 3 characters" }, { status: 400 })
  }
  if (!credits || typeof credits !== "number" || credits <= 0 || !Number.isInteger(credits)) {
    return NextResponse.json({ error: "credits must be a positive integer" }, { status: 400 })
  }

  const result = await createPromoCode({
    code: code.trim(),
    credits,
    maxUses,
    expiresAt,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  return NextResponse.json({
    ok: true,
    code: code.trim().toUpperCase(),
    credits,
    maxUses,
    expiresAt: expiresAt ?? null,
  })
}
