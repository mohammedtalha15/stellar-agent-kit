/**
 * Self-contained x402 Stellar payment-gating logic.
 * Inlined from packages/x402-stellar-sdk so no external package is required.
 */

export interface X402Options {
  /** Payment destination (Stellar public key) */
  destination: string
  /** Price as a string, e.g. "0.5" */
  price: string
  /** Asset code, e.g. "XLM" or "USDC" */
  assetCode: string
  /** Asset issuer (empty/undefined for native XLM) */
  issuer?: string
  /** Network to verify on */
  network: "testnet" | "mainnet"
  /** Optional memo to validate on the transaction */
  memo?: string
}

export interface PaymentRequiredBody {
  error: string
  amount: string
  assetCode: string
  issuer?: string
  network: string
  destination: string
  memo?: string
}

const HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
} as const

interface HorizonPaymentOp {
  type: string
  to: string
  amount: string
  asset_type: string
  asset_code?: string
  asset_issuer?: string
}

/**
 * Verify a Stellar payment transaction on-chain.
 * Returns { valid: true } if the tx paid the destination with the required amount/asset.
 */
export async function verifyPayment(
  txHash: string,
  opts: X402Options
): Promise<{ valid: boolean; error?: string }> {
  const base = HORIZON_URLS[opts.network]

  let tx: { successful: boolean; memo?: string; memo_type?: string }
  try {
    const res = await fetch(`${base}/transactions/${txHash}`)
    if (!res.ok) return { valid: false, error: `Horizon ${res.status}` }
    tx = await res.json()
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Fetch failed" }
  }

  if (!tx.successful) return { valid: false, error: "Transaction not successful" }

  if (opts.memo && tx.memo_type && tx.memo) {
    const decoded = tx.memo_type === "text" ? tx.memo : null
    if (decoded !== opts.memo) return { valid: false, error: "Memo mismatch" }
  }

  const opsRes = await fetch(`${base}/transactions/${txHash}/operations?limit=20`)
  if (!opsRes.ok) return { valid: false, error: "Failed to fetch operations" }
  const opsData: { _embedded?: { records?: HorizonPaymentOp[] } } = await opsRes.json()
  const records = opsData._embedded?.records ?? []

  const required = parseFloat(opts.price)
  const isNative = !opts.issuer && (opts.assetCode === "XLM" || !opts.assetCode)

  for (const op of records) {
    if (op.type !== "payment") continue
    if (op.to !== opts.destination) continue
    if (parseFloat(op.amount) < required) continue
    if (isNative && op.asset_type === "native") return { valid: true }
    if (
      !isNative &&
      opts.issuer &&
      op.asset_type !== "native" &&
      op.asset_code === opts.assetCode &&
      op.asset_issuer === opts.issuer
    )
      return { valid: true }
  }

  return { valid: false, error: "No matching payment found" }
}

/**
 * Build the 402 Payment Required response headers and body.
 */
export function buildPaymentRequiredResponse(opts: X402Options): {
  headers: Record<string, string>
  body: PaymentRequiredBody
} {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-402-Amount": opts.price,
    "X-402-Asset-Code": opts.assetCode,
    "X-402-Network": opts.network,
    "X-402-Destination": opts.destination,
  }
  if (opts.issuer) headers["X-402-Issuer"] = opts.issuer
  if (opts.memo) headers["X-402-Memo"] = opts.memo

  const body: PaymentRequiredBody = {
    error: "Payment Required",
    amount: opts.price,
    assetCode: opts.assetCode,
    network: opts.network,
    destination: opts.destination,
  }
  if (opts.issuer) body.issuer = opts.issuer
  if (opts.memo) body.memo = opts.memo

  return { headers, body }
}

/**
 * Check if an incoming request has a valid payment receipt.
 * Returns { paid: true } if the X-402-Transaction-Hash header contains a
 * verified on-chain payment. Returns { paid: false } otherwise.
 */
export async function checkPayment(
  requestHeaders: Headers | Record<string, string>,
  opts: X402Options
): Promise<{ paid: boolean; txHash?: string; error?: string }> {
  const get = (k: string) =>
    requestHeaders instanceof Headers
      ? requestHeaders.get(k)
      : (requestHeaders as Record<string, string>)[k.toLowerCase()] ??
        (requestHeaders as Record<string, string>)[k]

  const txHash = get("x-402-transaction-hash")?.trim()
  if (!txHash) return { paid: false, error: "No payment receipt provided" }

  const { valid, error } = await verifyPayment(txHash, opts)
  if (!valid) return { paid: false, error: error ?? "Invalid payment" }
  return { paid: true, txHash }
}
