"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Zap } from "lucide-react"

interface CreditsBadgeProps {
  appId: string
  /** If true, shows a compact pill (for navbars/headers). Default: false (shows card). */
  compact?: boolean
}

interface CreditsData {
  balance: number
  plan: string
  monthlyAllowance: number
}

export function CreditsBadge({ appId, compact = false }: CreditsBadgeProps) {
  const [data, setData] = useState<CreditsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!appId) return
    setLoading(true)
    fetch("/api/credits/balance", {
      headers: { "x-app-id": appId },
    })
      .then((r) => r.json())
      .then((d: CreditsData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [appId])

  if (!appId) return null

  if (compact) {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300 hover:border-zinc-500 transition-colors"
        title="View credits & pricing"
      >
        <Zap className="w-3 h-3 text-yellow-400" />
        {loading ? "…" : data?.balance === Infinity ? "∞" : (data?.balance ?? 0).toLocaleString()}
        <span className="text-zinc-500">credits</span>
      </Link>
    )
  }

  const pct = data && data.monthlyAllowance > 0
    ? Math.min(100, Math.round((data.balance / data.monthlyAllowance) * 100))
    : 0

  const barColor =
    pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500"

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">Credits</span>
        </div>
        <Link href="/pricing" className="text-xs text-zinc-400 hover:text-white transition-colors">
          Upgrade →
        </Link>
      </div>

      {loading ? (
        <div className="h-8 animate-pulse rounded bg-zinc-800" />
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">
              {data?.balance === Infinity ? "∞" : (data?.balance ?? 0).toLocaleString()}
            </span>
            {data?.monthlyAllowance !== undefined && data.balance !== Infinity && (
              <span className="text-xs text-zinc-500">/ {data.monthlyAllowance.toLocaleString()} this month</span>
            )}
          </div>

          {data && data.balance !== Infinity && (
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 capitalize">
              {data?.plan ?? "free"} plan
            </span>
            {data && data.balance !== Infinity && pct < 20 && (
              <Link
                href="/pricing"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                Buy more credits
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
