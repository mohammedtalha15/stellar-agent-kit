"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Cpu,
  Copy,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Wallet,
  RefreshCw,
  FileStack,
  Lock,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/page-transition"
import { CodeWindow } from "@/components/code-window"

const PROJECT_STORAGE_KEY = "stellar-devkit-project"

type DevKitProject = {
  name: string
  appId: string
  payoutWallet: string
}

// Mock stats (replace with API when available)
const MOCK_STATS = {
  totalRevenue: "0.000050",
  revenueUnit: "XLM",
  totalTransactions: 10,
  successRate: "99.2",
}

type ActivityItem = {
  id: string
  type: string
  timeAgo: string
  amount: string
  unit: string
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "1", type: "Payment received", timeAgo: "39d ago", amount: "0.000005", unit: "XLM" },
  { id: "2", type: "Payment received", timeAgo: "40d ago", amount: "0.000005", unit: "XLM" },
  { id: "3", type: "Payment received", timeAgo: "42d ago", amount: "0.000005", unit: "XLM" },
]

function generateAppId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "")
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
}

const DEVKIT_TABS = ["overview", "mcp"] as const
type DevKitTab = (typeof DEVKIT_TABS)[number]

export default function DevKitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const initialTab: DevKitTab = DEVKIT_TABS.includes(tabParam as DevKitTab) ? (tabParam as DevKitTab) : "overview"
  const [activeTab, setActiveTab] = useState<DevKitTab>(initialTab)

  useEffect(() => {
    const t = DEVKIT_TABS.includes(tabParam as DevKitTab) ? (tabParam as DevKitTab) : "overview"
    setActiveTab(t)
  }, [tabParam])

  const onTabChange = (value: string) => {
    const next = (DEVKIT_TABS.includes(value as DevKitTab) ? value : "overview") as DevKitTab
    setActiveTab(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next === "overview") params.delete("tab")
    else params.set("tab", next)
    router.replace(params.toString() ? `/devkit?${params}` : "/devkit", { scroll: false })
  }

  const [project, setProject] = useState<DevKitProject | null>(null)
  const [projectNameInput, setProjectNameInput] = useState("")
  const [showAppId, setShowAppId] = useState(false)
  const [editingPayout, setEditingPayout] = useState(false)
  const [payoutInput, setPayoutInput] = useState("")
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)
  const [copiedWallet, setCopiedWallet] = useState(false)
  const [activity, setActivity] = useState<ActivityItem[]>(MOCK_ACTIVITY)
  const [refreshing, setRefreshing] = useState(false)

  const loadProject = useCallback(() => {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(PROJECT_STORAGE_KEY) : null
      if (raw) {
        const p = JSON.parse(raw) as DevKitProject
        setProject(p)
        setPayoutInput(p.payoutWallet)
        fetch("/api/v1/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: p.name, appId: p.appId, payoutWallet: p.payoutWallet }),
        }).catch(() => {})
      } else {
        setProject(null)
      }
    } catch {
      setProject(null)
    }
  }, [])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const createProject = async () => {
    const name = projectNameInput.trim() || "My Project"
    const appId = generateAppId()
    const payoutWallet = ""
    const p: DevKitProject = { name, appId, payoutWallet }
    setProject(p)
    setPayoutInput("")
    setProjectNameInput("")
    try {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(p))
      await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, appId, payoutWallet }),
      })
    } catch {}
  }

  const deleteProject = () => {
    if (typeof window !== "undefined" && window.confirm("Delete this project permanently?")) {
      setProject(null)
      setProjectNameInput("")
      setEditingPayout(false)
      try {
        localStorage.removeItem(PROJECT_STORAGE_KEY)
      } catch {}
    }
  }

  const savePayoutWallet = () => {
    if (project && payoutInput.trim()) {
      const next = { ...project, payoutWallet: payoutInput.trim() }
      setProject(next)
      setEditingPayout(false)
      try {
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(next))
      } catch {}
    }
  }

  const apiEndpoint =
    typeof window !== "undefined" && project
      ? `${window.location.origin}/api/v1/validate?appId=${project.appId}`
      : ""

  const copyEndpoint = () => {
    if (apiEndpoint) {
      navigator.clipboard.writeText(apiEndpoint)
      setCopiedEndpoint(true)
      setTimeout(() => setCopiedEndpoint(false), 2000)
    }
  }

  const copyWallet = () => {
    if (project?.payoutWallet) {
      navigator.clipboard.writeText(project.payoutWallet)
      setCopiedWallet(true)
      setTimeout(() => setCopiedWallet(false), 2000)
    }
  }

  const refreshActivity = () => {
    setRefreshing(true)
    // Simulate refresh; replace with API call when available
    setTimeout(() => {
      setActivity((prev) => [...prev].sort(() => Math.random() - 0.5))
      setRefreshing(false)
    }, 600)
  }

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <Navbar />
      <PageTransition>
        <section className="relative z-20 pt-28 md:pt-32 pb-16 md:pb-24">
          <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-12">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                DevKit
              </h1>
              <p className="mt-2 text-lg text-zinc-400 max-w-2xl">
                Create a project to get your API key and manage your integration. Use the <a href="/protocols" className="text-[#a78bfa] hover:underline">Protocols</a> page to explore protocols and code samples.
              </p>
            </header>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
              <TabsList className="bg-zinc-950/80 border border-zinc-800 p-1.5 mb-8 rounded-xl flex flex-wrap gap-1 h-12">
                <TabsTrigger
                  value="overview"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium h-full"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="mcp"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium h-full"
                >
                  <Cpu className="h-4 w-4 shrink-0" />
                  MCP
                </TabsTrigger>
              </TabsList>

              {/* ─── Overview: Dashboard ───────────────────────────────────── */}
              <TabsContent value="overview" className="mt-0 space-y-8">
                {/* Top row: Overview title, project selector, Create Project */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-white">Overview</h2>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:gap-4">
                    <Input
                      placeholder="Project name"
                      value={project ? project.name : projectNameInput}
                      onChange={(e) => (project ? null : setProjectNameInput(e.target.value))}
                      onKeyDown={(e) => e.key === "Enter" && !project && createProject()}
                      className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 w-full sm:w-48 h-11 rounded-xl border focus:ring-2 focus:ring-zinc-600 focus:border-zinc-600"
                      readOnly={!!project}
                    />
                    {!project && (
                      <LiquidMetalButton
                        label="+ Create Project"
                        onClick={createProject}
                        width={180}
                        className="shrink-0"
                      />
                    )}
                  </div>
                </div>

                {project && (
                  <>
                    {/* Project details card */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Project</p>
                          <p className="text-white font-medium">{project.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">APP Id</p>
                          <div className="flex gap-2 items-center">
                            <code className="flex-1 min-w-0 truncate rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm font-mono text-zinc-300">
                              {showAppId ? project.appId : "••••••••••••••••••••••••••••••••"}
                            </code>
                            <button
                              type="button"
                              onClick={() => setShowAppId((s) => !s)}
                              className="p-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
                              aria-label={showAppId ? "Hide" : "Show"}
                            >
                              {showAppId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Validation Endpoint</p>
                        <p className="text-xs text-zinc-500 mb-2">Use this in your server SDK to verify your App ID is active.</p>
                        <div className="flex gap-2 items-center">
                          <code className="flex-1 min-w-0 truncate rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm font-mono text-zinc-300">
                            {apiEndpoint}
                          </code>
                          <button
                            type="button"
                            onClick={copyEndpoint}
                            className="p-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            {copiedEndpoint ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copiedEndpoint ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          Payout Wallet
                          <button
                            type="button"
                            onClick={() => (editingPayout ? savePayoutWallet() : setEditingPayout(true))}
                            className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </p>
                        {editingPayout ? (
                          <div className="flex gap-2 flex-wrap">
                            <Input
                              value={payoutInput}
                              onChange={(e) => setPayoutInput(e.target.value)}
                              placeholder="Enter your Stellar address (G...)"
                              className="bg-zinc-950 border-zinc-700 text-white font-mono text-sm rounded-xl flex-1 min-w-[200px]"
                            />
                            <Button size="sm" onClick={savePayoutWallet} className="shrink-0 rounded-xl">
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <code className="flex-1 min-w-0 truncate rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm font-mono text-zinc-300">
                              {project.payoutWallet || "Not set — click Edit to add"}
                            </code>
                            <button
                              type="button"
                              onClick={copyWallet}
                              disabled={!project?.payoutWallet}
                              className="p-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                            >
                              {copiedWallet ? <Check className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 pt-6 border-t border-zinc-800">
                        <p className="text-sm font-medium text-zinc-400 mb-1">Danger Zone</p>
                        <p className="text-xs text-zinc-500 mb-4">Delete this project permanently.</p>
                        <Button
                          variant="destructive"
                          onClick={deleteProject}
                          className="rounded-xl bg-red-950/50 border border-red-900/50 text-red-400 hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Summary stats */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total Revenue</p>
                        <p className="text-2xl font-semibold text-white">
                          {MOCK_STATS.totalRevenue} {MOCK_STATS.revenueUnit}
                        </p>
                        <p className="text-sm text-zinc-500 mt-1">Platform fees collected</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total Transactions</p>
                        <p className="text-2xl font-semibold text-white">{MOCK_STATS.totalTransactions}</p>
                        <p className="text-sm text-zinc-500 mt-1">Payments processed</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Success Rate</p>
                        <p className="text-2xl font-semibold text-white">{MOCK_STATS.successRate}%</p>
                        <p className="text-sm text-zinc-500 mt-1">Transaction success</p>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshActivity}
                          disabled={refreshing}
                          className="rounded-xl border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                          Refresh
                        </Button>
                      </div>
                      <ul className="space-y-3">
                        {activity.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-4 py-3 border-b border-zinc-800/80 last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileStack className="h-4 w-4 text-zinc-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white">{item.type}</p>
                                <p className="text-xs text-zinc-500">{item.timeAgo}</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-white shrink-0">
                              {item.amount} {item.unit}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {!project && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
                    <p className="text-zinc-400 mb-4">Create a project to get your APP Id and API endpoint.</p>
                    <LiquidMetalButton label="+ Create Project" onClick={createProject} width={180} />
                  </div>
                )}

                {/* x402 callout */}
                <Link
                  href="/x402"
                  className="group flex items-center justify-between rounded-2xl border border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 hover:bg-violet-500/10 px-6 py-5 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
                      <Lock className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">x402 Payment Wall</p>
                      <p className="text-xs text-zinc-400">Try the live demo — gate an API route behind a Stellar payment</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-violet-400 transition-colors shrink-0" />
                </Link>
              </TabsContent>

              {/* ─── MCP tab ───────────────────────────────────────────────── */}
              <TabsContent value="mcp" className="mt-8 space-y-8">
                <p className="text-zinc-400">
                  The <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm">stellar-devkit-mcp</code> server exposes Stellar contract IDs and SDK snippets to LLMs (e.g. Claude in Cursor). Add it in Cursor settings to get tools and resources.
                </p>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Install &amp; configure in Cursor</h3>
                  <CodeWindow
                    code={`# Install the MCP server (already in your project if you use the monorepo)
npm install stellar-devkit-mcp

# Add to Cursor MCP settings (e.g. .cursor/mcp.json or Cursor Settings > MCP):
{
  "mcpServers": {
    "stellar-devkit": {
      "command": "npx",
      "args": ["stellar-devkit-mcp"]
    }
  }
}`}
                    title="stellar-devkit-mcp.mcp.json"
                    startLine={1}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Tools</h3>
                  <ul className="space-y-3">
                    <li className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                      <p className="font-mono text-sm text-[#a78bfa]">get_stellar_contract</p>
                      <p className="text-sm text-zinc-500 mt-1">
                        Get Soroban contract ID for a protocol (e.g. soroswap mainnet).
                      </p>
                    </li>
                    <li className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                      <p className="font-mono text-sm text-[#a78bfa]">get_sdk_snippet</p>
                      <p className="text-sm text-zinc-500 mt-1">
                        Get code snippet for StellarAgentKit or x402 (swap, quote, x402-server, x402-client).
                      </p>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Resources</h3>
                  <p className="text-sm text-zinc-500 mb-2">
                    The server also exposes Stellar docs/content as MCP resources (e.g. stellar://...) so the model can read them when needed.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                  <h3 className="text-lg font-medium text-white mb-2">How to show MCP working</h3>
                  <ol className="text-sm text-zinc-400 space-y-3 list-decimal list-inside">
                    <li>
                      <strong className="text-zinc-300">Add the server:</strong> In Cursor go to Settings → MCP (or add the config above to <code className="rounded bg-zinc-800 px-1">.cursor/mcp.json</code>). Use <code className="rounded bg-zinc-800 px-1">command: "npx"</code>, <code className="rounded bg-zinc-800 px-1">args: ["stellar-devkit-mcp"]</code>. Save and restart Cursor so the server starts.
                    </li>
                    <li>
                      <strong className="text-zinc-300">Check it&apos;s connected:</strong> In Cursor chat, open the MCP / tools area. You should see <code className="rounded bg-zinc-800 px-1">stellar-devkit</code> with tools like <code className="rounded bg-zinc-800 px-1">get_stellar_contract</code> and <code className="rounded bg-zinc-800 px-1">get_sdk_snippet</code>.
                    </li>
                    <li>
                      <strong className="text-zinc-300">Trigger the tools:</strong> In a new Cursor chat, try:
                      <ul className="mt-2 ml-4 list-disc text-zinc-500 space-y-1">
                        <li>&quot;Use the Stellar DevKit MCP tool to get the SoroSwap mainnet contract ID.&quot;</li>
                        <li>If the model answers without calling the tool, try: &quot;Call the get_stellar_contract tool with protocol soroswap and network mainnet.&quot;</li>
                        <li>&quot;Call get_sdk_snippet with operation swap and show me the code.&quot;</li>
                      </ul>
                      When the model actually invokes the tool, you&apos;ll see the contract ID or snippet in the reply.
                    </li>
                  </ol>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </PageTransition>
    </main>
  )
}
