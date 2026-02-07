# stellar-defi-agent-kit

Stellar DeFi agent kit for hackathon projects. TypeScript CLI and client for checking balances and sending payments on Stellar (testnet/mainnet).

## Setup

```bash
npm install
npm run build
```

## CLI

### Balance

Get balances for a Stellar address (XLM + trust lines):

```bash
# Testnet (default)
npm run balance -- GABC... --network=testnet

# Or after build
node dist/index.js balance GABC... --network=testnet

# Mainnet
node dist/index.js balance GABC... --network=mainnet
```

Output is JSON array of `{ code, issuer, balance }`.

### Pay

Send XLM or a custom asset:

```bash
# XLM payment
node dist/index.js pay S... G... 10 --network=testnet

# Custom asset
node dist/index.js pay S... G... 100 --network=testnet --asset=USDC --issuer=G...
```

## Programmatic use

```ts
import { getNetworkConfig } from "./config/networks.js";
import { StellarClient } from "./core/stellarClient.js";

const config = getNetworkConfig("testnet");
const client = new StellarClient(config);

const balances = await client.getBalance("G...");
const result = await client.sendPayment("S...", "G...", "10");
```

## Project layout

- `src/config/networks.ts` – testnet/mainnet config (Horizon, Soroban RPC, Friendbot)
- `src/core/stellarClient.ts` – `StellarClient`: `getBalance()`, `sendPayment()`
- `src/index.ts` – CLI (Commander)

## Requirements

- Node 18+
- Zod (validation), Commander (CLI), @stellar/stellar-sdk

## License

MIT
