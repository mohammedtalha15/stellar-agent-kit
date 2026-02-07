import { z } from "zod";
export const NetworkConfigSchema = z.object({
    horizonUrl: z.string().url(),
    sorobanRpcUrl: z.string().url(),
    friendbotUrl: z.string().url().optional(),
});
export const testnet = {
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
};
export const mainnet = {
    horizonUrl: "https://horizon.stellar.org",
    sorobanRpcUrl: "https://soroban-mainnet.stellar.org",
};
export const networks = {
    testnet,
    mainnet,
};
export function getNetworkConfig(name) {
    const parsed = z.enum(["testnet", "mainnet"]).safeParse(name);
    if (!parsed.success) {
        throw new Error(`Invalid network: ${name}. Use "testnet" or "mainnet".`);
    }
    return networks[parsed.data];
}
//# sourceMappingURL=networks.js.map