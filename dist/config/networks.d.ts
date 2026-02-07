import { z } from "zod";
export declare const NetworkConfigSchema: z.ZodObject<{
    horizonUrl: z.ZodString;
    sorobanRpcUrl: z.ZodString;
    friendbotUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    horizonUrl: string;
    sorobanRpcUrl: string;
    friendbotUrl?: string | undefined;
}, {
    horizonUrl: string;
    sorobanRpcUrl: string;
    friendbotUrl?: string | undefined;
}>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export declare const testnet: NetworkConfig;
export declare const mainnet: NetworkConfig;
export declare const networks: {
    readonly testnet: {
        horizonUrl: string;
        sorobanRpcUrl: string;
        friendbotUrl?: string | undefined;
    };
    readonly mainnet: {
        horizonUrl: string;
        sorobanRpcUrl: string;
        friendbotUrl?: string | undefined;
    };
};
export type NetworkName = keyof typeof networks;
export declare function getNetworkConfig(name: string): NetworkConfig;
//# sourceMappingURL=networks.d.ts.map