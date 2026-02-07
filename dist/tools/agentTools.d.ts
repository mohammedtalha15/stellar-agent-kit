import { z } from "zod";
import { type QuoteResponse } from "../defi/index.js";
export declare const tools: ({
    name: string;
    description: string;
    parameters: z.ZodObject<{
        address: z.ZodString;
        network: z.ZodDefault<z.ZodOptional<z.ZodEnum<["testnet", "mainnet"]>>>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        network: "testnet" | "mainnet";
    }, {
        address: string;
        network?: "testnet" | "mainnet" | undefined;
    }>;
    execute: ({ address, network, }: {
        address: string;
        network?: "testnet" | "mainnet";
    }) => Promise<{
        balances: import("../core/stellarClient.js").BalanceEntry[];
    }>;
} | {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        fromAsset: z.ZodString;
        toAsset: z.ZodString;
        amount: z.ZodString;
        address: z.ZodString;
        network: z.ZodDefault<z.ZodEnum<["testnet", "mainnet"]>>;
        privateKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        network: "testnet" | "mainnet";
        fromAsset: string;
        toAsset: string;
        amount: string;
        privateKey?: string | undefined;
    }, {
        address: string;
        fromAsset: string;
        toAsset: string;
        amount: string;
        network?: "testnet" | "mainnet" | undefined;
        privateKey?: string | undefined;
    }>;
    execute: ({ fromAsset, toAsset, amount, address, network, privateKey, }: {
        fromAsset: string;
        toAsset: string;
        amount: string;
        address: string;
        network: "testnet" | "mainnet";
        privateKey?: string;
    }) => Promise<{
        success: false;
        quote: QuoteResponse;
        message: string;
        txHash?: undefined;
        status?: undefined;
    } | {
        success: true;
        txHash: string;
        status: string;
        quote: QuoteResponse;
        message?: undefined;
    }>;
})[];
//# sourceMappingURL=agentTools.d.ts.map