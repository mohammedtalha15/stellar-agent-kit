import { z } from "zod";
import { getNetworkConfig } from "../config/networks.js";
import { StellarClient } from "../core/stellarClient.js";
import { SoroSwapClient, TESTNET_ASSETS, } from "../defi/index.js";
/** Resolve "XLM" | "USDC" | contractId (C...) to Soroban Asset for testnet. */
function resolveAssetSymbol(symbol, network) {
    const s = symbol.trim().toUpperCase();
    if (network !== "testnet") {
        if (s.startsWith("C") && s.length === 56)
            return { contractId: symbol.trim() };
        throw new Error(`swap_asset on mainnet requires contract IDs (C...). Got: ${symbol}`);
    }
    if (s === "XLM")
        return { contractId: TESTNET_ASSETS.XLM };
    if (s === "USDC")
        return { contractId: TESTNET_ASSETS.USDC };
    if (s.startsWith("C") && symbol.length === 56)
        return { contractId: symbol.trim() };
    throw new Error(`Unknown asset "${symbol}". Use XLM, USDC, or a Soroban contract ID (C...).`);
}
/** Convert human amount to raw units (7 decimals for XLM, 6 for USDC on testnet). */
function toRawAmount(amount, assetSymbol) {
    const a = amount.trim();
    if (!/^\d+(\.\d+)?$/.test(a))
        return a;
    const upper = assetSymbol.trim().toUpperCase();
    const decimals = upper === "XLM" ? 7 : upper === "USDC" ? 6 : 7;
    const num = Number(a);
    if (!Number.isFinite(num) || num < 0)
        return a;
    const raw = Math.floor(num * 10 ** decimals);
    return String(raw);
}
export const tools = [
    {
        name: "check_balance",
        description: "Get all token balances for a Stellar address",
        parameters: z.object({
            address: z.string().describe("Stellar public key (starts with G)"),
            network: z.enum(["testnet", "mainnet"]).optional().default("testnet"),
        }),
        execute: async ({ address, network = "testnet", }) => {
            const net = network ?? "testnet";
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3d1882c5-dc48-494c-98b8-3a0080ef9d74', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'agentTools.ts:check_balance', message: 'check_balance params', data: { address, network: net }, hypothesisId: 'H1', timestamp: Date.now() }) }).catch(() => { });
            // #endregion
            const config = getNetworkConfig(net);
            const client = new StellarClient(config);
            const balances = await client.getBalance(address);
            return { balances };
        },
    },
    {
        name: "swap_asset",
        description: "Get quote and execute token swap via SoroSwap DEX (testnet: XLM, USDC or contract IDs)",
        parameters: z.object({
            fromAsset: z
                .string()
                .describe("XLM or ASSET_CODE:ISSUER or Soroban contract ID (C...)"),
            toAsset: z.string().describe("Same format as fromAsset"),
            amount: z.string().describe("Amount to swap (e.g. '10' for 10 XLM)"),
            address: z.string().describe("Your Stellar public key (G...)"),
            network: z.enum(["testnet", "mainnet"]).default("testnet"),
            privateKey: z
                .string()
                .optional()
                .describe("Secret key for signing (DEMO ONLY). If omitted, returns quote only."),
        }),
        execute: async ({ fromAsset, toAsset, amount, address, network, privateKey, }) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3d1882c5-dc48-494c-98b8-3a0080ef9d74', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'agentTools.ts:swap_asset', message: 'swap params', data: { fromAsset, toAsset, addressLen: address?.length, addressTrimmed: address?.trim?.()?.length }, hypothesisId: 'H1', timestamp: Date.now() }) }).catch(() => { });
            // #endregion
            const config = getNetworkConfig(network);
            const soroSwapClient = new SoroSwapClient(config);
            const from = resolveAssetSymbol(fromAsset.trim(), network);
            const to = resolveAssetSymbol(toAsset.trim(), network);
            const rawAmount = toRawAmount(amount, fromAsset.trim());
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3d1882c5-dc48-494c-98b8-3a0080ef9d74', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'agentTools.ts:swap before getQuote', message: 'quote params', data: { fromId: from.contractId, toId: to.contractId }, hypothesisId: 'H1', timestamp: Date.now() }) }).catch(() => { });
            // #endregion
            let quote;
            try {
                quote = await soroSwapClient.getQuote(from, to, rawAmount, address?.trim());
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes("invalid checksum") || msg.includes("invalid encoded")) {
                    throw new Error("Swap quote failed: invalid key or contract format. Use testnet, XLM/USDC, no secret key for quote only.");
                }
                if (msg.includes("SOROSWAP_API_KEY") ||
                    msg.includes("Quote via contract") ||
                    msg.includes("MismatchingParameterLen")) {
                    throw new Error("Swap quotes need SOROSWAP_API_KEY. Get an API key from the SoroSwap console and set it to get XLM/USDC quotes.");
                }
                throw err;
            }
            if (!privateKey) {
                return {
                    success: false,
                    quote,
                    message: "No privateKey provided. Set privateKey to execute the swap (DEMO ONLY).",
                };
            }
            let result;
            try {
                result = await soroSwapClient.executeSwap(privateKey, quote, network);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes("invalid checksum") || msg.includes("invalid encoded")) {
                    throw new Error("Swap execution failed: use secret key (S...) not address (G...), or omit for quote only.");
                }
                throw err;
            }
            return {
                success: true,
                txHash: result.hash,
                status: result.status,
                quote,
            };
        },
    },
];
//# sourceMappingURL=agentTools.js.map