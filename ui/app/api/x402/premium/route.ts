/**
 * x402-gated premium API route.
 *
 * Protects access with HTTP 402 Payment Required (Stellar x402 protocol).
 *
 * Two ways to call this endpoint:
 *
 * 1. Server-configured mode (global destination):
 *    Set X402_DESTINATION, X402_PRICE, X402_ASSET, X402_NETWORK in env.
 *    Any caller that includes a valid X-402-Transaction-Hash is allowed through.
 *
 * 2. Per-App-ID mode (DevKit integration):
 *    Pass the X-App-Id header with your DevKit App ID.
 *    The payment destination will be the payout wallet you registered in the DevKit.
 *    This is the recommended way — your App ID is your API key.
 *
 * Flow:
 *   Client → GET /api/x402/premium   (no payment header)
 *           ← 402 { destination, amount, assetCode, network }
 *   Client → pays on Stellar → gets txHash
 *   Client → GET /api/x402/premium   (X-402-Transaction-Hash: <txHash>)
 *           ← 200 { success: true, data: { ... } }
 */

import { NextRequest } from "next/server"
import { checkPayment, buildPaymentRequiredResponse, X402Options } from "@/lib/x402"
import { getProject } from "@/lib/projectStore"

const DEFAULT_PRICE = process.env.X402_PRICE ?? "1"
const DEFAULT_ASSET = process.env.X402_ASSET ?? "XLM"
const DEFAULT_NETWORK = (
  process.env.X402_NETWORK === "mainnet" ? "mainnet" : "testnet"
) as "testnet" | "mainnet"

/**
 * Resolve payment options for a request.
 * If the caller provides X-App-Id, use that project's payout wallet.
 * Otherwise fall back to the global X402_DESTINATION env var.
 */
function resolveOptions(request: NextRequest): X402Options | { error: string; status: number } {
  const appId = request.headers.get("x-app-id")?.trim()

  if (appId) {
    const project = getProject(appId)
    if (!project) {
      return {
        error: `App ID "${appId}" not found. Create a project in the DevKit dashboard first.`,
        status: 401,
      }
    }
    if (!project.payoutWallet) {
      return {
        error: `App ID "${appId}" has no payout wallet configured. Set it in the DevKit dashboard.`,
        status: 503,
      }
    }
    return {
      destination: project.payoutWallet,
      price: DEFAULT_PRICE,
      assetCode: DEFAULT_ASSET,
      network: DEFAULT_NETWORK,
      memo: appId.slice(0, 28), // use appId prefix as memo for traceability
    }
  }

  const destination = process.env.X402_DESTINATION
  if (!destination) {
    return {
      error:
        "x402 not configured. Either set X402_DESTINATION env var or pass X-App-Id header with a registered DevKit App ID.",
      status: 503,
    }
  }

  return {
    destination,
    price: DEFAULT_PRICE,
    assetCode: DEFAULT_ASSET,
    network: DEFAULT_NETWORK,
    ...(process.env.X402_MEMO ? { memo: process.env.X402_MEMO } : {}),
  }
}

function isError(r: X402Options | { error: string; status: number }): r is { error: string; status: number } {
  return "error" in r
}

/**
 * GET /api/x402/premium
 * Returns premium data if payment is verified, or 402 with payment instructions.
 */
export async function GET(request: NextRequest) {
  const opts = resolveOptions(request)
  if (isError(opts)) {
    return Response.json({ error: opts.error }, { status: opts.status })
  }

  const { paid, txHash, error } = await checkPayment(request.headers, opts)

  if (!paid) {
    const { headers, body } = buildPaymentRequiredResponse(opts)
    return Response.json({ ...body, hint: error }, { status: 402, headers })
  }

  return Response.json({
    success: true,
    message: "Payment verified. Welcome to the premium API.",
    txHash,
    data: {
      feature: "stellar-devkit-premium",
      unlockedAt: new Date().toISOString(),
      note: "This content is only visible after a successful Stellar payment via the x402 protocol.",
    },
  })
}

/**
 * POST /api/x402/premium
 * Same gate, accepts a JSON body.
 */
export async function POST(request: NextRequest) {
  const opts = resolveOptions(request)
  if (isError(opts)) {
    return Response.json({ error: opts.error }, { status: opts.status })
  }

  const { paid, txHash, error } = await checkPayment(request.headers, opts)

  if (!paid) {
    const { headers, body } = buildPaymentRequiredResponse(opts)
    return Response.json({ ...body, hint: error }, { status: 402, headers })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch { /* no body */ }

  return Response.json({
    success: true,
    echo: body,
    txHash,
    message: "POST accepted. Payment verified on Stellar.",
    processedAt: new Date().toISOString(),
  })
}
