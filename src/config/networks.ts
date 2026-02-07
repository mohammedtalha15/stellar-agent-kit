import { z } from "zod";

export const NetworkConfigSchema = z.object({
  horizonUrl: z.string().url(),
  sorobanRpcUrl: z.string().url(),
  friendbotUrl: z.string().url().optional(),
});

export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;

export const testnet: NetworkConfig = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
};

export const mainnet: NetworkConfig = {
  horizonUrl: "https://horizon.stellar.org",
  sorobanRpcUrl: "https://soroban-rpc.mainnet.stellar.gateway.fm",
};

export const networks = {
  testnet,
  mainnet,
} as const;

export type NetworkName = keyof typeof networks;

export function getNetworkConfig(name: string): NetworkConfig {
  const parsed = z.enum(["testnet", "mainnet"]).safeParse(name);
  if (!parsed.success) {
    throw new Error(`Invalid network: ${name}. Use "testnet" or "mainnet".`);
  }
  return networks[parsed.data];
}
