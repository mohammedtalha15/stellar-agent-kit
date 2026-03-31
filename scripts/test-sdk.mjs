#!/usr/bin/env node
/**
 * Quick test: stellar-agent-kit loads and can initialize (and optionally get a quote).
 * From repo root: npm run build && node scripts/test-sdk.mjs
 * Requires SECRET_KEY (valid Stellar secret). Set SOROSWAP_API_KEY for quote test.
 * Use STELLAR_NETWORK=testnet to run on testnet.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "..", "packages", "stellar-agent-kit", "dist", "index.js");

if (!existsSync(distPath)) {
  console.error("Error: packages/stellar-agent-kit/dist/index.js not found.");
  console.error("Run from repo root: npm run build");
  process.exit(1);
}

let StellarAgentKit, MAINNET_ASSETS, TESTNET_ASSETS;
try {
  const m = await import("../packages/stellar-agent-kit/dist/index.js");
  StellarAgentKit = m.StellarAgentKit;
  MAINNET_ASSETS = m.MAINNET_ASSETS;
  TESTNET_ASSETS = m.TESTNET_ASSETS;
} catch (e) {
  console.error("Error loading stellar-agent-kit:", e.message);
  console.error("Run from repo root: npm run build");
  process.exit(1);
}

const secret = process.env.SECRET_KEY;
if (!secret) {
  console.error("SECRET_KEY is required. Set it in .env or run: SECRET_KEY=your_secret node scripts/test-sdk.mjs");
  process.exit(1);
}

const network = process.env.STELLAR_NETWORK === "testnet" ? "testnet" : "mainnet";
const assets = network === "testnet" ? TESTNET_ASSETS : MAINNET_ASSETS;

async function main() {
  console.log(`1. Loading stellar-agent-kit (${network})... OK`);
  const agent = new StellarAgentKit(secret, network);
  await agent.initialize();
  console.log("2. StellarAgentKit.initialize()... OK");
  if (process.env.SOROSWAP_API_KEY) {
    const quote = await agent.dexGetQuote(assets.XLM, assets.USDC, "10000000");
    console.log("3. dexGetQuote(XLM, USDC, 1)... OK", quote?.protocol ? `(${quote.protocol})` : "");
  } else {
    console.log("3. dexGetQuote... SKIP (set SOROSWAP_API_KEY to test)");
  }
  console.log("Done. stellar-agent-kit works.");
}
main().catch((e) => {
  if (e.message && (e.message.includes("invalid encoded") || e.message.includes("decodeCheck"))) {
    console.error("Error: SECRET_KEY must be a valid Stellar secret key (S...). Check .env or the environment.");
  }
  console.error(e);
  process.exit(1);
});
