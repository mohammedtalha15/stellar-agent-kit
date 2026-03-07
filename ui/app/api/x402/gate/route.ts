/**
 * Generic x402 payment gate — the main endpoint for DevKit users.
 *
 * This is the endpoint shown in the DevKit dashboard.
 * Your App ID IS your API key — pass it as the X-App-Id header.
 * Payments go to the payout wallet you registered for that App ID.
 *
 * Usage (from your server/agent):
 *
 *   // 1. First call — will get 402 with payment details
 *   const res = await fetch("https://stellar-devkit.vercel.app/api/x402/gate", {
 *     headers: { "X-App-Id": process.env.STELLAR_DEVKIT_APP_ID }
 *   })
 *   if (res.status === 402) {
 *     const { destination, amount, assetCode, network } = await res.json()
 *     // ... build + sign + submit Stellar payment transaction ...
 *     const txHash = "..."
 *
 *     // 2. Retry with payment receipt
 *     const paid = await fetch("https://stellar-devkit.vercel.app/api/x402/gate", {
 *       headers: {
 *         "X-App-Id": process.env.STELLAR_DEVKIT_APP_ID,
 *         "X-402-Transaction-Hash": txHash,
 *       }
 *     })
 *     const data = await paid.json()
 *   }
 *
 * The gated content / callback:
 *   - On GET: pass a `resource` query param — the gate will verify payment and proxy / confirm.
 *   - On POST: pass a JSON body — the gate echoes it back after payment is verified.
 *
 * Configure pricing via env:
 *   X402_PRICE   — price per call (default "1")
 *   X402_ASSET   — asset code (default "XLM")
 *   X402_NETWORK — "testnet" | "mainnet" (default "testnet")
 */

import { NextRequest } from "next/server"
import { checkPayment, buildPaymentRequiredResponse, X402Options } from "@/lib/x402"
import { getProject } from "@/lib/projectStore"
import { isAppIdValid } from "@/lib/projectStore"

const DEFAULT_PRICE = process.env.X402_PRICE ?? "1"
const DEFAULT_ASSET = process.env.X402_ASSET ?? "XLM"
const DEFAULT_NETWORK = (
  process.env.X402_NETWORK === "mainnet" ? "mainnet" : "testnet"
) as "testnet" | "mainnet"

function resolveOptions(appId: string): X402Options | Response {
  if (!isAppIdValid(appId)) {
    return Response.json(
      {
        error: "Invalid App ID",
        message:
          "The X-App-Id header must match a registered DevKit project. Create one at /devkit.",
      },
      { status: 401 }
    )
  }

  const project = getProject(appId)
  if (!project?.payoutWallet) {
    return Response.json(
      {
        error: "No payout wallet configured",
        message:
          "Set a payout wallet in your DevKit project settings before using the x402 gate.",
      },
      { status: 503 }
    )
  }

  return {
    destination: project.payoutWallet,
    price: DEFAULT_PRICE,
    assetCode: DEFAULT_ASSET,
    network: DEFAULT_NETWORK,
    memo: appId.slice(0, 28),
  }
}

/**
 * GET /api/x402/gate
 *
 * Required headers:
 *   X-App-Id: <your DevKit App ID>
 *
 * Optional header (after payment):
 *   X-402-Transaction-Hash: <stellarTxHash>
 *
 * Query params:
 *   resource — optional URL to describe what is being unlocked (for logging / UX)
 */
export async function GET(request: NextRequest) {
  const appId = request.headers.get("x-app-id")?.trim()
  if (!appId) {
    return Response.json(
      {
        error: "Missing X-App-Id header",
        message: "Pass your DevKit App ID as the X-App-Id request header. Find it at /devkit.",
      },
      { status: 400 }
    )
  }

  const opts = resolveOptions(appId)
  if (opts instanceof Response) return opts

  const { paid, txHash, error } = await checkPayment(request.headers, opts)

  if (!paid) {
    const { headers, body } = buildPaymentRequiredResponse(opts)
    return Response.json(
      {
        ...body,
        hint: error,
        docs: "Include X-402-Transaction-Hash header with a verified Stellar tx hash to unlock.",
      },
      { status: 402, headers }
    )
  }

  const resource = request.nextUrl.searchParams.get("resource") ?? null

  return Response.json({
    success: true,
    appId,
    txHash,
    resource,
    unlockedAt: new Date().toISOString(),
    message: "Payment verified. Access granted.",
  })
}

/**
 * POST /api/x402/gate
 *
 * Required headers:
 *   X-App-Id: <your DevKit App ID>
 *   X-402-Transaction-Hash: <stellarTxHash>
 * Body: any JSON
 */
export async function POST(request: NextRequest) {
  const appId = request.headers.get("x-app-id")?.trim()
  if (!appId) {
    return Response.json({ error: "Missing X-App-Id header" }, { status: 400 })
  }

  const opts = resolveOptions(appId)
  if (opts instanceof Response) return opts

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
    appId,
    txHash,
    echo: body,
    processedAt: new Date().toISOString(),
    message: "POST accepted. Payment verified on Stellar.",
  })
}
